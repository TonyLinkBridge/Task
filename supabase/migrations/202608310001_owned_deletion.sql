create table slack_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  source_delivery_id text,
  content_id text,
  channel_id text not null,
  slack_timestamp text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'deleted', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz,
  deleted_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_id, slack_timestamp)
);

create index slack_deletion_requests_ready_idx
  on slack_deletion_requests (status, coalesce(next_attempt_at, created_at))
  where status in ('pending', 'failed');

alter table slack_deletion_requests enable row level security;

create or replace function claim_slack_deletions(
  p_now timestamptz default now(),
  p_limit integer default 20
) returns setof slack_deletion_requests
language sql
security definer
set search_path = public
as $$
  with ready as (
    select id
    from slack_deletion_requests
    where status in ('pending', 'failed')
      and attempt_count < 5
      and coalesce(next_attempt_at, created_at) <= p_now
    order by coalesce(next_attempt_at, created_at), created_at
    for update skip locked
    limit greatest(1, least(p_limit, 100))
  ), claimed as (
    update slack_deletion_requests request
    set status = 'sending',
      attempt_count = request.attempt_count + 1,
      updated_at = p_now
    from ready
    where request.id = ready.id
    returning request.*
  )
  select * from claimed;
$$;

create or replace function delete_owned_content(
  p_content_id uuid,
  p_actor_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  content_row contents;
  actor_role app_role;
  file_paths jsonb;
begin
  select * into content_row
  from contents
  where id = p_content_id
  for update;
  if content_row.id is null then raise exception 'CONTENT_NOT_FOUND'; end if;

  select role into actor_role
  from profiles
  where clerk_user_id = p_actor_id and archived_at is null;
  if actor_role is null then raise exception 'CONTENT_ACTOR_INVALID'; end if;
  if actor_role <> 'admin' and content_row.author_id <> p_actor_id then
    raise exception 'CONTENT_DELETE_FORBIDDEN';
  end if;

  select coalesce(jsonb_agg(storage_path order by created_at), '[]'::jsonb)
  into file_paths
  from content_attachments
  where content_id = p_content_id;

  insert into slack_deletion_requests (
    source_delivery_id, content_id, channel_id, slack_timestamp
  )
  select id::text, p_content_id::text, channel_id, slack_timestamp
  from slack_deliveries
  where content_id = p_content_id
    and status = 'sent'
    and slack_timestamp is not null
  on conflict (channel_id, slack_timestamp) do nothing;

  delete from slack_deliveries where content_id = p_content_id;
  delete from content_version_attachments
  where content_version_id in (
    select id from content_versions where content_id = p_content_id
  );
  delete from content_approvals where content_id = p_content_id;
  delete from content_review_events where content_id = p_content_id;

  if content_row.linked_task_id is not null then
    update tasks set linked_content_id = null
    where id = content_row.linked_task_id;
    update contents set linked_task_id = null
    where id = p_content_id;
    delete from task_comments where task_id = content_row.linked_task_id;
    delete from tasks where id = content_row.linked_task_id;
  end if;

  delete from contents where id = p_content_id;

  insert into audit_events (
    actor_id, entity_type, entity_id, action, before_data
  ) values (
    p_actor_id,
    'content',
    p_content_id::text,
    'content_deleted',
    jsonb_build_object('title', content_row.title)
  );

  return jsonb_build_object(
    'roomId', content_row.liveblocks_room_id,
    'storagePaths', file_paths
  );
end;
$$;

create or replace function delete_owned_task(
  p_task_id uuid,
  p_actor_id text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  task_row tasks;
  actor_role app_role;
begin
  select * into task_row
  from tasks
  where id = p_task_id
  for update;
  if task_row.id is null then raise exception 'TASK_NOT_FOUND'; end if;
  if task_row.kind = 'content_publish' then
    raise exception 'CONTENT_PUBLISH_TASK_CANNOT_DELETE';
  end if;

  select role into actor_role
  from profiles
  where clerk_user_id = p_actor_id and archived_at is null;
  if actor_role is null then raise exception 'TASK_ACTOR_INVALID'; end if;
  if actor_role <> 'admin' and task_row.creator_id <> p_actor_id then
    raise exception 'TASK_DELETE_FORBIDDEN';
  end if;

  delete from task_comments where task_id = p_task_id;
  delete from tasks where id = p_task_id;

  insert into audit_events (
    actor_id, entity_type, entity_id, action, before_data
  ) values (
    p_actor_id,
    'task',
    p_task_id::text,
    'task_deleted',
    jsonb_build_object('title', task_row.title)
  );

  return true;
end;
$$;

revoke all on function claim_slack_deletions(timestamptz, integer) from public;
revoke all on function delete_owned_content(uuid, text) from public;
revoke all on function delete_owned_task(uuid, text) from public;

do $grant_owned_deletion$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function claim_slack_deletions(timestamptz, integer) to service_role';
    execute 'grant execute on function delete_owned_content(uuid, text) to service_role';
    execute 'grant execute on function delete_owned_task(uuid, text) to service_role';
  end if;
end;
$grant_owned_deletion$;
