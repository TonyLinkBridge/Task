alter table public.tasks
  add column if not exists project text not null default '一般';

alter table public.tasks
  drop constraint if exists tasks_project_length_check;

alter table public.tasks
  add constraint tasks_project_length_check
  check (char_length(project) between 1 and 100);

create index if not exists tasks_active_project_idx
  on public.tasks (lower(project))
  where archived_at is null;
