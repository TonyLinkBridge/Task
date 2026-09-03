create table notification_settings (
  id boolean primary key default true check (id = true),
  slack_channel_id text,
  slack_channel_name text,
  reminder_minutes integer not null default 1440
    check (reminder_minutes between 5 and 10080),
  enabled_events jsonb not null default '{
    "submitted": true,
    "first_approved": true,
    "all_approved": true,
    "changes_requested": true,
    "resubmitted": true,
    "publish_advance": true,
    "publish_due": true,
    "publish_due_unapproved": true,
    "published": true
  }'::jsonb,
  updated_by text references profiles(clerk_user_id),
  updated_at timestamptz not null default now()
);

insert into notification_settings (id) values (true);

create table slack_deliveries (
  id uuid primary key default gen_random_uuid(),
  delivery_key text not null unique,
  event_type text not null,
  content_id uuid references contents(id),
  channel_id text not null,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  scheduled_for timestamptz not null,
  next_attempt_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index slack_deliveries_ready_idx
  on slack_deliveries (status, coalesce(next_attempt_at, scheduled_for))
  where status in ('pending', 'failed');

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id text references profiles(clerk_user_id),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_entity_idx
  on audit_events (entity_type, entity_id, created_at desc);
create index audit_events_actor_idx
  on audit_events (actor_id, created_at desc);

alter table notification_settings enable row level security;
alter table slack_deliveries enable row level security;
alter table audit_events enable row level security;
