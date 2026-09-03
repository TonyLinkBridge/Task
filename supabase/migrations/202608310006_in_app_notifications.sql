create table in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id text not null references profiles(clerk_user_id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 500),
  href text not null check (href like '/%'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index in_app_notifications_recipient_idx
  on in_app_notifications (recipient_id, created_at desc);
create index in_app_notifications_unread_idx
  on in_app_notifications (recipient_id, created_at desc)
  where read_at is null;

alter table in_app_notifications enable row level security;

create or replace function notify_task_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient text;
  notification_title text;
begin
  if tg_op = 'INSERT' then
    notification_title := '你有新任务';
  elsif new.status is distinct from old.status then
    notification_title := '任务状态已更新';
  else
    return new;
  end if;

  foreach recipient in array new.assignee_ids loop
    insert into in_app_notifications (recipient_id, title, body, href)
    values (
      recipient,
      notification_title,
      new.title,
      '/tasks/' || new.id::text
    );
  end loop;
  return new;
end;
$$;

create trigger tasks_in_app_notification_trigger
after insert or update of status on tasks
for each row execute function notify_task_members();

create or replace function notify_task_comment_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  task_row tasks;
  recipient text;
begin
  select * into task_row from tasks where id = new.task_id;
  foreach recipient in array task_row.assignee_ids loop
    if recipient <> new.author_id then
      insert into in_app_notifications (recipient_id, title, body, href)
      values (
        recipient,
        '任务有新留言',
        task_row.title,
        '/tasks/' || task_row.id::text
      );
    end if;
  end loop;
  return new;
end;
$$;

create trigger task_comments_in_app_notification_trigger
after insert on task_comments
for each row execute function notify_task_comment_members();

create or replace function notify_content_review_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  content_title text;
  recipient text;
begin
  select title into content_title from contents where id = new.content_id;
  for recipient in
    select clerk_user_id from profiles
    where archived_at is null and clerk_user_id <> new.actor_id
  loop
    insert into in_app_notifications (recipient_id, title, body, href)
    values (
      recipient,
      '内容审核有新进度',
      content_title,
      '/content/' || new.content_id::text
    );
  end loop;
  return new;
end;
$$;

do $content_notification_trigger$
begin
  if to_regclass('public.content_review_events') is not null then
    execute 'create trigger content_review_in_app_notification_trigger
      after insert on content_review_events
      for each row execute function notify_content_review_members()';
  end if;
end;
$content_notification_trigger$;
