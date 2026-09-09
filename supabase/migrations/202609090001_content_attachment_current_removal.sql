alter table content_attachments
  add column if not exists archived_at timestamptz;

create index if not exists content_attachments_active_content_idx
  on content_attachments (content_id, created_at)
  where archived_at is null;

create or replace function skip_archived_content_version_attachment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from content_attachments
    where id = new.attachment_id and archived_at is not null
  ) then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists skip_archived_content_version_attachment
  on content_version_attachments;

create trigger skip_archived_content_version_attachment
before insert on content_version_attachments
for each row execute function skip_archived_content_version_attachment();

-- Keep this attachment for historical versions, but remove it from the
-- current content and all future versions.
update content_attachments
set archived_at = coalesce(archived_at, now())
where id = 'c849d3b8-22ed-49c7-82ce-b06e0aab6a54'
  and content_id = '2fbd5405-3432-48d7-b2d8-ebb67ba00cd4';
