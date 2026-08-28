alter table slack_deliveries
  add column slack_timestamp text;

create or replace function handle_content_created_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into audit_events (
    actor_id, entity_type, entity_id, action, after_data
  ) values (
    new.author_id,
    'content',
    new.id::text,
    'content_created',
    jsonb_build_object(
      'title', new.title,
      'assigneeId', new.assignee_id,
      'publishAt', new.publish_at
    )
  );
  return new;
end;
$$;

create trigger content_created_audit_trigger
after insert on contents
for each row execute function handle_content_created_audit();

create or replace function build_content_notification_payload(
  p_event text,
  p_content_id uuid,
  p_actor_id text default null
) returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'event', p_event,
    'content', jsonb_build_object(
      'id', c.id::text,
      'title', c.title,
      'publishAt', c.publish_at,
      'assigneeName', assignee.display_name,
      'actorName', actor.display_name,
      'platformNames', coalesce(
        (
          select jsonb_agg(p.name order by p.name)
          from content_platforms cp
          join platforms p on p.id = cp.platform_id
          where cp.content_id = c.id
        ),
        '[]'::jsonb
      )
    )
  )
  from contents c
  join profiles assignee on assignee.clerk_user_id = c.assignee_id
  left join profiles actor on actor.clerk_user_id = p_actor_id
  where c.id = p_content_id;
$$;

create or replace function enqueue_content_notification(
  p_event text,
  p_content_id uuid,
  p_actor_id text default null,
  p_scheduled_for timestamptz default now(),
  p_key_suffix text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  settings notification_settings;
  content_row contents;
  inserted_id uuid;
  message_key text;
begin
  select * into settings from notification_settings where id = true;
  if settings.slack_channel_id is null
     or coalesce((settings.enabled_events ->> p_event)::boolean, false) = false then
    return null;
  end if;

  select * into content_row from contents where id = p_content_id;
  if content_row.id is null then return null; end if;

  message_key := p_event || ':' || p_content_id::text || ':v'
    || content_row.current_version::text || ':'
    || coalesce(p_key_suffix, p_scheduled_for::text);

  insert into slack_deliveries (
    delivery_key, event_type, content_id, channel_id, payload,
    status, scheduled_for
  ) values (
    message_key, p_event, p_content_id, settings.slack_channel_id,
    build_content_notification_payload(p_event, p_content_id, p_actor_id),
    'pending', p_scheduled_for
  )
  on conflict (delivery_key) do nothing
  returning id into inserted_id;

  return inserted_id;
end;
$$;

create or replace function handle_content_review_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_event text;
  approval_count integer;
  required_count integer;
begin
  insert into audit_events (
    actor_id, entity_type, entity_id, action, after_data
  ) values (
    new.actor_id,
    'content',
    new.content_id::text,
    new.event_type,
    jsonb_build_object(
      'version', new.version,
      'message', new.message
    )
  );

  notification_event := case new.event_type
    when 'submitted' then 'submitted'
    when 'resubmitted' then 'resubmitted'
    when 'changes_requested' then 'changes_requested'
    when 'published' then 'published'
    else null
  end;

  if new.event_type = 'approved' then
    select count(distinct a.admin_id)::integer, c.required_approvals
    into approval_count, required_count
    from contents c
    left join content_approvals a
      on a.content_id = c.id
      and a.version = new.version
      and a.invalidated_at is null
    where c.id = new.content_id
    group by c.required_approvals;

    notification_event := case
      when approval_count >= required_count then 'all_approved'
      else 'first_approved'
    end;
  end if;

  if notification_event is not null then
    perform enqueue_content_notification(
      notification_event,
      new.content_id,
      new.actor_id,
      new.created_at,
      new.id::text
    );
  end if;

  return new;
end;
$$;

create trigger content_review_notification_trigger
after insert on content_review_events
for each row execute function handle_content_review_notification();

create or replace function schedule_due_content_notifications(
  p_now timestamptz default now()
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  settings notification_settings;
  content_row contents;
  queued_count integer := 0;
  queued_id uuid;
  due_event text;
begin
  select * into settings from notification_settings where id = true;
  if settings.slack_channel_id is null then return 0; end if;

  for content_row in
    select c.*
    from contents c
    where c.archived_at is null
      and c.status not in ('published', 'archived')
      and c.publish_at > p_now
      and c.publish_at <= p_now + make_interval(mins => settings.reminder_minutes)
  loop
    queued_id := enqueue_content_notification(
      'publish_advance', content_row.id, null, p_now, content_row.publish_at::text
    );
    if queued_id is not null then queued_count := queued_count + 1; end if;
  end loop;

  for content_row in
    select c.*
    from contents c
    where c.archived_at is null
      and c.status not in ('published', 'archived')
      and c.publish_at <= p_now
  loop
    due_event := case
      when content_row.status in ('approved', 'due') then 'publish_due'
      else 'publish_due_unapproved'
    end;
    queued_id := enqueue_content_notification(
      due_event, content_row.id, null, p_now, content_row.publish_at::text
    );
    if queued_id is not null then queued_count := queued_count + 1; end if;

    if content_row.status = 'approved' then
      update contents
      set status = 'due', updated_at = p_now
      where id = content_row.id;
    end if;
  end loop;

  return queued_count;
end;
$$;

create or replace function claim_slack_deliveries(
  p_now timestamptz default now(),
  p_limit integer default 20
) returns setof slack_deliveries
language sql
security definer
set search_path = public
as $$
  with ready as (
    select id
    from slack_deliveries
    where status in ('pending', 'failed')
      and attempt_count < 5
      and scheduled_for <= p_now
      and coalesce(next_attempt_at, scheduled_for) <= p_now
    order by coalesce(next_attempt_at, scheduled_for), created_at
    for update skip locked
    limit greatest(1, least(p_limit, 100))
  ), claimed as (
    update slack_deliveries delivery
    set status = 'sending',
      attempt_count = delivery.attempt_count + 1,
      updated_at = p_now
    from ready
    where delivery.id = ready.id
    returning delivery.*
  )
  select * from claimed;
$$;

revoke all on function build_content_notification_payload(text, uuid, text) from public;
revoke all on function enqueue_content_notification(text, uuid, text, timestamptz, text) from public;
revoke all on function schedule_due_content_notifications(timestamptz) from public;
revoke all on function claim_slack_deliveries(timestamptz, integer) from public;

do $grant_notification_workflow$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function build_content_notification_payload(text, uuid, text) to service_role';
    execute 'grant execute on function enqueue_content_notification(text, uuid, text, timestamptz, text) to service_role';
    execute 'grant execute on function schedule_due_content_notifications(timestamptz) to service_role';
    execute 'grant execute on function claim_slack_deliveries(timestamptz, integer) to service_role';
  end if;
end;
$grant_notification_workflow$;
