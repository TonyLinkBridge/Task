create table if not exists public.media_assets (
 id uuid primary key,
 storage_path text not null unique,
 file_name text not null check(char_length(file_name) between 1 and 255),
 mime_type text not null,
 byte_size bigint not null check(byte_size > 0 and byte_size <= 104857600),
 uploader_id text not null references public.profiles(clerk_user_id),
 created_at timestamptz not null default now(),
 archived_at timestamptz
);
create index if not exists media_assets_created_idx on public.media_assets(created_at desc);
create index if not exists media_assets_uploader_idx on public.media_assets(uploader_id);
alter table public.media_assets enable row level security;
revoke all on public.media_assets from public, anon, authenticated;
grant select, insert, update on public.media_assets to service_role;
alter table public.content_attachments add column if not exists source_asset_id uuid references public.media_assets(id);
create index if not exists content_attachments_source_asset_idx on public.content_attachments(source_asset_id) where source_asset_id is not null;

create or replace function public.attach_media_asset(p_asset_id uuid,p_content_id uuid,p_storage_path text,p_actor_id text)
returns public.content_attachments
language plpgsql security invoker set search_path = public
as $$
declare c public.contents; a public.media_assets; result public.content_attachments; actor public.profiles;
begin
 select * into actor from public.profiles where clerk_user_id=p_actor_id and archived_at is null;
 if actor.clerk_user_id is null then raise exception 'ACTOR_NOT_FOUND'; end if;
 select * into c from public.contents where id=p_content_id and archived_at is null for update;
 if c.id is null then raise exception 'CONTENT_NOT_FOUND'; end if;
 if c.status not in ('draft','changes_requested') then raise exception 'CONTENT_NOT_EDITABLE'; end if;
 if actor.role <> 'admin' and p_actor_id <> c.author_id and p_actor_id <> c.assignee_id then raise exception 'CONTENT_FORBIDDEN'; end if;
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
revoke all on function public.attach_media_asset(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.attach_media_asset(uuid,uuid,text,text) to service_role;
