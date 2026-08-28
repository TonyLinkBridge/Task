create type public.app_role as enum ('employee', 'admin');

create table public.profiles (
  clerk_user_id text primary key,
  role public.app_role not null default 'employee',
  display_name text not null,
  avatar_url text,
  slack_team_id text not null,
  slack_verified_at timestamptz not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
