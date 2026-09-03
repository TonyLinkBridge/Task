alter table public.tasks
  add column if not exists assignee_ids text[] not null default '{}';

update public.tasks
set assignee_ids = array[assignee_id]
where cardinality(assignee_ids) = 0;

alter table public.tasks
  drop constraint if exists tasks_assignee_ids_count_check;

alter table public.tasks
  add constraint tasks_assignee_ids_count_check
  check (cardinality(assignee_ids) between 1 and 10);

create or replace function public.sync_task_assignees()
returns trigger
language plpgsql
as $$
begin
  if new.kind = 'content_publish' then
    new.assignee_ids := array[new.assignee_id];
  elsif cardinality(new.assignee_ids) = 0 then
    new.assignee_ids := array[new.assignee_id];
  elsif not (new.assignee_id = any(new.assignee_ids)) then
    new.assignee_ids := array_prepend(new.assignee_id, new.assignee_ids);
  end if;
  return new;
end;
$$;

drop trigger if exists sync_task_assignees_trigger on public.tasks;
create trigger sync_task_assignees_trigger
before insert or update of assignee_id, assignee_ids, kind on public.tasks
for each row execute function public.sync_task_assignees();

create index if not exists tasks_assignee_ids_idx
  on public.tasks using gin (assignee_ids)
  where archived_at is null;
