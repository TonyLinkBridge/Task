create table content_approvals (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id),
  version integer not null check (version > 0),
  admin_id text not null references profiles(clerk_user_id),
  approved_at timestamptz not null default now(),
  invalidated_at timestamptz,
  unique (content_id, version, admin_id)
);

create table content_review_events (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id),
  version integer not null check (version >= 0),
  event_type text not null check (
    event_type in (
      'submitted', 'approved', 'changes_requested', 'resubmitted',
      'approval_invalidated', 'published', 'archived'
    )
  ),
  actor_id text not null references profiles(clerk_user_id),
  message text check (message is null or char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);

alter table contents
  add column required_approvals smallint not null default 2
    check (required_approvals in (1, 2)),
  add column requested_reviewer_id text references profiles(clerk_user_id),
  add column published_by text references profiles(clerk_user_id),
  add column published_at timestamptz,
  add column linked_task_id uuid references tasks(id);

update contents
set required_approvals = case
  when exists (
    select 1
    from profiles
    where profiles.clerk_user_id = contents.author_id
      and profiles.role = 'admin'
  ) then 1
  else 2
end;

create index content_approvals_active_idx
  on content_approvals (content_id, version, approved_at)
  where invalidated_at is null;
create index content_review_events_content_idx
  on content_review_events (content_id, created_at desc);

alter table content_approvals enable row level security;
alter table content_review_events enable row level security;
