create table private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null references profiles(clerk_user_id) on delete cascade,
  recipient_id text not null references profiles(clerk_user_id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index private_messages_sender_idx
  on private_messages (sender_id, created_at desc);
create index private_messages_recipient_idx
  on private_messages (recipient_id, created_at desc);
create index private_messages_unread_idx
  on private_messages (recipient_id, created_at desc)
  where read_at is null;

alter table private_messages enable row level security;
