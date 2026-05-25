
create table if not exists public.usernames (
  user_id uuid primary key,
  username text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists usernames_username_lower_idx
  on public.usernames (lower(username));

alter table public.usernames enable row level security;

create policy "Admins can view usernames"
  on public.usernames for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert usernames"
  on public.usernames for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update usernames"
  on public.usernames for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete usernames"
  on public.usernames for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create trigger usernames_set_updated_at
  before update on public.usernames
  for each row execute function public.set_updated_at();

insert into public.usernames (user_id, username)
select u.id, 'admin'
from auth.users u
where lower(u.email) = 'cr.reis@live.com'
on conflict (user_id) do update set username = excluded.username;
