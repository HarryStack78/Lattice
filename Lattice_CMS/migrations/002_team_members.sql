-- Team section: founder(s), co-founders and members, replacing the single site_content.founder object.
-- Run this once in the Supabase SQL editor (or via the Supabase MCP tools) for this project.
-- Safe to re-run: every statement is idempotent.

create table if not exists public.team_members (
  id text primary key,  -- a slug, e.g. "ariana-cole" (same convention as projects.id)
  tier text not null default 'member' check (tier in ('founder', 'member')),
  status text not null default 'active' check (status in ('active', 'upcoming')),
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  name text not null,
  role text not null default '',
  initials text not null default '',
  photo_url text,
  bio text[] not null default '{}',
  principle text,              -- "guiding principle" quote; only shown on founder/co-founder cards
  focus text[] not null default '{}',
  social_links jsonb not null default '[]',  -- [{ "platform": "LinkedIn", "url": "https://…" }, …]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.team_members enable row level security;

-- Per-command policies, matching the existing convention on projects/media — NOT a single
-- FOR ALL policy. A FOR ALL policy combines with the SELECT policy on every read, which forces
-- Postgres to evaluate is_admin() even for anonymous SELECTs, and anon deliberately has no
-- EXECUTE grant on is_admin() (see the project's revoke_execute_from_public migration) — that
-- combination breaks public reads with "permission denied for function is_admin".
drop policy if exists "admins manage team_members" on public.team_members;

drop policy if exists "team_members are publicly readable" on public.team_members;
create policy "team_members are publicly readable" on public.team_members
  for select to anon, authenticated
  using (is_enabled = true);

drop policy if exists "admins can insert team_members" on public.team_members;
create policy "admins can insert team_members" on public.team_members
  for insert to authenticated
  with check (is_admin());

drop policy if exists "admins can update team_members" on public.team_members;
create policy "admins can update team_members" on public.team_members
  for update to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins can delete team_members" on public.team_members;
create policy "admins can delete team_members" on public.team_members
  for delete to authenticated
  using (is_admin());

-- Keep updated_at current on every write.
create or replace function public.touch_team_members_updated_at()
returns trigger language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists team_members_touch_updated_at on public.team_members;
create trigger team_members_touch_updated_at
  before update on public.team_members
  for each row execute function public.touch_team_members_updated_at();

-- Migrate the existing single founder (site_content.founder) into the first team_members row,
-- if one hasn't already been migrated.
insert into public.team_members (id, tier, status, sort_order, name, role, initials, photo_url, bio, principle, focus, social_links)
select
  'founder',
  'founder',
  'active',
  0,
  content->'founder'->>'name',
  content->'founder'->>'role',
  content->'founder'->>'initials',
  content->'founder'->>'photo',
  coalesce((select array_agg(x) from jsonb_array_elements_text(content->'founder'->'bio') as x), '{}'),
  content->'founder'->>'principle',
  coalesce((select array_agg(x) from jsonb_array_elements_text(content->'founder'->'focus') as x), '{}'),
  '[]'::jsonb
from public.site_content
where id = 1
  and content ? 'founder'
  and (content->'founder'->>'name') is not null
  and not exists (select 1 from public.team_members where tier = 'founder');

-- Trim site_content.founder down to the section-level strings; per-person fields now live in
-- team_members. Safe no-op if already trimmed.
update public.site_content
set content = jsonb_set(
  content,
  '{founder}',
  jsonb_build_object(
    'label', content->'founder'->>'label',
    'principleLabel', content->'founder'->>'principleLabel',
    'cta', content->'founder'->>'cta'
  )
)
where id = 1 and content ? 'founder' and (content->'founder' ? 'name');

-- 2-5 mock members so the feature is verifiable end to end. Skipped if members already exist
-- (only the founder row, inserted above, would be present on a first run).
insert into public.team_members (id, tier, status, sort_order, name, role, initials, photo_url, bio, focus, social_links)
select * from (values
  ('ariana-cole', 'member', 'active', 1, 'Ariana Cole', '3D Artist & Motion Designer', 'AC', null,
    array['Ariana builds the studio''s 3D worlds — product visualisation, launch films and real-time WebGL scenes.'],
    array['3D', 'Motion', 'WebGL'],
    '[{"platform":"LinkedIn","url":"https://linkedin.com/in/arianacole"},{"platform":"Instagram","url":"https://instagram.com/arianacole.3d"}]'::jsonb),
  ('marcus-reyes', 'member', 'active', 2, 'Marcus Reyes', 'UI/UX Designer', 'MR', null,
    array['Marcus shapes flows and interfaces around how people actually behave, from research through to pixel-level polish.'],
    array['UI/UX', 'Design Systems'],
    '[{"platform":"LinkedIn","url":"https://linkedin.com/in/marcusreyes"},{"platform":"Website","url":"https://marcusreyes.design"}]'::jsonb),
  ('priya-nathan', 'member', 'active', 3, 'Priya Nathan', 'Web Developer', 'PN', null,
    array['Priya turns art-directed designs into fast, accessible websites and full platforms on modern stacks.'],
    array['Web', 'Front-end'],
    '[{"platform":"GitHub","url":"https://github.com/priyanathan"},{"platform":"LinkedIn","url":"https://linkedin.com/in/priyanathan"}]'::jsonb),
  ('devon-blake', 'member', 'upcoming', 4, 'Devon Blake', 'Art Director', 'DB', null,
    array[]::text[],
    array['Advertising', 'Art Direction'],
    '[{"platform":"Instagram","url":"https://instagram.com/devonblake"}]'::jsonb)
) as seed(id, tier, status, sort_order, name, role, initials, photo_url, bio, focus, social_links)
where not exists (select 1 from public.team_members where tier = 'member');

-- content_backups gets a team_members snapshot column too, so restoring an old version restores
-- the team along with everything else.
alter table public.content_backups add column if not exists team_members jsonb not null default '[]'::jsonb;
