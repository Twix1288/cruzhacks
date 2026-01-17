-- 1. Setup & Enums
create extension if not exists postgis;
create type hazard_level as enum ('safe', 'low', 'medium', 'high', 'critical');
create type report_status as enum ('pending', 'verified', 'resolved');

-- 2. Profiles (User Roles)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text,
  avatar_url text,
  role text default 'scout', -- 'scout' vs 'ranger'
  xp_points int default 0,
  updated_at timestamptz default now()
);

-- 3. Reports (The Data)
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  created_at timestamptz default now(),
  species_name text not null,
  description text,
  hazard_rating hazard_level default 'low',
  is_invasive boolean default false,
  confidence_score float check (confidence_score >= 0 and confidence_score <= 1.0),
  image_url text not null,
  location geography(POINT) not null, -- Stores GPS efficiently
  location_name text,
  status report_status default 'pending'
);

-- 4. Row Level Security (The "Security Wall")
alter table public.reports enable row level security;
alter table public.profiles enable row level security;

-- Function to check role
create or replace function public.is_ranger() returns boolean as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'ranger');
$$ language sql security definer;

-- POLICY: Students see ONLY their own data
create policy "Students see own reports" on public.reports for select 
using ( auth.uid() = user_id );

-- POLICY: Rangers see medium/high hazard invasive species from everyone
create policy "Rangers see threats" on public.reports for select 
using ( is_ranger() = true AND is_invasive = true AND hazard_rating IN ('medium', 'high', 'critical') );

-- POLICY: Universal Upload
create policy "Universal Insert" on public.reports for insert 
with check ( auth.uid() = user_id );

-- POLICY: Profiles are viewable by everyone (for leaderboards/avatars) or just owner? 
-- Let's stick to owner for now to be safe, or public if needed for leaderboards.
create policy "Public profiles" on public.profiles for select
using ( true );

create policy "Users update own profile" on public.profiles for update
using ( auth.uid() = id );
