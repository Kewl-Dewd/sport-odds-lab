create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null check (length(message) >= 3 and length(message) <= 5000),
  category text not null check (category in ('bug', 'suggestion', 'missing', 'other')),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant all on public.feedback to service_role;

alter table public.feedback enable row level security;