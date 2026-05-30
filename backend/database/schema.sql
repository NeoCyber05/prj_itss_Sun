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

-- Enable RLS for profiles if not enabled
alter table public.profiles enable row level security;

-- Policies for profiles
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Allow public read access to profiles'
  ) then
    create policy "Allow public read access to profiles"
      on public.profiles for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Allow users to update their own profile'
  ) then
    create policy "Allow users to update their own profile"
      on public.profiles for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end;
$$;

create table if not exists public.slide_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  subject text,
  thumbnail_url text,
  slide_count integer not null default 0 check (slide_count >= 0),
  visibility text not null default 'private' check (visibility in ('private', 'public', 'unlisted')),
  share_settings jsonb not null default '{
    "allowCopy": true,
    "allowEdit": false,
    "allowDownload": false,
    "allowReshare": false
  }'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  rating_average numeric(3, 2) not null default 0 check (rating_average >= 0 and rating_average <= 5),
  rating_count integer not null default 0 check (rating_count >= 0),
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

alter table if exists public.templates
  add column if not exists visibility text not null default 'private'
  check (visibility in ('private', 'public', 'unlisted'));

alter table if exists public.templates
  add column if not exists rating_average numeric(3, 2) not null default 0
  check (rating_average >= 0 and rating_average <= 5);

alter table if exists public.templates
  add column if not exists rating_count integer not null default 0
  check (rating_count >= 0);

alter table if exists public.presentations
  add column if not exists visibility text not null default 'private'
  check (visibility in ('private', 'public', 'unlisted'));

alter table if exists public.slide_templates
  add column if not exists share_settings jsonb not null default '{
    "allowCopy": true,
    "allowEdit": false,
    "allowDownload": false,
    "allowReshare": false
  }'::jsonb;

alter table if exists public.templates
  add column if not exists share_settings jsonb not null default '{
    "allowCopy": true,
    "allowEdit": false,
    "allowDownload": false,
    "allowReshare": false
  }'::jsonb;

alter table if exists public.presentations
  add column if not exists share_settings jsonb not null default '{
    "allowCopy": true,
    "allowEdit": false,
    "allowDownload": false,
    "allowReshare": false
  }'::jsonb;

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

-- Create template ratings table
create table if not exists public.template_ratings (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, user_id)
);

-- Enable RLS for template_ratings
alter table public.template_ratings enable row level security;

-- Policies for template_ratings
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'template_ratings' and policyname = 'Allow public read access to template ratings'
  ) then
    create policy "Allow public read access to template ratings"
      on public.template_ratings for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'template_ratings' and policyname = 'Allow authenticated users to insert their own ratings'
  ) then
    create policy "Allow authenticated users to insert their own ratings"
      on public.template_ratings for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'template_ratings' and policyname = 'Allow users to update their own ratings'
  ) then
    create policy "Allow users to update their own ratings"
      on public.template_ratings for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'template_ratings' and policyname = 'Allow users to delete their own ratings'
  ) then
    create policy "Allow users to delete their own ratings"
      on public.template_ratings for delete
      using (auth.uid() = user_id);
  end if;
end;
$$;

-- Trigger to automatically recalculate and update templates.rating_average and templates.rating_count
create or replace function public.update_template_rating_stats()
returns trigger
language plpgsql
security definer
as $$
declare
  avg_rating numeric(3, 2);
  cnt_rating integer;
  target_id uuid;
begin
  target_id := coalesce(new.template_id, old.template_id);

  -- Calculate rating_average and rating_count from template_ratings
  select coalesce(avg(rating), 0), count(*)
  into avg_rating, cnt_rating
  from public.template_ratings
  where template_id = target_id;

  -- Update templates table
  update public.templates
  set rating_average = round(avg_rating, 1),
      rating_count = cnt_rating
  where id = target_id;

  return null;
end;
$$;

drop trigger if exists tr_template_ratings_change on public.template_ratings;
create trigger tr_template_ratings_change
after insert or update or delete
on public.template_ratings
for each row
execute function public.update_template_rating_stats();

-- Add created_at and updated_at to templates table if not exist
alter table if exists public.templates
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Add trigger to automatically update updated_at on templates table
drop trigger if exists set_templates_updated_at on public.templates;
create trigger set_templates_updated_at
before update on public.templates
for each row execute function public.set_updated_at();

-- Enable RLS for templates and presentations
alter table if exists public.templates enable row level security;
alter table if exists public.presentations enable row level security;

-- Policies for templates
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'templates' and policyname = 'Allow public read access to public templates'
  ) then
    create policy "Allow public read access to public templates"
      on public.templates for select
      using (visibility = 'public');
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'templates' and policyname = 'Allow users to read their own templates'
  ) then
    create policy "Allow users to read their own templates"
      on public.templates for select
      using (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'templates' and policyname = 'Allow users to update their own templates'
  ) then
    create policy "Allow users to update their own templates"
      on public.templates for update
      using (auth.uid() = owner_id)
      with check (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'templates' and policyname = 'Allow users to delete their own templates'
  ) then
    create policy "Allow users to delete their own templates"
      on public.templates for delete
      using (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'templates' and policyname = 'Allow users to insert their own templates'
  ) then
    create policy "Allow users to insert their own templates"
      on public.templates for insert
      with check (auth.uid() = owner_id);
  end if;
end;
$$;

-- Policies for presentations
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'presentations' and policyname = 'Allow public read access to public presentations'
  ) then
    create policy "Allow public read access to public presentations"
      on public.presentations for select
      using (visibility = 'public');
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'presentations' and policyname = 'Allow users to read their own presentations'
  ) then
    create policy "Allow users to read their own presentations"
      on public.presentations for select
      using (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'presentations' and policyname = 'Allow users to update their own presentations'
  ) then
    create policy "Allow users to update their own presentations"
      on public.presentations for update
      using (auth.uid() = owner_id)
      with check (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'presentations' and policyname = 'Allow users to delete their own presentations'
  ) then
    create policy "Allow users to delete their own presentations"
      on public.presentations for delete
      using (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'presentations' and policyname = 'Allow users to insert their own presentations'
  ) then
    create policy "Allow users to insert their own presentations"
      on public.presentations for insert
      with check (auth.uid() = owner_id);
  end if;
end;
$$;

-- Seed static popular slides and recommended slides into templates and presentations tables
do $$
declare
  v_owner_id uuid;
begin
  -- Lấy profile đầu tiên làm owner_id
  select id into v_owner_id from public.profiles limit 1;

  -- Nếu không tìm thấy profile nào, thử lấy user đầu tiên từ auth.users và tự động tạo profile
  if v_owner_id is null then
    select id into v_owner_id from auth.users limit 1;
    
    if v_owner_id is not null then
      insert into public.profiles (id, email, display_name)
      select id, email, coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
      from auth.users
      where id = v_owner_id
      on conflict (id) do nothing;
    end if;
  end if;

  -- Nếu tìm thấy owner_id hợp lệ, thực hiện chèn dữ liệu seed
  if v_owner_id is not null then
    raise notice 'Using owner_id % for seeding templates and presentations.', v_owner_id;
    
    -- Seed vào templates
    insert into public.templates (id, owner_id, title, rating_average, rating_count, visibility)
    values
      ('00000000-0000-0000-0000-000000000001', v_owner_id, 'スタートアップピッチデック', 0.0, 0, 'public'),
      ('00000000-0000-0000-0000-000000000002', v_owner_id, '年間財務報告', 0.0, 0, 'public'),
      ('00000000-0000-0000-0000-000000000003', v_owner_id, '製品ロードマップ', 0.0, 0, 'public'),
      ('00000000-0000-0000-0000-000000000004', v_owner_id, 'チームオンボーディング', 0.0, 0, 'public'),
      ('00000000-0000-0000-0000-000000000005', v_owner_id, '第3四半期報告書', 0.0, 0, 'public'),
      ('00000000-0000-0000-0000-000000000006', v_owner_id, 'マーケティングプレゼンテーション', 0.0, 0, 'public'),
      ('00000000-0000-0000-0000-000000000007', v_owner_id, '新製品ローンチ計画', 0.0, 0, 'public'),
      ('00000000-0000-0000-0000-000000000008', v_owner_id, 'チーム研修資料', 0.0, 0, 'public'),
      ('00000000-0000-0000-0000-000000000009', v_owner_id, '年間売上分析', 0.0, 0, 'public'),
      ('00000000-0000-0000-0000-000000000010', v_owner_id, 'プロジェクト進捗報告', 0.0, 0, 'public'),
      ('00000000-0000-0000-0000-000000000011', v_owner_id, '顧客満足度調査', 0.0, 0, 'public'),
      ('00000000-0000-0000-0000-000000000012', v_owner_id, '事業戦略レビュー', 0.0, 0, 'public')
    on conflict (id) do update set owner_id = excluded.owner_id;

    -- Seed vào presentations
    insert into public.presentations (id, owner_id, title, visibility)
    values
      ('00000000-0000-0000-0000-000000000001', v_owner_id, 'スタートアップピッチデック', 'public'),
      ('00000000-0000-0000-0000-000000000002', v_owner_id, '年間財務報告', 'public'),
      ('00000000-0000-0000-0000-000000000003', v_owner_id, '製品ロードマップ', 'public'),
      ('00000000-0000-0000-0000-000000000004', v_owner_id, 'チームオンボーディング', 'public'),
      ('00000000-0000-0000-0000-000000000005', v_owner_id, '第3四半期報告書', 'public'),
      ('00000000-0000-0000-0000-000000000006', v_owner_id, 'マーケティングプレゼンテーション', 'public'),
      ('00000000-0000-0000-0000-000000000007', v_owner_id, '新製品ローンチ計画', 'public'),
      ('00000000-0000-0000-0000-000000000008', v_owner_id, 'チーム研修資料', 'public'),
      ('00000000-0000-0000-0000-000000000009', v_owner_id, '年間売上分析', 'public'),
      ('00000000-0000-0000-0000-000000000010', v_owner_id, 'プロジェクト進捗報告', 'public'),
      ('00000000-0000-0000-0000-000000000011', v_owner_id, '顧客満足度調査', 'public'),
      ('00000000-0000-0000-0000-000000000012', v_owner_id, '事業戦略レビュー', 'public')
    on conflict (id) do update set owner_id = excluded.owner_id;
  else
    raise warning 'No profiles or auth.users found! Please sign up a user in the web application first, then run this SQL script again to successfully seed static slide templates.';
  end if;
end $$;

notify pgrst, 'reload schema';
