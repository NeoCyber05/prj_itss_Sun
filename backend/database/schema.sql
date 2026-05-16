create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  provider text not null default 'email',
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.slide_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  subject text,
  thumbnail_url text,
  slide_count integer not null default 0 check (slide_count >= 0),
  visibility text not null default 'private' check (visibility in ('private', 'public', 'unlisted')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  rating_average numeric(3, 2) not null default 0 check (rating_average >= 0 and rating_average <= 5),
  view_count integer not null default 0 check (view_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.template_slides (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.slide_templates(id) on delete cascade,
  position integer not null check (position >= 1),
  title text,
  layout text not null default 'default',
  content jsonb not null default '{}'::jsonb,
  speaker_notes text,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, position)
);

create index if not exists idx_slide_templates_owner_id
  on public.slide_templates(owner_id);

create index if not exists idx_slide_templates_status_visibility
  on public.slide_templates(status, visibility);

create index if not exists idx_template_slides_template_id_position
  on public.template_slides(template_id, position);

-- Frontend runtime tables use templates / presentations / slide_pages.
-- Track when a user opens a saved deck so the Home page can show real recent slides.
alter table if exists public.templates
  add column if not exists last_opened_at timestamptz;

alter table if exists public.presentations
  add column if not exists last_opened_at timestamptz;

do $$
begin
  if to_regclass('public.templates') is not null then
    create index if not exists idx_templates_owner_last_opened_at
      on public.templates(owner_id, last_opened_at desc)
      where last_opened_at is not null;
  end if;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_slide_templates_updated_at on public.slide_templates;
create trigger set_slide_templates_updated_at
before update on public.slide_templates
for each row execute function public.set_updated_at();

drop trigger if exists set_template_slides_updated_at on public.template_slides;
create trigger set_template_slides_updated_at
before update on public.template_slides
for each row execute function public.set_updated_at();
