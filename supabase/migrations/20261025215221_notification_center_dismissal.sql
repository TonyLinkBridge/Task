-- Bell dismissal is personal presentation state, not a deletion of notification history.
alter table public.in_app_notifications add column if not exists dismissed_at timestamptz;
create index if not exists in_app_notifications_bell_idx
  on public.in_app_notifications(recipient_id, created_at desc)
  where dismissed_at is null;
comment on column public.in_app_notifications.dismissed_at is
  'Hidden from recipient notification bell; the original notification remains in inbox/history.';
