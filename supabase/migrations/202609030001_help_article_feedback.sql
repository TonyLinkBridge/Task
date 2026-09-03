create table public.help_article_feedback (
  id uuid primary key default gen_random_uuid(),
  article_slug text not null check (char_length(article_slug) between 1 and 300),
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  helpful boolean not null,
  comment text check (comment is null or char_length(comment) between 3 and 512),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_slug, clerk_user_id)
);

create index help_article_feedback_article_idx
  on public.help_article_feedback (article_slug, updated_at desc);

alter table public.help_article_feedback enable row level security;

create trigger help_article_feedback_set_updated_at
before update on public.help_article_feedback
for each row execute function public.set_updated_at();
