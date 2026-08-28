create or replace function create_scheduled_content(
  p_id uuid,
  p_title text,
  p_author_id text,
  p_assignee_id text,
  p_publish_at timestamptz,
  p_platform_ids uuid[]
) returns contents
language plpgsql
security definer
set search_path = public
as $$
declare
  created_content contents;
  publish_task_id uuid;
  author_role app_role;
  inserted_platforms integer;
begin
  if trim(p_title) = '' then
    raise exception 'CONTENT_TITLE_REQUIRED';
  end if;
  if coalesce(array_length(p_platform_ids, 1), 0) = 0 then
    raise exception 'CONTENT_PLATFORM_REQUIRED';
  end if;

  select role into author_role
  from profiles
  where clerk_user_id = p_author_id and archived_at is null;
  if author_role is null then
    raise exception 'CONTENT_AUTHOR_INVALID';
  end if;

  insert into contents (
    id, title, author_id, assignee_id, publish_at, liveblocks_room_id,
    required_approvals
  ) values (
    p_id, trim(p_title), p_author_id, p_assignee_id, p_publish_at,
    'content:' || p_id::text,
    case when author_role = 'admin' then 1 else 2 end
  ) returning * into created_content;

  insert into content_platforms (content_id, platform_id)
  select p_id, platform_id
  from unnest(p_platform_ids) as platform_id
  on conflict do nothing;

  get diagnostics inserted_platforms = row_count;
  if inserted_platforms <> (
    select count(distinct platform_id)
    from unnest(p_platform_ids) as platform_id
  ) then
    raise exception 'CONTENT_PLATFORM_INVALID';
  end if;

  insert into tasks (
    title, description, status, priority, kind, assignee_id, creator_id,
    due_at, position, linked_content_id
  ) values (
    '发布 ' || trim(p_title) || ' 内容', '', 'todo', 'medium',
    'content_publish', p_assignee_id, p_author_id, p_publish_at, 1000, p_id
  ) returning id into publish_task_id;

  update contents
  set linked_task_id = publish_task_id
  where id = p_id
  returning * into created_content;

  return created_content;
end;
$$;

with missing_content as (
  select c.id, c.title, c.assignee_id, c.author_id, c.publish_at, c.status
  from contents c
  where c.linked_task_id is null and c.archived_at is null
), created_task as (
  insert into tasks (
    title, description, status, priority, kind, assignee_id, creator_id,
    due_at, position, linked_content_id
  )
  select
    '发布 ' || title || ' 内容', '',
    case when status = 'published' then 'done'::task_status else 'todo'::task_status end,
    'medium', 'content_publish',
    assignee_id, author_id, publish_at, 1000, id
  from missing_content
  returning id, linked_content_id
)
update contents c
set linked_task_id = created_task.id
from created_task
where c.id = created_task.linked_content_id;

create unique index tasks_one_publish_task_per_content_idx
  on tasks (linked_content_id)
  where linked_content_id is not null;
create unique index contents_one_linked_task_idx
  on contents (linked_task_id)
  where linked_task_id is not null;

drop function create_content(uuid, text, text, text, timestamptz, uuid[]);

create or replace function save_content_attachment(
  p_content_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text,
  p_byte_size bigint,
  p_uploader_id text
) returns content_attachments
language plpgsql
security definer
set search_path = public
as $$
declare
  content_row contents;
  attachment_row content_attachments;
begin
  select * into content_row
  from contents
  where id = p_content_id and archived_at is null
  for update;
  if content_row.id is null then raise exception 'CONTENT_NOT_FOUND'; end if;
  if content_row.status not in ('draft', 'changes_requested') then
    raise exception 'CONTENT_NOT_EDITABLE';
  end if;

  insert into content_attachments (
    content_id, storage_path, file_name, mime_type, byte_size, uploader_id
  ) values (
    p_content_id, p_storage_path, p_file_name, p_mime_type,
    p_byte_size, p_uploader_id
  ) returning * into attachment_row;

  return attachment_row;
end;
$$;

create or replace function submit_content_for_review(
  p_content_id uuid,
  p_actor_id text,
  p_blocknote_json jsonb,
  p_requested_reviewer_id text default null
) returns contents
language plpgsql
security definer
set search_path = public
as $$
declare
  content_row contents;
  actor_role app_role;
  author_role app_role;
  reviewer_role app_role;
  next_version integer;
  snapshot_id uuid;
  event_name text;
  invalidated_count integer;
begin
  select * into content_row
  from contents
  where id = p_content_id and archived_at is null
  for update;
  if content_row.id is null then raise exception 'CONTENT_NOT_FOUND'; end if;
  if content_row.status not in ('draft', 'changes_requested') then
    raise exception 'CONTENT_NOT_EDITABLE';
  end if;

  select role into actor_role from profiles
  where clerk_user_id = p_actor_id and archived_at is null;
  if p_actor_id <> content_row.author_id
     and p_actor_id <> content_row.assignee_id
     and actor_role is distinct from 'admin' then
    raise exception 'CONTENT_FORBIDDEN';
  end if;

  select role into author_role from profiles
  where clerk_user_id = content_row.author_id and archived_at is null;
  if author_role is null then raise exception 'CONTENT_AUTHOR_INVALID'; end if;

  if author_role = 'admin' and p_actor_id <> content_row.author_id then
    raise exception 'CONTENT_FORBIDDEN';
  end if;

  if author_role = 'admin' then
    if p_requested_reviewer_id is null then
      raise exception 'CONTENT_REVIEWER_REQUIRED';
    end if;
    select role into reviewer_role from profiles
    where clerk_user_id = p_requested_reviewer_id and archived_at is null;
    if reviewer_role is distinct from 'admin' then
      raise exception 'CONTENT_REVIEWER_INVALID';
    end if;
  else
    p_requested_reviewer_id := null;
  end if;

  next_version := content_row.current_version + 1;
  event_name := case when content_row.current_version = 0
    then 'submitted' else 'resubmitted' end;

  update content_approvals
  set invalidated_at = now()
  where content_id = p_content_id and invalidated_at is null;
  get diagnostics invalidated_count = row_count;

  if invalidated_count > 0 then
    insert into content_review_events (
      content_id, version, event_type, actor_id
    ) values (
      p_content_id, content_row.current_version, 'approval_invalidated', p_actor_id
    );
  end if;

  insert into content_versions (
    content_id, version, blocknote_json, created_by
  ) values (
    p_content_id, next_version, p_blocknote_json, p_actor_id
  ) returning id into snapshot_id;

  insert into content_version_attachments (content_version_id, attachment_id)
  select snapshot_id, id
  from content_attachments
  where content_id = p_content_id;

  update contents
  set status = 'in_review', current_version = next_version,
    required_approvals = case when author_role = 'admin' then 1 else 2 end,
    requested_reviewer_id = case
      when author_role = 'admin' then p_requested_reviewer_id else null end,
    updated_at = now()
  where id = p_content_id
  returning * into content_row;

  update tasks
  set title = '发布 ' || content_row.title || ' 内容',
    assignee_id = content_row.assignee_id,
    due_at = content_row.publish_at,
    updated_at = now()
  where id = content_row.linked_task_id and archived_at is null;

  insert into content_review_events (
    content_id, version, event_type, actor_id
  ) values (
    p_content_id, next_version, event_name, p_actor_id
  );

  return content_row;
end;
$$;

create or replace function approve_content_version(
  p_content_id uuid,
  p_version integer,
  p_admin_id text
) returns contents
language plpgsql
security definer
set search_path = public
as $$
declare
  content_row contents;
  admin_role app_role;
  approval_count integer;
  inserted_count integer;
begin
  select * into content_row
  from contents
  where id = p_content_id and archived_at is null
  for update;
  if content_row.id is null then raise exception 'CONTENT_NOT_FOUND'; end if;
  if p_version <> content_row.current_version then
    raise exception 'CONTENT_VERSION_STALE';
  end if;
  if content_row.status <> 'in_review' then
    raise exception 'CONTENT_NOT_IN_REVIEW';
  end if;

  select role into admin_role from profiles
  where clerk_user_id = p_admin_id and archived_at is null;
  if admin_role is distinct from 'admin' then raise exception 'ADMIN_REQUIRED'; end if;
  if content_row.required_approvals = 1
     and content_row.requested_reviewer_id is distinct from p_admin_id then
    raise exception 'CONTENT_REVIEWER_MISMATCH';
  end if;

  insert into content_approvals (content_id, version, admin_id)
  values (p_content_id, p_version, p_admin_id)
  on conflict (content_id, version, admin_id) do nothing;
  get diagnostics inserted_count = row_count;

  if inserted_count > 0 then
    insert into content_review_events (
      content_id, version, event_type, actor_id
    ) values (p_content_id, p_version, 'approved', p_admin_id);
  end if;

  select count(distinct admin_id)::integer into approval_count
  from content_approvals
  where content_id = p_content_id
    and version = p_version
    and invalidated_at is null;

  update contents
  set status = case when approval_count >= required_approvals
      then 'approved'::content_status else status end,
    updated_at = now()
  where id = p_content_id
  returning * into content_row;

  return content_row;
end;
$$;

create or replace function request_content_changes(
  p_content_id uuid,
  p_version integer,
  p_admin_id text,
  p_message text
) returns contents
language plpgsql
security definer
set search_path = public
as $$
declare
  content_row contents;
  admin_role app_role;
begin
  if trim(p_message) = '' then raise exception 'CONTENT_MESSAGE_REQUIRED'; end if;

  select * into content_row
  from contents
  where id = p_content_id and archived_at is null
  for update;
  if content_row.id is null then raise exception 'CONTENT_NOT_FOUND'; end if;
  if p_version <> content_row.current_version then
    raise exception 'CONTENT_VERSION_STALE';
  end if;
  if content_row.status <> 'in_review' then
    raise exception 'CONTENT_NOT_IN_REVIEW';
  end if;

  select role into admin_role from profiles
  where clerk_user_id = p_admin_id and archived_at is null;
  if admin_role is distinct from 'admin' then raise exception 'ADMIN_REQUIRED'; end if;
  if content_row.required_approvals = 1
     and content_row.requested_reviewer_id is distinct from p_admin_id then
    raise exception 'CONTENT_REVIEWER_MISMATCH';
  end if;

  update content_approvals
  set invalidated_at = now()
  where content_id = p_content_id and invalidated_at is null;

  update contents
  set status = 'changes_requested', updated_at = now()
  where id = p_content_id
  returning * into content_row;

  insert into content_review_events (
    content_id, version, event_type, actor_id, message
  ) values (
    p_content_id, p_version, 'changes_requested', p_admin_id, trim(p_message)
  );

  return content_row;
end;
$$;

create or replace function unlock_approved_content(
  p_content_id uuid,
  p_actor_id text
) returns contents
language plpgsql
security definer
set search_path = public
as $$
declare
  content_row contents;
  actor_role app_role;
begin
  select * into content_row
  from contents
  where id = p_content_id and archived_at is null
  for update;
  if content_row.id is null then raise exception 'CONTENT_NOT_FOUND'; end if;
  if content_row.status <> 'approved' then raise exception 'CONTENT_NOT_APPROVED'; end if;

  select role into actor_role from profiles
  where clerk_user_id = p_actor_id and archived_at is null;
  if p_actor_id <> content_row.author_id
     and p_actor_id <> content_row.assignee_id
     and actor_role is distinct from 'admin' then
    raise exception 'CONTENT_FORBIDDEN';
  end if;

  update content_approvals set invalidated_at = now()
  where content_id = p_content_id and invalidated_at is null;

  update contents
  set status = 'changes_requested', updated_at = now()
  where id = p_content_id
  returning * into content_row;

  insert into content_review_events (
    content_id, version, event_type, actor_id
  ) values (
    p_content_id, content_row.current_version, 'approval_invalidated', p_actor_id
  );

  return content_row;
end;
$$;

create or replace function mark_content_published(
  p_content_id uuid,
  p_actor_id text
) returns contents
language plpgsql
security definer
set search_path = public
as $$
declare
  content_row contents;
  actor_role app_role;
begin
  select * into content_row
  from contents
  where id = p_content_id and archived_at is null
  for update;
  if content_row.id is null then raise exception 'CONTENT_NOT_FOUND'; end if;
  if content_row.status not in ('approved', 'due') then
    raise exception 'CONTENT_NOT_PUBLISHABLE';
  end if;

  select role into actor_role from profiles
  where clerk_user_id = p_actor_id and archived_at is null;
  if p_actor_id <> content_row.assignee_id
     and p_actor_id <> content_row.author_id
     and actor_role is distinct from 'admin' then
    raise exception 'CONTENT_FORBIDDEN';
  end if;

  update contents
  set status = 'published', published_by = p_actor_id,
    published_at = now(), updated_at = now()
  where id = p_content_id
  returning * into content_row;

  update tasks
  set status = 'done', updated_at = now()
  where id = content_row.linked_task_id and archived_at is null;

  insert into content_review_events (
    content_id, version, event_type, actor_id
  ) values (
    p_content_id, content_row.current_version, 'published', p_actor_id
  );

  return content_row;
end;
$$;

create or replace function archive_content(
  p_content_id uuid,
  p_actor_id text
) returns contents
language plpgsql
security definer
set search_path = public
as $$
declare
  content_row contents;
  actor_role app_role;
begin
  select role into actor_role from profiles
  where clerk_user_id = p_actor_id and archived_at is null;
  if actor_role is distinct from 'admin' then raise exception 'ADMIN_REQUIRED'; end if;

  select * into content_row
  from contents
  where id = p_content_id and archived_at is null
  for update;
  if content_row.id is null then raise exception 'CONTENT_NOT_FOUND'; end if;

  update contents
  set status = 'archived', archived_at = now(), updated_at = now()
  where id = p_content_id
  returning * into content_row;

  update tasks
  set archived_at = now(), updated_at = now()
  where id = content_row.linked_task_id
    and archived_at is null
    and status <> 'done';

  insert into content_review_events (
    content_id, version, event_type, actor_id
  ) values (
    p_content_id, content_row.current_version, 'archived', p_actor_id
  );

  return content_row;
end;
$$;

revoke all on function create_scheduled_content(uuid, text, text, text, timestamptz, uuid[]) from public;
revoke all on function submit_content_for_review(uuid, text, jsonb, text) from public;
revoke all on function approve_content_version(uuid, integer, text) from public;
revoke all on function request_content_changes(uuid, integer, text, text) from public;
revoke all on function unlock_approved_content(uuid, text) from public;
revoke all on function mark_content_published(uuid, text) from public;
revoke all on function archive_content(uuid, text) from public;
revoke all on function create_content_snapshot(uuid, text, jsonb) from public;
revoke all on function save_content_attachment(uuid, text, text, text, bigint, text) from public;

do $grant_workflow_to_service_role$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function create_scheduled_content(uuid, text, text, text, timestamptz, uuid[]) to service_role';
    execute 'grant execute on function submit_content_for_review(uuid, text, jsonb, text) to service_role';
    execute 'grant execute on function approve_content_version(uuid, integer, text) to service_role';
    execute 'grant execute on function request_content_changes(uuid, integer, text, text) to service_role';
    execute 'grant execute on function unlock_approved_content(uuid, text) to service_role';
    execute 'grant execute on function mark_content_published(uuid, text) to service_role';
    execute 'grant execute on function archive_content(uuid, text) to service_role';
    execute 'grant execute on function create_content_snapshot(uuid, text, jsonb) to service_role';
    execute 'grant execute on function save_content_attachment(uuid, text, text, text, bigint, text) to service_role';
  end if;
end;
$grant_workflow_to_service_role$;
