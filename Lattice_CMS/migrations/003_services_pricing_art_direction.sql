-- 003_services_pricing_art_direction.sql
-- Services, Packages, Package Features, Art Directions, Hosting Plans, Add-ons, and Enquiries.
-- Idempotent migration with per-command RLS matching Lattice security conventions.

-- 1. Services table
create table if not exists public.services (
  id text primary key,
  name text not null,
  slug text not null unique,
  index_num text not null default '01',
  description text not null default '',
  short_description text not null default '',
  icon text,
  image_url text,
  starting_price numeric not null default 0,
  price_label text not null default '₹3,000+',
  billing_type text not null default 'one_time',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.services enable row level security;

drop policy if exists "services are publicly readable" on public.services;
create policy "services are publicly readable" on public.services
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists "admins can view all services" on public.services;
create policy "admins can view all services" on public.services
  for select to authenticated
  using (is_admin());

drop policy if exists "admins can insert services" on public.services;
create policy "admins can insert services" on public.services
  for insert to authenticated
  with check (is_admin());

drop policy if exists "admins can update services" on public.services;
create policy "admins can update services" on public.services
  for update to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins can delete services" on public.services;
create policy "admins can delete services" on public.services
  for delete to authenticated
  using (is_admin());

-- 2. Service Packages table
create table if not exists public.service_packages (
  id text primary key,
  service_id text not null references public.services(id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  price numeric not null default 0,
  price_label text not null default '₹3,000+',
  billing_type text not null default 'one_time',
  badge text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.service_packages enable row level security;

drop policy if exists "service_packages are publicly readable" on public.service_packages;
create policy "service_packages are publicly readable" on public.service_packages
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists "admins can view all service_packages" on public.service_packages;
create policy "admins can view all service_packages" on public.service_packages
  for select to authenticated
  using (is_admin());

drop policy if exists "admins can insert service_packages" on public.service_packages;
create policy "admins can insert service_packages" on public.service_packages
  for insert to authenticated
  with check (is_admin());

drop policy if exists "admins can update service_packages" on public.service_packages;
create policy "admins can update service_packages" on public.service_packages
  for update to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins can delete service_packages" on public.service_packages;
create policy "admins can delete service_packages" on public.service_packages
  for delete to authenticated
  using (is_admin());

-- 3. Package Features table
create table if not exists public.package_features (
  id uuid primary key default gen_random_uuid(),
  package_id text not null references public.service_packages(id) on delete cascade,
  feature text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.package_features enable row level security;

drop policy if exists "package_features are publicly readable" on public.package_features;
create policy "package_features are publicly readable" on public.package_features
  for select to anon, authenticated
  using (true);

drop policy if exists "admins can insert package_features" on public.package_features;
create policy "admins can insert package_features" on public.package_features
  for insert to authenticated
  with check (is_admin());

drop policy if exists "admins can update package_features" on public.package_features;
create policy "admins can update package_features" on public.package_features
  for update to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins can delete package_features" on public.package_features;
create policy "admins can delete package_features" on public.package_features
  for delete to authenticated
  using (is_admin());

-- 4. Art Directions table
create table if not exists public.art_directions (
  id text primary key,
  name text not null,
  slug text not null unique,
  category text not null default 'international',
  tier text not null default 'standard' check (tier in ('standard', 'signature', 'bespoke')),
  description text not null default '',
  image_url text,
  accent_color text not null default '#7c8cff',
  typography text not null default '',
  tags text[] not null default '{}',
  starting_price numeric not null default 0,
  price_label text not null default 'Included',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.art_directions enable row level security;

drop policy if exists "art_directions are publicly readable" on public.art_directions;
create policy "art_directions are publicly readable" on public.art_directions
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists "admins can view all art_directions" on public.art_directions;
create policy "admins can view all art_directions" on public.art_directions
  for select to authenticated
  using (is_admin());

drop policy if exists "admins can insert art_directions" on public.art_directions;
create policy "admins can insert art_directions" on public.art_directions
  for insert to authenticated
  with check (is_admin());

drop policy if exists "admins can update art_directions" on public.art_directions;
create policy "admins can update art_directions" on public.art_directions
  for update to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins can delete art_directions" on public.art_directions;
create policy "admins can delete art_directions" on public.art_directions
  for delete to authenticated
  using (is_admin());

-- 5. Hosting Plans table
create table if not exists public.hosting_plans (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric not null default 3999,
  price_label text not null default '₹3,999/year',
  billing_type text not null default 'yearly',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.hosting_plans enable row level security;

drop policy if exists "hosting_plans are publicly readable" on public.hosting_plans;
create policy "hosting_plans are publicly readable" on public.hosting_plans
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists "admins can view all hosting_plans" on public.hosting_plans;
create policy "admins can view all hosting_plans" on public.hosting_plans
  for select to authenticated
  using (is_admin());

drop policy if exists "admins can insert hosting_plans" on public.hosting_plans;
create policy "admins can insert hosting_plans" on public.hosting_plans
  for insert to authenticated
  with check (is_admin());

drop policy if exists "admins can update hosting_plans" on public.hosting_plans;
create policy "admins can update hosting_plans" on public.hosting_plans
  for update to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins can delete hosting_plans" on public.hosting_plans;
create policy "admins can delete hosting_plans" on public.hosting_plans
  for delete to authenticated
  using (is_admin());

-- 6. Hosting Plan Features table
create table if not exists public.hosting_plan_features (
  id uuid primary key default gen_random_uuid(),
  hosting_plan_id text not null references public.hosting_plans(id) on delete cascade,
  feature text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.hosting_plan_features enable row level security;

drop policy if exists "hosting_plan_features are publicly readable" on public.hosting_plan_features;
create policy "hosting_plan_features are publicly readable" on public.hosting_plan_features
  for select to anon, authenticated
  using (true);

drop policy if exists "admins can insert hosting_plan_features" on public.hosting_plan_features;
create policy "admins can insert hosting_plan_features" on public.hosting_plan_features
  for insert to authenticated
  with check (is_admin());

drop policy if exists "admins can update hosting_plan_features" on public.hosting_plan_features;
create policy "admins can update hosting_plan_features" on public.hosting_plan_features
  for update to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins can delete hosting_plan_features" on public.hosting_plan_features;
create policy "admins can delete hosting_plan_features" on public.hosting_plan_features
  for delete to authenticated
  using (is_admin());

-- 7. Pricing Add-ons table
create table if not exists public.pricing_addons (
  id text primary key,
  name text not null,
  description text not null default '',
  price numeric not null default 0,
  price_label text not null default '₹2,500+',
  billing_type text not null default 'one_time',
  category text not null default 'Design',
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.pricing_addons enable row level security;

drop policy if exists "pricing_addons are publicly readable" on public.pricing_addons;
create policy "pricing_addons are publicly readable" on public.pricing_addons
  for select to anon, authenticated
  using (is_active = true);

drop policy if exists "admins can view all pricing_addons" on public.pricing_addons;
create policy "admins can view all pricing_addons" on public.pricing_addons
  for select to authenticated
  using (is_admin());

drop policy if exists "admins can insert pricing_addons" on public.pricing_addons;
create policy "admins can insert pricing_addons" on public.pricing_addons
  for insert to authenticated
  with check (is_admin());

drop policy if exists "admins can update pricing_addons" on public.pricing_addons;
create policy "admins can update pricing_addons" on public.pricing_addons
  for update to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins can delete pricing_addons" on public.pricing_addons;
create policy "admins can delete pricing_addons" on public.pricing_addons
  for delete to authenticated
  using (is_admin());

-- 8. Project Enquiries table
create table if not exists public.project_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  business_name text not null default '',
  email text not null,
  phone text not null default '',
  requested_services text[] not null default '{}',
  budget text not null default '',
  description text not null default '',
  status text not null default 'new' check (status in ('new', 'contacted', 'in_progress', 'closed', 'archived')),
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_enquiries enable row level security;

drop policy if exists "public can submit enquiries" on public.project_enquiries;
create policy "public can submit enquiries" on public.project_enquiries
  for insert to anon, authenticated
  with check (true);

drop policy if exists "admins can view enquiries" on public.project_enquiries;
create policy "admins can view enquiries" on public.project_enquiries
  for select to authenticated
  using (is_admin());

drop policy if exists "admins can update enquiries" on public.project_enquiries;
create policy "admins can update enquiries" on public.project_enquiries
  for update to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins can delete enquiries" on public.project_enquiries;
create policy "admins can delete enquiries" on public.project_enquiries
  for delete to authenticated
  using (is_admin());

-- Trigger helpers for updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_touch_updated_at on public.services;
create trigger services_touch_updated_at
  before update on public.services
  for each row execute function public.touch_updated_at();

drop trigger if exists service_packages_touch_updated_at on public.service_packages;
create trigger service_packages_touch_updated_at
  before update on public.service_packages
  for each row execute function public.touch_updated_at();

drop trigger if exists art_directions_touch_updated_at on public.art_directions;
create trigger art_directions_touch_updated_at
  before update on public.art_directions
  for each row execute function public.touch_updated_at();

drop trigger if exists hosting_plans_touch_updated_at on public.hosting_plans;
create trigger hosting_plans_touch_updated_at
  before update on public.hosting_plans
  for each row execute function public.touch_updated_at();

drop trigger if exists pricing_addons_touch_updated_at on public.pricing_addons;
create trigger pricing_addons_touch_updated_at
  before update on public.pricing_addons
  for each row execute function public.touch_updated_at();

drop trigger if exists project_enquiries_touch_updated_at on public.project_enquiries;
create trigger project_enquiries_touch_updated_at
  before update on public.project_enquiries
  for each row execute function public.touch_updated_at();
