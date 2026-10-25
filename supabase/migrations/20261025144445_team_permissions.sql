-- Website-managed roles. Authentication and Slack verification remain in Clerk.
create table public.team_roles (
 id text primary key check(id ~ '^[a-zA-Z0-9_-]{1,80}$'),
 name text not null check(length(trim(name)) between 1 and 40),
 description text not null default '' check(length(description)<=240),
 color text not null default '#397a86' check(color ~ '^#[0-9a-fA-F]{6}$'),
 permissions text[] not null default '{}', built_in boolean not null default false,
 revision integer not null default 0, created_at timestamptz not null default now()
);
create unique index team_roles_name_unique on public.team_roles(lower(trim(name)));
alter table public.profiles add column team_role_id text references public.team_roles(id),
 add column team_status text not null default 'active' check(team_status in('active','suspended','removed')),
 add column team_revision integer not null default 0,
 add column team_title text not null default '' check(length(team_title)<=80),
 add column team_email text,
 add column last_active_at timestamptz,
 add column mfa_enabled boolean;
create index profiles_team_role on public.profiles(team_role_id);
create table public.team_invites (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 100),
 email text not null check(length(email)<=254 and email=lower(trim(email))),
 role_id text not null references public.team_roles(id), status text not null default 'pending' check(status in('pending','accepted','revoked','failed')),
 invited_by text not null references public.profiles(clerk_user_id), accepted_by text references public.profiles(clerk_user_id),
 expires_at timestamptz not null default(now()+interval '7 days'),sent_at timestamptz,delivery_id text,
 revision integer not null default 0,created_at timestamptz not null default now()
);
create unique index team_invites_pending_email on public.team_invites(email) where status in('pending','failed');
create table public.team_audit_events (
 id uuid primary key default gen_random_uuid(),actor_id text not null references public.profiles(clerk_user_id),
 actor_name text not null,action text not null,entity_id text not null,details jsonb not null default '{}',created_at timestamptz not null default now()
);
create index team_audit_time on public.team_audit_events(created_at desc);
create index team_invites_role on public.team_invites(role_id);
create index team_invites_actor on public.team_invites(invited_by);
create index team_invites_accepted on public.team_invites(accepted_by);
create index team_audit_actor on public.team_audit_events(actor_id);
alter table public.team_roles enable row level security;
alter table public.team_invites enable row level security;
alter table public.team_audit_events enable row level security;
revoke all on public.team_roles,public.team_invites,public.team_audit_events from anon,authenticated;
grant all on public.team_roles,public.team_invites,public.team_audit_events to service_role;
insert into public.team_roles(id,name,description,color,permissions,built_in)values('owner','负责人','保留全部权限，固定角色。','#191b1e',array['content.write','content.reschedule','content.approve','content.publish','content.delete','content.manage_all','tasks.manage','tasks.manage_all','messages.send','reports.view','reports.export','history.view','library.manage','library.manage_all','channels.manage','team.manage','workspace.manage','workspace.export'],true);
insert into public.team_roles(id,name,description,color,permissions,built_in)values('admin','管理员','管理工作区、团队、内容及设置。','#3769a0',array['content.write','content.reschedule','content.approve','content.publish','content.delete','content.manage_all','tasks.manage','tasks.manage_all','messages.send','reports.view','reports.export','history.view','library.manage','library.manage_all','channels.manage','team.manage','workspace.manage','workspace.export'],true);
insert into public.team_roles(id,name,description,color,permissions,built_in)values('manager','主管','安排内容、审核和协作，不管理工作区权限。','#34725b',array['content.write','content.reschedule','content.publish','content.delete','tasks.manage','messages.send','reports.view','reports.export','library.manage','content.approve','content.manage_all','tasks.manage_all','history.view','library.manage_all'],true);
insert into public.team_roles(id,name,description,color,permissions,built_in)values('editor','编辑','撰写内容、上传素材和跟进任务；提交后需要审核。','#ebbd55',array['content.write','content.reschedule','content.publish','content.delete','tasks.manage','messages.send','reports.view','reports.export','library.manage'],true);
insert into public.team_roles(id,name,description,color,permissions,built_in)values('community','社群运营','处理成员消息、普通任务和素材。','#397a86',array['messages.send','tasks.manage','reports.view','library.manage'],true);
insert into public.team_roles(id,name,description,color,permissions,built_in)values('analyst','分析员','查看汇总、导出排期和操作记录，不修改内容。','#f4f4f1',array['reports.view','reports.export','history.view'],true);
insert into public.team_roles(id,name,description,color,permissions,built_in)values('client','访客','只查看团队内容及工作汇总。','#b84c3e',array['reports.view'],true);

create function public.team_permission_keys() returns text[] language sql immutable set search_path='' as $$select array['content.write','content.reschedule','content.approve','content.publish','content.delete','content.manage_all','tasks.manage','tasks.manage_all','messages.send','reports.view','reports.export','history.view','library.manage','library.manage_all','channels.manage','team.manage','workspace.manage','workspace.export'];$$;
-- Community is the reference's editable custom seed role.
update public.team_roles set built_in=false where id='community';
alter table public.team_roles add constraint team_role_permissions_valid check(permissions <@ public.team_permission_keys());
update public.profiles set team_role_id=case when role='admin' then 'admin' else 'editor' end;
create function public.sync_managed_team_role() returns trigger language plpgsql set search_path='' as $$
begin
 if new.team_role_id is null then new.team_role_id:=case when new.role='admin' then 'admin' else 'editor' end;end if;
 new.role:=case when new.team_role_id in('owner','admin') then 'admin'::public.app_role else 'employee'::public.app_role end;
 return new;
end;$$;
create trigger profiles_managed_team_role before insert or update on public.profiles for each row execute function public.sync_managed_team_role();
create function public.team_has_permission(p_user_id text,p_permission text) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select p_permission=any(r.permissions) from public.profiles p join public.team_roles r on r.id=p.team_role_id where p.clerk_user_id=p_user_id and p.archived_at is null and p.team_status='active'),false);
$$;
create function public.team_require_permission(p_user_id text,p_permission text) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.team_has_permission(p_user_id,p_permission) then raise exception 'TEAM_FORBIDDEN';end if;
end;$$;
create function public.team_log(p_actor text,p_action text,p_entity text,p_details jsonb) returns void language sql security definer set search_path='' as $$
 insert into public.team_audit_events(actor_id,actor_name,action,entity_id,details) select p_actor,display_name,p_action,p_entity,p_details from public.profiles where clerk_user_id=p_actor;
$$;
create function public.team_snapshot(p_actor_id text) returns jsonb language plpgsql security definer set search_path='' as $$
declare manager boolean;begin
 if not exists(select 1 from public.profiles where clerk_user_id=p_actor_id and team_status='active' and archived_at is null) then raise exception 'TEAM_FORBIDDEN';end if;
 manager:=public.team_has_permission(p_actor_id,'team.manage');
 return jsonb_build_object('generatedAt',now(),
 'roles',(select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'name',r.name,'description',r.description,'color',r.color,'permissions',r.permissions,'builtIn',r.built_in,'revision',r.revision) order by case r.id when 'owner' then 0 when 'admin' then 1 when 'manager' then 2 when 'editor' then 3 when 'community' then 4 when 'analyst' then 5 when 'client' then 6 else 7 end,r.created_at,r.id),'[]') from public.team_roles r),
 'members',(select coalesce(jsonb_agg(jsonb_build_object('id',p.clerk_user_id,'name',p.display_name,'imageUrl',p.avatar_url,'email',case when manager or p.clerk_user_id=p_actor_id then p.team_email end,'title',p.team_title,'roleId',p.team_role_id,'status',p.team_status,'revision',p.team_revision,'joinedAt',p.created_at,'lastActiveAt',p.last_active_at,'mfaEnabled',case when manager or p.clerk_user_id=p_actor_id then p.mfa_enabled end)order by p.created_at,p.clerk_user_id),'[]') from public.profiles p where manager or p.team_status='active'),
 'invites',case when manager then (select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'name',i.name,'email',i.email,'roleId',i.role_id,'status',i.status,'expiresAt',i.expires_at,'sentAt',i.sent_at,'deliveryId',i.delivery_id,'revision',i.revision)order by i.created_at desc),'[]') from public.team_invites i) else '[]'::jsonb end,
 'events',case when manager or public.team_has_permission(p_actor_id,'history.view') then (select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'actorId',e.actor_id,'actorName',e.actor_name,'action',e.action,'entityId',e.entity_id,'details',case when manager then e.details else e.details-'email' end,'createdAt',e.created_at) order by e.created_at desc),'[]') from (select * from (select id::text,actor_id,actor_name,action,entity_id,details,created_at from public.team_audit_events union all select 'business-'||a.id::text,coalesce(a.actor_id,'system'),coalesce(p.display_name,'系统'),a.action,a.entity_id,jsonb_build_object('entityType',a.entity_type),a.created_at from public.audit_events a left join public.profiles p on p.clerk_user_id=a.actor_id)all_events order by created_at desc limit 500)e) else '[]'::jsonb end);
end;$$;
create function public.team_manage(p_actor_id text,p_operation text,p_input jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.profiles;target public.profiles;selected public.team_roles;updated public.team_roles;invite public.team_invites;
 key text;v_permissions text[];previous_approvers integer;previous_managers integer;manager_count integer;approver_count integer;v_status text;v_revision integer;
begin
 perform pg_advisory_xact_lock(724836291);
 perform public.team_require_permission(p_actor_id,'team.manage');
 select * into actor from public.profiles where clerk_user_id=p_actor_id;
 select count(*) into previous_approvers from public.profiles where public.team_has_permission(clerk_user_id,'content.approve');
 select count(*) into previous_managers from public.profiles where public.team_has_permission(clerk_user_id,'team.manage');
 key:=p_input->>'id';v_revision:=coalesce((p_input->>'revision')::integer,-1);
 if p_operation='save_role' then
  select * into selected from public.team_roles where id=key for update;
  if selected.id='owner' then raise exception 'TEAM_OWNER_FIXED';end if;
  if (selected.id is null and v_revision<>-1) or (selected.id is not null and selected.revision<>v_revision) then raise exception 'TEAM_CONFLICT';end if;
  if jsonb_typeof(p_input->'permissions')<>'array' then raise exception 'TEAM_INVALID_INPUT';end if;
  select coalesce(array_agg(distinct value),'{}') into v_permissions from jsonb_array_elements_text(p_input->'permissions');
  if not v_permissions <@ public.team_permission_keys() then raise exception 'TEAM_INVALID_PERMISSION';end if;
  if exists(select 1 from unnest(v_permissions) perm where not public.team_has_permission(p_actor_id,perm)) then raise exception 'TEAM_CANNOT_GRANT';end if;
  insert into public.team_roles(id,name,description,color,permissions)values(key,trim(p_input->>'name'),coalesce(p_input->>'description',''),coalesce(p_input->>'color','#397a86'),v_permissions)
  on conflict(id)do update set name=excluded.name,description=excluded.description,color=excluded.color,permissions=excluded.permissions,revision=public.team_roles.revision+1 returning * into updated;
  perform public.team_log(p_actor_id,p_operation,key,jsonb_build_object('name',updated.name,'permissions',updated.permissions));
 elsif p_operation='delete_role' then
  select * into selected from public.team_roles where id=key for update;
  if selected.id is null then raise exception 'TEAM_NOT_FOUND';end if;
  if selected.built_in then raise exception 'TEAM_BUILTIN_FIXED';end if;
  if selected.revision<>v_revision then raise exception 'TEAM_CONFLICT';end if;
  if exists(select 1 from public.profiles where team_role_id=key) or exists(select 1 from public.team_invites where role_id=key) then raise exception 'TEAM_ROLE_IN_USE';end if;
  delete from public.team_roles where id=key;
  perform public.team_log(p_actor_id,p_operation,key,jsonb_build_object('name',selected.name));
 elsif p_operation in('set_role','set_status','save_member') then
  select * into target from public.profiles where clerk_user_id=key for update;
  if target.clerk_user_id is null then raise exception 'TEAM_NOT_FOUND';end if;
  if target.team_revision<>v_revision then raise exception 'TEAM_CONFLICT';end if;
  if target.team_role_id='owner' and p_operation in('set_role','set_status') then raise exception 'TEAM_OWNER_FIXED';end if;
  if p_operation='set_role' then
   select * into selected from public.team_roles where id=p_input->>'roleId';
   if selected.id is null then raise exception 'TEAM_NOT_FOUND';end if;
   if selected.id='owner' and actor.team_role_id<>'owner' and not(actor.role='admin' and key=p_actor_id and not exists(select 1 from public.profiles where team_role_id='owner')) then raise exception 'TEAM_CANNOT_GRANT';end if;
   if exists(select 1 from unnest(selected.permissions)perm where not public.team_has_permission(p_actor_id,perm)) then raise exception 'TEAM_CANNOT_GRANT';end if;
   if key=p_actor_id and not 'team.manage'=any(selected.permissions) then raise exception 'TEAM_SELF_CHANGE';end if;
   update public.profiles set team_role_id=selected.id,team_revision=team_revision+1 where clerk_user_id=key;
  elsif p_operation='set_status' then
   if key=p_actor_id then raise exception 'TEAM_SELF_CHANGE';end if;
   v_status:=p_input->>'status';if v_status not in('active','suspended','removed')then raise exception 'TEAM_INVALID_INPUT';end if;
   update public.profiles set team_status=v_status,archived_at=case when v_status='removed' then now() else null end,team_revision=team_revision+1 where clerk_user_id=key;
  else
   update public.profiles set team_title=coalesce(p_input->>'title',''),team_revision=team_revision+1 where clerk_user_id=key;
  end if;
  perform public.team_log(p_actor_id,p_operation,key,p_input||jsonb_build_object('name',target.display_name));
 elsif p_operation='create_invite' then
  select * into selected from public.team_roles where id=p_input->>'roleId';
  if selected.id is null or selected.id='owner' then raise exception 'TEAM_CANNOT_GRANT';end if;
  if exists(select 1 from unnest(selected.permissions)perm where not public.team_has_permission(p_actor_id,perm)) then raise exception 'TEAM_CANNOT_GRANT';end if;
  if exists(select 1 from public.profiles where lower(team_email)=lower(trim(p_input->>'email')) and team_status<>'removed')then raise exception 'TEAM_ALREADY_MEMBER';end if;
  insert into public.team_invites(name,email,role_id,invited_by)values(trim(p_input->>'name'),lower(trim(p_input->>'email')),selected.id,p_actor_id) returning * into invite;
  perform public.team_log(p_actor_id,p_operation,invite.id::text,jsonb_build_object('name',invite.name,'email',invite.email,'roleId',invite.role_id));
  return to_jsonb(invite);
 elsif p_operation in('revoke_invite','resend_invite','invite_delivery') then
  select * into invite from public.team_invites where id=key::uuid for update;
  if invite.id is null then raise exception 'TEAM_NOT_FOUND';end if;
  if invite.revision<>v_revision or invite.status not in('pending','failed')then raise exception 'TEAM_CONFLICT';end if;
  if p_operation='revoke_invite' then
   update public.team_invites set status='revoked',revision=revision+1 where id=invite.id;
  elsif p_operation='resend_invite' then
   select * into selected from public.team_roles where id=invite.role_id;
   if exists(select 1 from unnest(selected.permissions)perm where not public.team_has_permission(p_actor_id,perm))then raise exception 'TEAM_CANNOT_GRANT';end if;
   update public.team_invites set status='pending',expires_at=now()+interval '7 days',sent_at=null,revision=revision+1 where id=invite.id returning * into invite;
   return to_jsonb(invite);
  else
   update public.team_invites set status=case when coalesce((p_input->>'sent')::boolean,false)then 'pending' else 'failed' end,sent_at=case when coalesce((p_input->>'sent')::boolean,false)then now() end,delivery_id=p_input->>'deliveryId',revision=revision+1 where id=invite.id;
  end if;
  perform public.team_log(p_actor_id,p_operation,key,jsonb_build_object('email',invite.email));
 else raise exception 'TEAM_INVALID_OPERATION';end if;
 select count(*) into manager_count from public.profiles where public.team_has_permission(clerk_user_id,'team.manage');
 select count(*) into approver_count from public.profiles where public.team_has_permission(clerk_user_id,'content.approve');
 if manager_count<1 then raise exception 'TEAM_MANAGER_REQUIRED';end if;
 if approver_count<least(2,previous_approvers) then raise exception 'TEAM_APPROVERS_REQUIRED';end if;
 return case when p_operation='save_role' then jsonb_build_object('id',updated.id) else '{}'::jsonb end;
end;$$;
create function public.team_accept_invites(p_user_id text,p_verified_email text) returns void language plpgsql security definer set search_path='' as $$
declare invitation public.team_invites;begin
 perform pg_advisory_xact_lock(724836291);
 if p_verified_email is null or not exists(select 1 from public.profiles where clerk_user_id=p_user_id and team_status='active' and archived_at is null)then return;end if;
 select * into invitation from public.team_invites where email=lower(trim(p_verified_email)) and status='pending' and sent_at is not null and expires_at>now() order by created_at desc limit 1 for update;
 if invitation.id is null then return;end if;
 -- Existing active members cannot use an invitation to silently replace their role.
 if exists(select 1 from public.team_audit_events where entity_id=p_user_id and action='set_role')then return;end if;
 update public.profiles set team_role_id=invitation.role_id,team_revision=team_revision+1 where clerk_user_id=p_user_id;
 update public.team_invites set status='accepted',accepted_by=p_user_id,revision=revision+1 where id=invitation.id;
 perform public.team_log(p_user_id,'accepted_invite',invitation.id::text,jsonb_build_object('roleId',invitation.role_id));
end;$$;
revoke all on function public.team_has_permission(text,text),public.team_require_permission(text,text),public.team_log(text,text,text,jsonb),public.team_snapshot(text),public.team_manage(text,text,jsonb),public.team_accept_invites(text,text) from public,anon,authenticated;
grant execute on function public.team_has_permission(text,text),public.team_require_permission(text,text),public.team_snapshot(text),public.team_manage(text,text,jsonb),public.team_accept_invites(text,text) to service_role;

-- Existing business workflows, with effective team authorization added.
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
  perform public.team_require_permission(p_author_id,'content.write');
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

create or replace function create_content_snapshot(
  p_content_id uuid,
  p_actor_id text,
  p_blocknote_json jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
  snapshot_id uuid;
begin
  perform public.team_require_permission(p_actor_id,'content.write');
  select current_version + 1
  into next_version
  from contents
  where id = p_content_id and archived_at is null
  for update;

  if next_version is null then
    raise exception 'CONTENT_NOT_FOUND';
  end if;

  insert into content_versions (
    content_id, version, blocknote_json, created_by
  ) values (
    p_content_id, next_version, p_blocknote_json, p_actor_id
  ) returning id into snapshot_id;

  update contents
  set current_version = next_version, updated_at = now()
  where id = p_content_id;

  return snapshot_id;
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
  perform public.team_require_permission(p_actor_id,'content.write');
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
     and not public.team_has_permission(p_actor_id,'content.manage_all') then
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
    if not public.team_has_permission(p_requested_reviewer_id,'content.approve') then
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
  perform public.team_require_permission(p_admin_id,'content.approve');
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
  if not public.team_has_permission(p_admin_id,'content.approve') then raise exception 'ADMIN_REQUIRED'; end if;
  if content_row.required_approvals = 2 and content_row.author_id = p_admin_id then raise exception 'CONTENT_AUTHOR_CANNOT_REVIEW';end if;
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
  perform public.team_require_permission(p_admin_id,'content.approve');
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
  if not public.team_has_permission(p_admin_id,'content.approve') then raise exception 'ADMIN_REQUIRED'; end if;
  if content_row.required_approvals = 2 and content_row.author_id = p_admin_id then raise exception 'CONTENT_AUTHOR_CANNOT_REVIEW';end if;
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
  perform public.team_require_permission(p_actor_id,'content.write');
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
     and not public.team_has_permission(p_actor_id,'content.manage_all') then
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
  perform public.team_require_permission(p_actor_id,'content.publish');
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
     and not public.team_has_permission(p_actor_id,'content.manage_all') then
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
  perform public.team_require_permission(p_actor_id,'content.manage_all');
  select role into actor_role from profiles
  where clerk_user_id = p_actor_id and archived_at is null;
  if not public.team_has_permission(p_actor_id,'content.manage_all') then raise exception 'ADMIN_REQUIRED'; end if;

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
  perform public.team_require_permission(p_actor_id,'content.reschedule');
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
  if not public.team_has_permission(p_actor_id,'content.manage_all')
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
  perform public.team_require_permission(p_actor_id,'content.delete');
  select * into content_row
  from contents
  where id = p_content_id
  for update;
  if content_row.id is null then raise exception 'CONTENT_NOT_FOUND'; end if;

  select role into actor_role
  from profiles
  where clerk_user_id = p_actor_id and archived_at is null;
  if actor_role is null then raise exception 'CONTENT_ACTOR_INVALID'; end if;
  if not public.team_has_permission(p_actor_id,'content.manage_all') and content_row.author_id <> p_actor_id then
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
  perform public.team_require_permission(p_actor_id,'tasks.manage');
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
  if not public.team_has_permission(p_actor_id,'tasks.manage_all') and task_row.creator_id <> p_actor_id then
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
  perform public.team_require_permission(p_uploader_id,'content.write');
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

create or replace function public.attach_media_asset(p_asset_id uuid,p_content_id uuid,p_storage_path text,p_actor_id text)
returns public.content_attachments
language plpgsql security invoker set search_path = public
as $$
declare c public.contents; a public.media_assets; result public.content_attachments; actor public.profiles;
begin
  perform public.team_require_permission(p_actor_id,'content.write');
 select * into actor from public.profiles where clerk_user_id=p_actor_id and archived_at is null;
 if actor.clerk_user_id is null then raise exception 'ACTOR_NOT_FOUND'; end if;
 select * into c from public.contents where id=p_content_id and archived_at is null for update;
 if c.id is null then raise exception 'CONTENT_NOT_FOUND'; end if;
 if c.status not in ('draft','changes_requested') then raise exception 'CONTENT_NOT_EDITABLE'; end if;
 if not public.team_has_permission(p_actor_id,'content.manage_all') and p_actor_id <> c.author_id and p_actor_id <> c.assignee_id then raise exception 'CONTENT_FORBIDDEN'; end if;
 select * into a from public.media_assets where id=p_asset_id and archived_at is null for update;
 if a.id is null then raise exception 'ASSET_NOT_FOUND'; end if;
 if p_storage_path not like p_content_id::text || '/%' or position('..' in p_storage_path)>0 then raise exception 'INVALID_ATTACHMENT_PATH'; end if;
 select * into result from public.content_attachments where content_id=p_content_id and source_asset_id=p_asset_id and archived_at is null limit 1;
 if result.id is not null then return result; end if;
 select * into result from public.save_content_attachment(p_content_id,p_storage_path,a.file_name,a.mime_type,a.byte_size,p_actor_id);
 update public.content_attachments set source_asset_id=p_asset_id where id=result.id returning * into result;
 return result;
end;
$$;

create or replace function public.set_media_asset_tags(p_asset_id uuid,p_tags text[],p_actor_id text) returns public.media_assets
language plpgsql security invoker set search_path=public as $$
declare a public.media_assets; actor public.profiles;
begin
  perform public.team_require_permission(p_actor_id,'library.manage');
 select * into actor from profiles where clerk_user_id=p_actor_id and archived_at is null;
 if actor.clerk_user_id is null then raise exception 'FORBIDDEN';end if;
 select * into a from media_assets where id=p_asset_id for update;
 if a.id is null then raise exception 'NOT_FOUND';end if;
 if not public.team_has_permission(p_actor_id,'library.manage_all') and a.uploader_id<>p_actor_id then raise exception 'FORBIDDEN';end if;
 if p_tags is null or cardinality(p_tags)>20 or exists(select 1 from unnest(p_tags) t where t is null or char_length(trim(t)) not between 1 and 32) then raise exception 'INVALID_TAGS';end if;
 update media_assets set tags=array(select distinct trim(t) from unnest(p_tags) t order by 1) where id=p_asset_id returning * into a;
 return a;
end;$$;

create or replace function public.save_library_snippet(p_id uuid,p_kind text,p_title text,p_body text,p_revision integer,p_actor_id text) returns public.library_snippets
language plpgsql security invoker set search_path=public as $$
declare s public.library_snippets; actor public.profiles;
begin
  perform public.team_require_permission(p_actor_id,'library.manage');
 select * into actor from profiles where clerk_user_id=p_actor_id and archived_at is null;
 if actor.clerk_user_id is null then raise exception 'FORBIDDEN';end if;
 select * into s from library_snippets where id=p_id for update;
 if s.id is null then
  if p_revision is distinct from -1 then raise exception 'CONFLICT';end if;
  insert into library_snippets(id,kind,title,body,owner_id) values(p_id,p_kind,trim(p_title),p_body,p_actor_id) returning * into s;
 else
  if not public.team_has_permission(p_actor_id,'library.manage_all') and s.owner_id<>p_actor_id then raise exception 'FORBIDDEN';end if;
  if s.revision is distinct from p_revision or s.archived_at is not null then raise exception 'CONFLICT';end if;
  update library_snippets set title=trim(p_title),kind=p_kind,body=p_body,revision=revision+1,updated_at=now() where id=p_id returning * into s;
 end if;
 return s;
end;$$;

create or replace function public.archive_library_snippet(p_id uuid,p_archived boolean,p_revision integer,p_actor_id text) returns public.library_snippets
language plpgsql security invoker set search_path=public as $$
declare s public.library_snippets; actor public.profiles;
begin
  perform public.team_require_permission(p_actor_id,'library.manage');
 select * into actor from profiles where clerk_user_id=p_actor_id and archived_at is null;
 if actor.clerk_user_id is null or p_archived is null then raise exception 'FORBIDDEN';end if;
 select * into s from library_snippets where id=p_id for update;
 if s.id is null then raise exception 'NOT_FOUND';end if;
 if not public.team_has_permission(p_actor_id,'library.manage_all') and s.owner_id<>p_actor_id then raise exception 'FORBIDDEN';end if;
 if s.revision is distinct from p_revision then raise exception 'CONFLICT';end if;
 update library_snippets set archived_at=case when p_archived then now() else null end,revision=revision+1,updated_at=now() where id=p_id returning * into s;
 return s;
end;$$;

create or replace function public.save_workspace_preferences(p_name text,p_description text,p_week_starts_on integer,p_revision integer,p_actor_id text) returns public.workspace_preferences
language plpgsql security invoker set search_path=public as $$
declare w public.workspace_preferences;
begin
  perform public.team_require_permission(p_actor_id,'workspace.manage');
 if not public.team_has_permission(p_actor_id,'workspace.manage') then raise exception 'FORBIDDEN';end if;
 update workspace_preferences set name=trim(p_name),description=trim(p_description),week_starts_on=p_week_starts_on,revision=revision+1,updated_by=p_actor_id,updated_at=now() where id=true and revision=p_revision returning * into w;
 if w.id is null then raise exception 'CONFLICT';end if;
 return w;
end;$$;

create or replace function public.archive_media_assets(p_ids uuid[],p_archived boolean,p_actor_id text) returns setof public.media_assets
language plpgsql security invoker set search_path=public as $$
declare actor public.profiles;
begin
  perform public.team_require_permission(p_actor_id,'library.manage');
 select * into actor from profiles where clerk_user_id=p_actor_id and archived_at is null;
 if actor.clerk_user_id is null or p_archived is null or p_ids is null or cardinality(p_ids) not between 1 and 100 then raise exception 'FORBIDDEN';end if;
 if exists(select 1 from unnest(p_ids) a where a is null or not exists(select 1 from media_assets m where m.id=a and (m.uploader_id=p_actor_id or public.team_has_permission(p_actor_id,'library.manage_all')))) then raise exception 'FORBIDDEN';end if;
 return query update media_assets set archived_at=case when p_archived then now() else null end where id=any(p_ids) returning *;
end;$$;
create function public.team_user_access(p_user_id text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('role',p.role,'permissions',r.permissions,'teamRoleId',r.id,'teamRoleName',r.name,'teamStatus',p.team_status,'accessRevision',p.team_revision::text||':'||r.revision::text)
 from public.profiles p join public.team_roles r on r.id=p.team_role_id where p.clerk_user_id=p_user_id and p.archived_at is null and p.team_status='active';
$$;
revoke all on function public.team_user_access(text) from public,anon,authenticated;
grant execute on function public.team_user_access(text) to service_role;
create function public.team_collaboration_members() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p.clerk_user_id,'status',case when p.archived_at is null then p.team_status else 'removed' end,'permissions',r.permissions)),'[]') from public.profiles p join public.team_roles r on r.id=p.team_role_id;
$$;
revoke all on function public.team_collaboration_members() from public,anon,authenticated;
grant execute on function public.team_collaboration_members() to service_role;
