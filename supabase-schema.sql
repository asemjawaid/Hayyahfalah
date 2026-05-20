-- Hayya Falah — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query

-- Enable Row Level Security on all tables (users only see their own data)

-- ── Prayer logs ──────────────────────────────────────────────────────────────
create table if not exists prayer_logs (
  id          text primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        text not null,
  prayer      text not null,
  status      text not null,
  reason      text,
  note        text,
  logged_at   text not null,
  original_date text
);
alter table prayer_logs enable row level security;
create policy "Users see own prayer logs"
  on prayer_logs for all using (auth.uid() = user_id);
create index if not exists prayer_logs_user_date on prayer_logs(user_id, date);

-- ── Qaza ledger ──────────────────────────────────────────────────────────────
create table if not exists qaza_ledger (
  user_id      uuid references auth.users(id) on delete cascade not null,
  prayer       text not null,
  count        int not null default 0,
  total_made_up int not null default 0,
  last_updated text not null,
  primary key (user_id, prayer)
);
alter table qaza_ledger enable row level security;
create policy "Users see own qaza"
  on qaza_ledger for all using (auth.uid() = user_id);

-- ── Fasting logs ─────────────────────────────────────────────────────────────
create table if not exists fasting_logs (
  id            text primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  date          text not null,
  type          text not null,
  status        text not null,
  reason        text,
  original_date text
);
alter table fasting_logs enable row level security;
create policy "Users see own fasting logs"
  on fasting_logs for all using (auth.uid() = user_id);
create index if not exists fasting_logs_user_date on fasting_logs(user_id, date);

-- ── Night prayer logs ─────────────────────────────────────────────────────────
create table if not exists night_prayer_logs (
  id        text primary key,
  user_id   uuid references auth.users(id) on delete cascade not null,
  date      text not null,
  type      text not null,
  rakats    int,
  completed boolean not null default true,
  note      text,
  logged_at text not null
);
alter table night_prayer_logs enable row level security;
create policy "Users see own night prayers"
  on night_prayer_logs for all using (auth.uid() = user_id);
create index if not exists night_logs_user_date on night_prayer_logs(user_id, date);
