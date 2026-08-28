-- Attune: Phase 1 schema. Paste this into the Supabase SQL editor
-- (Project → SQL Editor → New query) and run it once.

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  goal text check (goal in ('lose', 'maintain', 'build')),
  age int,
  weight numeric,
  height numeric,
  unit text check (unit in ('metric', 'imperial')) default 'metric',
  activity text check (activity in ('sedentary', 'light', 'moderate', 'very')),
  calorie_target int,
  protein_g int,
  carbs_g int,
  fat_g int,
  water_target int default 8,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- ── food_logs ───────────────────────────────────────────────────────────────
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_date date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snacks')),
  food_name text not null,
  calories numeric not null default 0,
  protein_g numeric default 0,
  carbs_g numeric default 0,
  fat_g numeric default 0,
  source text,
  created_at timestamptz default now()
);

create index if not exists food_logs_user_date_idx on public.food_logs (user_id, logged_date);

alter table public.food_logs enable row level security;

create policy "food_logs: select own" on public.food_logs
  for select using (auth.uid() = user_id);
create policy "food_logs: insert own" on public.food_logs
  for insert with check (auth.uid() = user_id);
create policy "food_logs: delete own" on public.food_logs
  for delete using (auth.uid() = user_id);

-- ── checkins ────────────────────────────────────────────────────────────────
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checkin_date date not null,
  mood text check (mood in ('great', 'good', 'okay', 'low', 'tired')),
  energy int check (energy between 1 and 10),
  note text,
  created_at timestamptz default now(),
  unique (user_id, checkin_date)
);

alter table public.checkins enable row level security;

create policy "checkins: select own" on public.checkins
  for select using (auth.uid() = user_id);
create policy "checkins: insert own" on public.checkins
  for insert with check (auth.uid() = user_id);
create policy "checkins: update own" on public.checkins
  for update using (auth.uid() = user_id);

-- ── anonymous (guest) sign-ins ─────────────────────────────────────────────
-- In the Supabase dashboard: Authentication → Sign In / Providers →
-- enable "Allow anonymous sign-ins". Required for the app's guest mode.
