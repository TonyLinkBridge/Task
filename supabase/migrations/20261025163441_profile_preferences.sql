-- Personal presentation is independent from the verified Slack/Clerk identity.
alter table public.profiles
 add column preferred_name text check(preferred_name is null or length(trim(preferred_name)) between 1 and 100),
 add column avatar_mode text not null default 'photo' check(avatar_mode in('photo','initials')),
 add column source_avatar_url text;
update public.profiles set source_avatar_url=avatar_url;

create function public.preserve_personal_presentation() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.preferred_name is not null then new.display_name:=new.preferred_name;end if;
 if new.avatar_url is not null then new.source_avatar_url:=new.avatar_url;end if;
 if new.avatar_mode='initials' then new.avatar_url:=null;end if;
 return new;
end;$$;
create trigger profiles_personal_presentation before insert or update on public.profiles
for each row execute function public.preserve_personal_presentation();

create function public.personal_profile(p_actor_id text) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;begin
 select jsonb_build_object('id',p.clerk_user_id,'name',p.display_name,'title',p.team_title,
 'email',p.team_email,'photoUrl',p.source_avatar_url,'avatarMode',case when p.source_avatar_url is null then 'initials' else p.avatar_mode end,
 'roleId',r.id,'roleName',r.name,'roleColor',r.color,'permissions',r.permissions,'revision',p.team_revision)
 into result from public.profiles p join public.team_roles r on r.id=p.team_role_id
 where p.clerk_user_id=p_actor_id and p.archived_at is null and p.team_status='active';
 if result is null then raise exception 'TEAM_FORBIDDEN';end if;
 return result;
end;$$;

create function public.save_personal_profile(p_actor_id text,p_patch jsonb,p_revision integer) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare actor public.profiles;key text;begin
 select * into actor from public.profiles where clerk_user_id=p_actor_id and archived_at is null and team_status='active' for update;
 if actor.clerk_user_id is null then raise exception 'TEAM_FORBIDDEN';end if;
 if p_revision is null or actor.team_revision<>p_revision then raise exception 'PROFILE_CONFLICT';end if;
 if p_patch is null or jsonb_typeof(p_patch)<>'object' or p_patch='{}'::jsonb then raise exception 'PROFILE_INVALID';end if;
 for key in select jsonb_object_keys(p_patch) loop
  if key not in('name','title','avatarMode') or jsonb_typeof(p_patch->key)<>'string' then raise exception 'PROFILE_INVALID';end if;
 end loop;
 if (p_patch?'name' and length(trim(p_patch->>'name')) not between 1 and 100)
 or (p_patch?'title' and length(trim(p_patch->>'title'))>80)
 or (p_patch?'avatarMode' and p_patch->>'avatarMode' not in('photo','initials')) then raise exception 'PROFILE_INVALID';end if;
 if p_patch->>'avatarMode'='photo' and actor.source_avatar_url is null then raise exception 'PROFILE_NO_PHOTO';end if;
 update public.profiles set
  preferred_name=case when p_patch?'name' then trim(p_patch->>'name') else preferred_name end,
  display_name=case when p_patch?'name' then trim(p_patch->>'name') else display_name end,
  team_title=case when p_patch?'title' then trim(p_patch->>'title') else team_title end,
  avatar_mode=coalesce(p_patch->>'avatarMode',avatar_mode),
  avatar_url=case when p_patch->>'avatarMode'='photo' then source_avatar_url else avatar_url end,
  team_revision=team_revision+1
 where clerk_user_id=p_actor_id;
 perform public.team_log(p_actor_id,'update_profile',p_actor_id,jsonb_build_object('fields',(select jsonb_agg(k) from jsonb_object_keys(p_patch) k)));
 return public.personal_profile(p_actor_id);
end;$$;
revoke all on function public.personal_profile(text),public.save_personal_profile(text,jsonb,integer) from public,anon,authenticated;
grant execute on function public.personal_profile(text),public.save_personal_profile(text,jsonb,integer) to service_role;

create or replace function public.team_user_access(p_user_id text) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('role',p.role,'name',p.display_name,'imageUrl',p.avatar_url,'permissions',r.permissions,'teamRoleId',r.id,'teamRoleName',r.name,'teamStatus',p.team_status,'accessRevision',p.team_revision::text||':'||r.revision::text)
 from public.profiles p join public.team_roles r on r.id=p.team_role_id where p.clerk_user_id=p_user_id and p.archived_at is null and p.team_status='active';
$$;
