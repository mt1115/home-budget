-- Initial schema for the home budget app.
-- Run this in Supabase SQL Editor after the project is created.

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid references households(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  household_id uuid primary key references households(id) on delete cascade,
  total_budget integer not null default 800000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  type text not null check (type in ('appliance', 'furniture')),
  name text not null,
  budget_amount integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  maker text,
  model_number text,
  price integer not null default 0,
  url text,
  image_url text,
  shop_name text,
  description text,
  memo text,
  status text not null default 'candidate' check (status in ('candidate', 'selected', 'on_hold', 'purchased')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

create table if not exists item_tags (
  item_id uuid references items(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (item_id, tag_id)
);

alter table households enable row level security;
alter table profiles enable row level security;
alter table settings enable row level security;
alter table categories enable row level security;
alter table items enable row level security;
alter table tags enable row level security;
alter table item_tags enable row level security;