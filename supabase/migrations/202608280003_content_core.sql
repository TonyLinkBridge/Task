create type content_status as enum (
  'draft', 'in_review', 'changes_requested', 'approved',
  'due', 'published', 'archived'
);

create table platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  color text not null default '#64748b',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table contents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  status content_status not null default 'draft',
  author_id text not null references profiles(clerk_user_id),
  assignee_id text not null references profiles(clerk_user_id),
  publish_at timestamptz not null,
  liveblocks_room_id text not null unique,
  current_version integer not null default 0 check (current_version >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contents_room_matches_id
    check (liveblocks_room_id = 'content:' || id::text)
);

create table content_platforms (
  content_id uuid not null references contents(id) on delete cascade,
  platform_id uuid not null references platforms(id),
  primary key (content_id, platform_id)
);

create table content_comments (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  author_id text not null references profiles(clerk_user_id),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table content_attachments (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 104857600),
  uploader_id text not null references profiles(clerk_user_id),
  created_at timestamptz not null default now()
);

create table content_versions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id) on delete cascade,
  version integer not null check (version > 0),
  blocknote_json jsonb not null,
  created_by text not null references profiles(clerk_user_id),
  created_at timestamptz not null default now(),
  unique (content_id, version)
);

alter table tasks
  add constraint tasks_linked_content_id_fkey
  foreign key (linked_content_id) references contents(id);

create index contents_active_schedule_idx
  on contents (publish_at, status) where archived_at is null;
create index content_comments_content_idx
  on content_comments (content_id, created_at);
create index content_attachments_content_idx
  on content_attachments (content_id, created_at);
create index content_versions_content_idx
  on content_versions (content_id, version desc);

create or replace function create_content(
  p_id uuid,
  p_title text,
  p_author_id text,
  p_assignee_id text,
  p_publish_at timestamptz,
  p_platform_ids uuid[]
) returns contents
language plpgsql
security definer
set search_path = public
as $$
declare
  created_content contents;
  inserted_platforms integer;
begin
  if coalesce(array_length(p_platform_ids, 1), 0) = 0 then
    raise exception 'CONTENT_PLATFORM_REQUIRED';
  end if;

  insert into contents (
    id, title, author_id, assignee_id, publish_at, liveblocks_room_id
  ) values (
    p_id, trim(p_title), p_author_id, p_assignee_id, p_publish_at,
    'content:' || p_id::text
  ) returning * into created_content;

  insert into content_platforms (content_id, platform_id)
  select p_id, platform_id
  from unnest(p_platform_ids) as platform_id
  on conflict do nothing;

  get diagnostics inserted_platforms = row_count;
  if inserted_platforms <> (
    select count(distinct platform_id)
    from unnest(p_platform_ids) as platform_id
  ) then
    raise exception 'CONTENT_PLATFORM_INVALID';
  end if;

  return created_content;
end;
$$;

create or replace function create_content_snapshot(
  p_content_id uuid,
  p_actor_id text,
  p_blocknote_json jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
  snapshot_id uuid;
begin
  select current_version + 1
  into next_version
  from contents
  where id = p_content_id and archived_at is null
  for update;

  if next_version is null then
    raise exception 'CONTENT_NOT_FOUND';
  end if;

  insert into content_versions (
    content_id, version, blocknote_json, created_by
  ) values (
    p_content_id, next_version, p_blocknote_json, p_actor_id
  ) returning id into snapshot_id;

  update contents
  set current_version = next_version, updated_at = now()
  where id = p_content_id;

  return snapshot_id;
end;
$$;

alter table platforms enable row level security;
alter table contents enable row level security;
alter table content_platforms enable row level security;
alter table content_comments enable row level security;
alter table content_attachments enable row level security;
alter table content_versions enable row level security;
