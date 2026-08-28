create type task_status as enum ('todo', 'in_progress', 'review', 'done');
create type task_priority as enum ('low', 'medium', 'urgent');
create type task_kind as enum ('general', 'content_publish');

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  kind task_kind not null default 'general',
  assignee_id text not null references profiles(clerk_user_id),
  creator_id text not null references profiles(clerk_user_id),
  due_at timestamptz not null,
  position numeric not null default 1000,
  linked_content_id uuid,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id),
  author_id text not null references profiles(clerk_user_id),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index tasks_active_board_idx
  on tasks (status, position)
  where archived_at is null;
create index tasks_assignee_idx
  on tasks (assignee_id)
  where archived_at is null;
create index task_comments_task_idx
  on task_comments (task_id, created_at);

alter table tasks enable row level security;
alter table task_comments enable row level security;
