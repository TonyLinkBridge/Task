create table task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 104857600),
  uploader_id text not null references profiles(clerk_user_id),
  created_at timestamptz not null default now()
);

create index task_attachments_task_idx
  on task_attachments (task_id, created_at);

alter table task_attachments enable row level security;
