create or replace function update_scheduled_content(
  p_content_id uuid,
  p_actor_id text,
  p_title text,
  p_assignee_id text,
  p_publish_at timestamptz,
  p_platform_ids uuid[]
) returns contents
language plpgsql
security definer
set search_path = public
as $$
declare
  content_row contents;
  updated_content contents;
  actor_role app_role;
  assignee_exists boolean;
  requested_platforms integer;
  valid_platforms integer;
  updated_tasks integer;
  before_platform_ids jsonb;
  after_platform_ids jsonb;
  publish_time_changed boolean;
  settings notification_settings;
  advance_scheduled_for timestamptz;
begin
  if trim(p_title) = '' then
    raise exception 'CONTENT_TITLE_REQUIRED';
  end if;
  if coalesce(array_length(p_platform_ids, 1), 0) = 0 then
    raise exception 'CONTENT_PLATFORM_REQUIRED';
  end if;

  select * into content_row
  from contents
  where id = p_content_id and archived_at is null
  for update;
  if content_row.id is null then
    raise exception 'CONTENT_NOT_FOUND';
  end if;
  if content_row.status not in ('draft', 'changes_requested') then
    raise exception 'CONTENT_NOT_EDITABLE';
  end if;

  select role into actor_role
  from profiles
  where clerk_user_id = p_actor_id and archived_at is null;
  if actor_role is null then
    raise exception 'CONTENT_FORBIDDEN';
  end if;
  if actor_role <> 'admin'
     and p_actor_id <> content_row.author_id
     and p_actor_id <> content_row.assignee_id then
    raise exception 'CONTENT_FORBIDDEN';
  end if;

  select exists (
    select 1 from profiles
    where clerk_user_id = p_assignee_id and archived_at is null
  ) into assignee_exists;
  if not assignee_exists then
    raise exception 'CONTENT_ASSIGNEE_INVALID';
  end if;

  select count(distinct platform_id)::integer
  into requested_platforms
  from unnest(p_platform_ids) as platform_id;

  select count(*)::integer
  into valid_platforms
  from platforms
  where id = any(p_platform_ids) and archived_at is null;

  if valid_platforms <> requested_platforms then
    raise exception 'CONTENT_PLATFORM_INVALID';
  end if;

  publish_time_changed := content_row.publish_at is distinct from p_publish_at;

  select coalesce(
    jsonb_agg(cp.platform_id order by cp.platform_id),
    '[]'::jsonb
  ) into before_platform_ids
  from content_platforms cp
  where cp.content_id = p_content_id;

  update contents
  set title = trim(p_title),
    assignee_id = p_assignee_id,
    publish_at = p_publish_at,
    updated_at = now()
  where id = p_content_id
  returning * into updated_content;

  delete from content_platforms where content_id = p_content_id;
  insert into content_platforms (content_id, platform_id)
  select p_content_id, platform_id
  from (
    select distinct platform_id from unnest(p_platform_ids) as platform_id
  ) selected;

  select coalesce(
    jsonb_agg(cp.platform_id order by cp.platform_id),
    '[]'::jsonb
  ) into after_platform_ids
  from content_platforms cp
  where cp.content_id = p_content_id;

  update tasks
  set title = left('发布 ' || trim(p_title) || ' 内容', 200),
    assignee_id = p_assignee_id,
    due_at = p_publish_at,
    updated_at = now()
  where id = content_row.linked_task_id and archived_at is null;
  get diagnostics updated_tasks = row_count;
  if updated_tasks <> 1 then
    raise exception 'CONTENT_TASK_NOT_FOUND';
  end if;

  if publish_time_changed then
    update slack_deliveries
    set status = 'cancelled',
      next_attempt_at = null,
      last_error = null,
      updated_at = now()
    where content_id = p_content_id
      and event_type in (
        'publish_advance',
        'publish_due',
        'publish_due_unapproved'
      )
      and status in ('pending', 'failed');

    select * into settings from notification_settings where id = true;
    if settings.id is not null then
      advance_scheduled_for := p_publish_at
        - make_interval(mins => settings.reminder_minutes);
      perform enqueue_content_notification(
        'publish_advance',
        p_content_id,
        p_actor_id,
        greatest(now(), advance_scheduled_for),
        'rescheduled:' || p_publish_at::text
      );
    end if;
  end if;

  insert into audit_events (
    actor_id, entity_type, entity_id, action, before_data, after_data
  ) values (
    p_actor_id,
    'content',
    p_content_id::text,
    'content_updated',
    jsonb_build_object(
      'title', content_row.title,
      'assigneeId', content_row.assignee_id,
      'publishAt', content_row.publish_at,
      'platformIds', before_platform_ids
    ),
    jsonb_build_object(
      'title', updated_content.title,
      'assigneeId', updated_content.assignee_id,
      'publishAt', updated_content.publish_at,
      'platformIds', after_platform_ids
    )
  );

  return updated_content;
end;
$$;

revoke all on function update_scheduled_content(
  uuid, text, text, text, timestamptz, uuid[]
) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function update_scheduled_content(uuid, text, text, text, timestamptz, uuid[]) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on function update_scheduled_content(uuid, text, text, text, timestamptz, uuid[]) from authenticated';
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function update_scheduled_content(uuid, text, text, text, timestamptz, uuid[]) to service_role';
  end if;
end;
$$;
