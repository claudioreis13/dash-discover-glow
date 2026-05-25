
-- Fornecedores table
create table public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  categoria text not null,
  valor_total numeric not null default 0,
  data_cont date,
  vencimento date,
  parcelas jsonb not null default '[]'::jsonb,
  status text not null default 'pendente',
  prioridade text not null default 'média',
  observacoes text not null default '',
  contato text,
  email text,
  tipo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fornecedores_user_id_idx on public.fornecedores(user_id);

alter table public.fornecedores enable row level security;

create policy "Users can view own fornecedores"
  on public.fornecedores for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own fornecedores"
  on public.fornecedores for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own fornecedores"
  on public.fornecedores for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own fornecedores"
  on public.fornecedores for delete
  to authenticated
  using (auth.uid() = user_id);

-- User settings table
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  noivos text not null default 'Casal',
  data_casamento date,
  orcamento_total numeric not null default 45000,
  dark_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "Users can view own settings"
  on public.user_settings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.user_settings for update
  to authenticated
  using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger fornecedores_set_updated_at
  before update on public.fornecedores
  for each row execute function public.set_updated_at();

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- Auto-create settings on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
