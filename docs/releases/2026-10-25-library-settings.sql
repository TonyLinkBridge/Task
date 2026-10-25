-- JUYU Task：文件库管理与设置完善
-- 用于已有素材库的 Task 数据库；不是初始化脚本。
-- 在 Supabase SQL Editor 整份执行一次。
-- 只增加标签、收藏、文字资源及工作区设置，不清空现有内容或文件。
-- 本文件包含事务：出错时整份回滚；成功后提交。
-- 此时只准备数据库，正式上线另行操作。

begin;

alter table public.media_assets add column if not exists tags text[] not null default '{}';
alter table public.media_assets add constraint media_asset_tags_limit check(cardinality(tags)<=20);
create table public.media_asset_favorites(
 user_id text not null references public.profiles(clerk_user_id),
 asset_id uuid not null references public.media_assets(id),
 created_at timestamptz not null default now(), primary key(user_id,asset_id)
);
create table public.library_snippets(
 id uuid primary key, kind text not null check(kind in ('template','hashtag_set','saved_reply')),
 title text not null check(char_length(title) between 1 and 100),
 body text not null check(char_length(body) between 1 and 20000),
 owner_id text not null references public.profiles(clerk_user_id),
 revision integer not null default 0 check(revision>=0),
 use_count integer not null default 0 check(use_count>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create index library_snippets_kind_created_idx on public.library_snippets(kind,created_at desc);
create table public.library_snippet_uses(
 id uuid primary key, snippet_id uuid not null references public.library_snippets(id),
 actor_id text not null references public.profiles(clerk_user_id), created_at timestamptz not null default now()
);
create table public.workspace_preferences(
 id boolean primary key default true check(id), name text not null default 'JUYU' check(char_length(name) between 1 and 24),
 description text not null default '内部工作台' check(char_length(description)<=40),
 week_starts_on integer not null default 1 check(week_starts_on in (0,1)),
 revision integer not null default 0, updated_by text references public.profiles(clerk_user_id),updated_at timestamptz not null default now()
);
insert into public.workspace_preferences(id) values(true);
alter table public.media_asset_favorites enable row level security;
alter table public.library_snippets enable row level security;
alter table public.library_snippet_uses enable row level security;
alter table public.workspace_preferences enable row level security;
revoke all on public.media_asset_favorites,public.library_snippets,public.library_snippet_uses,public.workspace_preferences from public,anon,authenticated;
grant select,insert,update,delete on public.media_asset_favorites to service_role;
grant select,insert,update on public.library_snippets,public.library_snippet_uses,public.workspace_preferences to service_role;
create view public.media_asset_usage with(security_invoker=true) as
 select a.source_asset_id as asset_id,count(distinct a.content_id)::integer as use_count
 from public.content_attachments a join public.contents c on c.id=a.content_id
 where a.source_asset_id is not null and a.archived_at is null and c.archived_at is null group by a.source_asset_id;
revoke all on public.media_asset_usage from public,anon,authenticated;
grant select on public.media_asset_usage to service_role;

create function public.set_media_asset_tags(p_asset_id uuid,p_tags text[],p_actor_id text) returns public.media_assets
language plpgsql security invoker set search_path=public as $$
declare a public.media_assets; actor public.profiles;
begin
 select * into actor from profiles where clerk_user_id=p_actor_id and archived_at is null;
 if actor.clerk_user_id is null then raise exception 'FORBIDDEN';end if;
 select * into a from media_assets where id=p_asset_id for update;
 if a.id is null then raise exception 'NOT_FOUND';end if;
 if actor.role<>'admin' and a.uploader_id<>p_actor_id then raise exception 'FORBIDDEN';end if;
 if p_tags is null or cardinality(p_tags)>20 or exists(select 1 from unnest(p_tags) t where t is null or char_length(trim(t)) not between 1 and 32) then raise exception 'INVALID_TAGS';end if;
 update media_assets set tags=array(select distinct trim(t) from unnest(p_tags) t order by 1) where id=p_asset_id returning * into a;
 return a;
end;$$;
create function public.set_media_favorites(p_asset_ids uuid[],p_actor_id text,p_favorite boolean) returns void
language plpgsql security invoker set search_path=public as $$
begin
 if p_favorite is null or p_asset_ids is null or cardinality(p_asset_ids) not between 1 and 100 then raise exception 'INVALID_INPUT';end if;
 if not exists(select 1 from profiles where clerk_user_id=p_actor_id and archived_at is null) then raise exception 'FORBIDDEN';end if;
 if exists(select 1 from unnest(p_asset_ids) a where a is null or not exists(select 1 from media_assets m where m.id=a)) then raise exception 'NOT_FOUND';end if;
 if p_favorite then insert into media_asset_favorites(user_id,asset_id) select p_actor_id,a from (select distinct unnest(p_asset_ids) a) s on conflict do nothing;
 else delete from media_asset_favorites where user_id=p_actor_id and asset_id=any(p_asset_ids);end if;
end;$$;
create function public.save_library_snippet(p_id uuid,p_kind text,p_title text,p_body text,p_revision integer,p_actor_id text) returns public.library_snippets
language plpgsql security invoker set search_path=public as $$
declare s public.library_snippets; actor public.profiles;
begin
 select * into actor from profiles where clerk_user_id=p_actor_id and archived_at is null;
 if actor.clerk_user_id is null then raise exception 'FORBIDDEN';end if;
 select * into s from library_snippets where id=p_id for update;
 if s.id is null then
  if p_revision is distinct from -1 then raise exception 'CONFLICT';end if;
  insert into library_snippets(id,kind,title,body,owner_id) values(p_id,p_kind,trim(p_title),p_body,p_actor_id) returning * into s;
 else
  if actor.role<>'admin' and s.owner_id<>p_actor_id then raise exception 'FORBIDDEN';end if;
  if s.revision is distinct from p_revision or s.archived_at is not null then raise exception 'CONFLICT';end if;
  update library_snippets set title=trim(p_title),kind=p_kind,body=p_body,revision=revision+1,updated_at=now() where id=p_id returning * into s;
 end if;
 return s;
end;$$;
create function public.archive_library_snippet(p_id uuid,p_archived boolean,p_revision integer,p_actor_id text) returns public.library_snippets
language plpgsql security invoker set search_path=public as $$
declare s public.library_snippets; actor public.profiles;
begin
 select * into actor from profiles where clerk_user_id=p_actor_id and archived_at is null;
 if actor.clerk_user_id is null or p_archived is null then raise exception 'FORBIDDEN';end if;
 select * into s from library_snippets where id=p_id for update;
 if s.id is null then raise exception 'NOT_FOUND';end if;
 if actor.role<>'admin' and s.owner_id<>p_actor_id then raise exception 'FORBIDDEN';end if;
 if s.revision is distinct from p_revision then raise exception 'CONFLICT';end if;
 update library_snippets set archived_at=case when p_archived then now() else null end,revision=revision+1,updated_at=now() where id=p_id returning * into s;
 return s;
end;$$;
create function public.record_library_snippet_use(p_id uuid,p_event_id uuid,p_actor_id text) returns integer
language plpgsql security invoker set search_path=public as $$
declare n integer;s public.library_snippets;
begin
 if not exists(select 1 from profiles where clerk_user_id=p_actor_id and archived_at is null) then raise exception 'FORBIDDEN';end if;
 select * into s from library_snippets where id=p_id and archived_at is null for update;
 if s.id is null then raise exception 'NOT_FOUND';end if;
 if exists(select 1 from library_snippet_uses where id=p_event_id and (actor_id<>p_actor_id or snippet_id<>p_id)) then raise exception 'CONFLICT';end if;
 insert into library_snippet_uses(id,snippet_id,actor_id) values(p_event_id,p_id,p_actor_id) on conflict do nothing;
 get diagnostics n=row_count;
 if n=1 then update library_snippets set use_count=use_count+1 where id=p_id returning use_count into n;else n=s.use_count;end if;
 return n;
end;$$;
create function public.save_workspace_preferences(p_name text,p_description text,p_week_starts_on integer,p_revision integer,p_actor_id text) returns public.workspace_preferences
language plpgsql security invoker set search_path=public as $$
declare w public.workspace_preferences;
begin
 if not exists(select 1 from profiles where clerk_user_id=p_actor_id and archived_at is null and role='admin') then raise exception 'FORBIDDEN';end if;
 update workspace_preferences set name=trim(p_name),description=trim(p_description),week_starts_on=p_week_starts_on,revision=revision+1,updated_by=p_actor_id,updated_at=now() where id=true and revision=p_revision returning * into w;
 if w.id is null then raise exception 'CONFLICT';end if;
 return w;
end;$$;
revoke all on function public.set_media_asset_tags(uuid,text[],text),public.set_media_favorites(uuid[],text,boolean),public.save_library_snippet(uuid,text,text,text,integer,text),public.archive_library_snippet(uuid,boolean,integer,text),public.record_library_snippet_use(uuid,uuid,text),public.save_workspace_preferences(text,text,integer,integer,text) from public,anon,authenticated;
grant execute on function public.set_media_asset_tags(uuid,text[],text),public.set_media_favorites(uuid[],text,boolean),public.save_library_snippet(uuid,text,text,text,integer,text),public.archive_library_snippet(uuid,boolean,integer,text),public.record_library_snippet_use(uuid,uuid,text),public.save_workspace_preferences(text,text,integer,integer,text) to service_role;
create function public.archive_media_assets(p_ids uuid[],p_archived boolean,p_actor_id text) returns setof public.media_assets
language plpgsql security invoker set search_path=public as $$
declare actor public.profiles;
begin
 select * into actor from profiles where clerk_user_id=p_actor_id and archived_at is null;
 if actor.clerk_user_id is null or p_archived is null or p_ids is null or cardinality(p_ids) not between 1 and 100 then raise exception 'FORBIDDEN';end if;
 if exists(select 1 from unnest(p_ids) a where a is null or not exists(select 1 from media_assets m where m.id=a and (m.uploader_id=p_actor_id or actor.role='admin'))) then raise exception 'FORBIDDEN';end if;
 return query update media_assets set archived_at=case when p_archived then now() else null end where id=any(p_ids) returning *;
end;$$;
revoke all on function public.archive_media_assets(uuid[],boolean,text) from public,anon,authenticated;
grant execute on function public.archive_media_assets(uuid[],boolean,text) to service_role;

commit;
