-- 005_bilingual_translations.sql
-- Complete English + Malayalam bilingual architecture for Lattice website & CMS.
-- Idempotent migration with per-command RLS matching Lattice security conventions.

create table if not exists public.content_translations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null, -- 'site_content', 'service', 'service_package', 'package_feature', 'art_direction', 'hosting_plan', 'hosting_plan_feature', 'pricing_addon', 'project', 'team_member', 'ui'
  entity_id text not null,
  language text not null check (language in ('en', 'ml')),
  field_name text not null,
  value text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, language, field_name)
);

create index if not exists idx_content_translations_lookup 
  on public.content_translations (entity_type, entity_id, language);

alter table public.content_translations enable row level security;

drop policy if exists "content_translations are publicly readable" on public.content_translations;
create policy "content_translations are publicly readable" on public.content_translations
  for select to anon, authenticated
  using (true);

drop policy if exists "admins can insert content_translations" on public.content_translations;
create policy "admins can insert content_translations" on public.content_translations
  for insert to authenticated
  with check (is_admin());

drop policy if exists "admins can update content_translations" on public.content_translations;
create policy "admins can update content_translations" on public.content_translations
  for update to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins can delete content_translations" on public.content_translations;
create policy "admins can delete content_translations" on public.content_translations
  for delete to authenticated
  using (is_admin());

drop trigger if exists content_translations_touch_updated_at on public.content_translations;
create trigger content_translations_touch_updated_at
  before update on public.content_translations
  for each row execute function public.touch_updated_at();

-- Seed core Malayalam translations
insert into public.content_translations (entity_type, entity_id, language, field_name, value) values
  ('site_content', '1', 'ml', 'nav.cta', 'സംസാരിക്കാം'),
  ('site_content', '1', 'ml', 'hero.eyebrow', 'ക്രിയേറ്റീവ് ഡിസൈൻ സ്റ്റുഡിയോ'),
  ('site_content', '1', 'ml', 'hero.intro', 'സ്ട്രാറ്റജിയും മികച്ച ക്രാഫ്റ്റും സാങ്കേതികവിദ്യയും സമന്വയിപ്പിച്ച് 3D, വെബ് ഡിസൈൻ & ഡെവലപ്‌മെന്റ്, UI/UX, പരസ്യ കാമ്പെയ്‌നുകൾ എന്നിവ ഒരുക്കുന്ന ക്രിയേറ്റീവ് സ്റ്റുഡിയോയാണ് Lattice.'),
  ('site_content', '1', 'ml', 'hero.scrollLabel', '(01) — കൂടുതൽ അറിയാൻ സ്ക്രോൾ ചെയ്യൂ'),
  ('site_content', '1', 'ml', 'hero.tagline', '3D · വെബ് · UI/UX · പരസ്യങ്ങൾ'),
  ('site_content', '1', 'ml', 'about.label', 'Lattice-നെക്കുറിച്ച്'),
  ('site_content', '1', 'ml', 'about.manifesto', 'ഭാവനയും എഞ്ചിനീയറിംഗും ഒത്തുചേരുന്നിടത്താണ് Lattice പ്രവർത്തിക്കുന്നത്. 3D ലോകങ്ങൾ, വെബ്‌സൈറ്റുകൾ, ഇന്റർഫേസുകൾ, കാമ്പെയ്‌നുകൾ എന്നിവ ഓരോ വിശദാംശങ്ങളും കൃത്യമായി ചിന്തിച്ചാണ് ഞങ്ങൾ ഒരുക്കുന്നത്. കാരണം, ഓർമ്മിക്കപ്പെടുന്നത് ആ ചെറിയ ഡീറ്റെയിലുകളാണ്.'),
  ('site_content', '1', 'ml', 'about.marquee', 'കലയും അത്യാധുനിക സാങ്കേതികവിദ്യയും സമന്വയിപ്പിച്ച് മനസ്സിൽ തങ്ങിനിൽക്കുന്ന 3D, വെബ്, ബ്രാൻഡ് അനുഭവങ്ങൾ Lattice ഒരുക്കുന്നു'),
  ('site_content', '1', 'ml', 'work.label', 'തിരഞ്ഞെടുത്ത വർക്കുകൾ'),
  ('site_content', '1', 'ml', 'work.readMore', 'കൂടുതൽ വായിക്കൂ'),
  ('site_content', '1', 'ml', 'founder.label', 'ടീം'),
  ('site_content', '1', 'ml', 'founder.principleLabel', 'മാർഗ്ഗനിർദ്ദേശ തത്വം'),
  ('site_content', '1', 'ml', 'founder.cta', 'ഞങ്ങളോടൊപ്പം പ്രവർത്തിക്കൂ'),
  ('site_content', '1', 'ml', 'contact.label', 'അവസാനമായി ഒരു കാര്യം'),
  ('site_content', '1', 'ml', 'contact.eyebrow', 'നിങ്ങളുടെ മനസ്സിലുള്ള ആശയം പറയൂ'),
  ('site_content', '1', 'ml', 'contact.heading', 'ഒരു പ്രൊജക്റ്റ് മനസ്സിലുണ്ടോ? ശ്രദ്ധിക്കപ്പെടാതെ പോകാൻ കഴിയാത്ത ഒന്ന് നമുക്ക് ഒരുക്കാം.'),
  ('site_content', '1', 'ml', 'footer.copyright', 'Lattice. എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.'),
  ('site_content', '1', 'ml', 'footer.backToTop', 'മുകളിലേക്ക്'),
  ('service', 'srv_landing', 'ml', 'name', 'ലാൻഡിംഗ് പേജ് & കാമ്പെയ്ൻ വെബ്‌സൈറ്റ്'),
  ('service', 'srv_landing', 'ml', 'short_description', 'കൂടുതൽ ലീഡുകളും വിൽപനയും ലക്ഷ്യമിട്ട് തയ്യാറാക്കുന്ന സിംഗിൾ-പേജ് വെബ്‌സൈറ്റുകൾ.'),
  ('service', 'srv_landing', 'ml', 'description', 'പുതിയ പ്രൊഡക്റ്റ് ലോഞ്ചുകൾ, ഇവന്റുകൾ, പരസ്യ കാമ്പെയ്‌നുകൾ എന്നിവയ്ക്കായി സന്ദർശകരെ ഉപഭോക്താക്കളാക്കി മാറ്റാൻ പ്രത്യേകമായി ഡിസൈൻ ചെയ്ത ലാൻഡിംഗ് പേജുകൾ.'),
  ('service', 'srv_business', 'ml', 'name', 'ബിസിനസ് & കോർപ്പറേറ്റ് വെബ്‌സൈറ്റ്'),
  ('service', 'srv_business', 'ml', 'short_description', 'കമ്പനികൾക്കും സ്റ്റാർട്ടപ്പുകൾക്കും വിശ്വസനീയമായ ഡിജിറ്റൽ സാന്നിധ്യം.'),
  ('service', 'srv_business', 'ml', 'description', 'നിങ്ങളുടെ സ്ഥാപനത്തിന്റെ വിശ്വാസ്യത ഉയർത്തുന്ന, മൊബൈലിലും ഡെസ്ക്ടോപ്പിലും മികച്ച രീതിയിൽ പ്രവർത്തിക്കുന്ന പ്രൊഫഷണൽ വെബ്‌സൈറ്റുകൾ.'),
  ('service', 'srv_ecommerce', 'ml', 'name', 'ഇ-കൊമേഴ്‌സ് & ഡിജിറ്റൽ സ്റ്റോർ'),
  ('service', 'srv_ecommerce', 'ml', 'short_description', 'ഓൺലൈൻ വഴി നേരിട്ട് ഉൽപ്പന്നങ്ങൾ വിൽക്കാനുള്ള ഷോപ്പിംഗ് പ്ലാറ്റ്‌ഫോമുകൾ.'),
  ('service', 'srv_ecommerce', 'ml', 'description', 'സുരക്ഷിതമായ പെയ്‌മെന്റ് ഗേറ്റ്‌വേകളും ഇൻവെന്ററി മാനേജ്‌മെന്റുമുള്ള വേഗതയേറിയ ഓൺലൈൻ സ്റ്റോറുകൾ.'),
  ('service', 'srv_3d_interactive', 'ml', 'name', '3D & ഇന്ററാക്ടീവ് വെബ് അനുഭവം'),
  ('service', 'srv_3d_interactive', 'ml', 'short_description', 'ബ്രൗസറിൽ നേരിട്ട് അനുഭവിക്കാൻ കഴിയുന്ന 3D പ്രൊഡക്റ്റ് വിഷ്വലൈസേഷൻ.'),
  ('service', 'srv_branding', 'ml', 'name', 'ബ്രാൻഡിംഗ് & വിഷ്വൽ ഐഡന്റിറ്റി'),
  ('service', 'srv_branding', 'ml', 'short_description', 'ലോഗോ, ടൈപ്പോഗ്രാഫി, കളർ പാലറ്റ് എന്നിവ അടങ്ങിയ സമ്പൂർണ്ണ ബ്രാൻഡ് ഐഡന്റിറ്റി.'),
  ('service', 'srv_ads', 'ml', 'name', 'പരസ്യങ്ങൾ & ഡിജിറ്റൽ മാർക്കറ്റിംഗ്'),
  ('service', 'srv_ads', 'ml', 'short_description', 'Meta, Google പ്ലാറ്റ്‌ഫോമുകൾക്കായി ഉയർന്ന ROI നൽകുന്ന പരസ്യ കാമ്പെയ്‌നുകൾ.')
on conflict (entity_type, entity_id, language, field_name) 
do update set value = excluded.value, updated_at = now();
