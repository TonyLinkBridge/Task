create table inline_comment_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  room_id text not null,
  thread_id text not null,
  comment_id text,
  event_type text not null,
  actor_id text references profiles(clerk_user_id),
  payload jsonb not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index inline_comment_events_room_idx
  on inline_comment_events (room_id, occurred_at);

alter table inline_comment_events enable row level security;
