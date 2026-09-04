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
  calorie_mode text check (calorie_mode in ('calculated', 'custom', 'adaptive')) default 'calculated',
  water_target int default 8,
  onboarding_completed boolean default false,
  is_premium boolean default false,
  theme text check (theme in ('light', 'dark')) default 'dark',
  reminder_enabled boolean default false,
  reminder_time text default '19:00',
  reminder_timezone text,
  reminder_last_sent_date date,
  photo_scans_used int not null default 0,
  photo_scans_period_start date not null default current_date,
  menu_scans_used int not null default 0,
  menu_scans_period_start date not null default current_date,
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
  fibre_g numeric default 0,
  sodium_mg numeric default 0,
  sugar_g numeric default 0,
  saturated_fat_g numeric default 0,
  trans_fat_g numeric default 0,
  cholesterol_mg numeric default 0,
  potassium_mg numeric default 0,
  added_sugar_g numeric default 0,
  vitamin_d_mcg numeric default 0,
  calcium_mg numeric default 0,
  iron_mg numeric default 0,
  serving_grams numeric,
  logged_at timestamptz,
  source text,
  created_at timestamptz default now()
);

create index if not exists food_logs_user_date_idx on public.food_logs (user_id, logged_date);

alter table public.food_logs enable row level security;

create policy "food_logs: select own" on public.food_logs
  for select using (auth.uid() = user_id);
create policy "food_logs: insert own" on public.food_logs
  for insert with check (auth.uid() = user_id);
create policy "food_logs: update own" on public.food_logs
  for update using (auth.uid() = user_id);
create policy "food_logs: delete own" on public.food_logs
  for delete using (auth.uid() = user_id);

-- ── checkins ────────────────────────────────────────────────────────────────
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  checkin_date date not null,
  mood text check (mood in ('great', 'good', 'okay', 'low', 'tired')),
  energy int check (energy between 1 and 10),
  water_glasses int default 0,
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

-- ── weight_logs ─────────────────────────────────────────────────────────────
-- One entry per day (unique per user+date, upsert on conflict) so logging
-- again the same day just updates rather than creating duplicates.
create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_date date not null,
  weight numeric not null,
  unit text not null default 'kg' check (unit in ('kg', 'lb')),
  created_at timestamptz default now(),
  unique (user_id, logged_date)
);

alter table public.weight_logs enable row level security;

create policy "weight_logs: select own" on public.weight_logs
  for select using (auth.uid() = user_id);
create policy "weight_logs: insert own" on public.weight_logs
  for insert with check (auth.uid() = user_id);
create policy "weight_logs: update own" on public.weight_logs
  for update using (auth.uid() = user_id);
create policy "weight_logs: delete own" on public.weight_logs
  for delete using (auth.uid() = user_id);

-- ── custom_foods ────────────────────────────────────────────────────────────
-- User-created foods that aren't in the USDA/Open Food Facts/curated
-- databases (MyFitnessPal-style "Create a Food"). Once created, these show
-- up in that user's own search results and quick-add going forward.
create table if not exists public.custom_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  brand text,
  serving_label text not null default '1 serving',
  serving_grams numeric,
  calories numeric not null default 0,
  protein_g numeric default 0,
  carbs_g numeric default 0,
  fat_g numeric default 0,
  fibre_g numeric default 0,
  sodium_mg numeric default 0,
  sugar_g numeric default 0,
  created_at timestamptz default now()
);

alter table public.custom_foods enable row level security;

create policy "custom_foods: select own" on public.custom_foods
  for select using (auth.uid() = user_id);
create policy "custom_foods: insert own" on public.custom_foods
  for insert with check (auth.uid() = user_id);
create policy "custom_foods: delete own" on public.custom_foods
  for delete using (auth.uid() = user_id);

-- ── saved_meals ─────────────────────────────────────────────────────────────
-- A named bundle of foods (MyFitnessPal-style "Meals"/recipes) that logs as
-- one action. `items` is a snapshot of each food's macros at save time, so a
-- saved meal still logs correctly even if the source food later changes.
create table if not exists public.saved_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  items jsonb not null default '[]',
  created_at timestamptz default now()
);

alter table public.saved_meals enable row level security;

create policy "saved_meals: select own" on public.saved_meals
  for select using (auth.uid() = user_id);
create policy "saved_meals: insert own" on public.saved_meals
  for insert with check (auth.uid() = user_id);
create policy "saved_meals: delete own" on public.saved_meals
  for delete using (auth.uid() = user_id);

-- ── favourite_foods ─────────────────────────────────────────────────────────
-- Foods the user has manually starred for quick access, snapshotted at the
-- time of favouriting (like custom_foods/saved_meals) since a favourite can
-- come from any live search source (FatSecret, Open Food Facts), not just
-- our own tables. Unique per (user, name) so starring twice just re-saves.
create table if not exists public.favourite_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  brand text,
  serving_label text not null default '1 serving',
  serving_grams numeric,
  calories numeric not null default 0,
  protein_g numeric default 0,
  carbs_g numeric default 0,
  fat_g numeric default 0,
  fibre_g numeric default 0,
  sodium_mg numeric default 0,
  sugar_g numeric default 0,
  saturated_fat_g numeric default 0,
  trans_fat_g numeric default 0,
  cholesterol_mg numeric default 0,
  potassium_mg numeric default 0,
  added_sugar_g numeric default 0,
  vitamin_d_mcg numeric default 0,
  calcium_mg numeric default 0,
  iron_mg numeric default 0,
  source text,
  created_at timestamptz default now(),
  unique (user_id, name)
);

alter table public.favourite_foods enable row level security;

create policy "favourite_foods: select own" on public.favourite_foods
  for select using (auth.uid() = user_id);
create policy "favourite_foods: insert own" on public.favourite_foods
  for insert with check (auth.uid() = user_id);
create policy "favourite_foods: update own" on public.favourite_foods
  for update using (auth.uid() = user_id);
create policy "favourite_foods: delete own" on public.favourite_foods
  for delete using (auth.uid() = user_id);

-- ── push_subscriptions ──────────────────────────────────────────────────────
-- Browser push subscriptions for reminder notifications. One row per
-- device/browser (a user logged in on two devices gets two rows). Only
-- ever written by the client for their own rows; only ever read by the
-- send-reminders cron job, which uses the service-role key and so bypasses
-- RLS entirely (it needs to read across all users, not just one).
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: select own" on public.push_subscriptions
  for select using (auth.uid() = user_id);
create policy "push_subscriptions: insert own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "push_subscriptions: delete own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- ── anonymous (guest) sign-ins ─────────────────────────────────────────────
-- In the Supabase dashboard: Authentication → Sign In / Providers →
-- enable "Allow anonymous sign-ins". Required for the app's guest mode.
