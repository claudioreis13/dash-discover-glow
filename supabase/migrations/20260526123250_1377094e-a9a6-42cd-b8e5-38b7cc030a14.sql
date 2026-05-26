
-- Audit log table
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  description text not null,
  fornecedor_nome text,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "Users can view own audit log"
  on public.audit_log for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own audit log"
  on public.audit_log for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own audit log"
  on public.audit_log for delete
  to authenticated
  using (auth.uid() = user_id);

create index audit_log_user_created_idx
  on public.audit_log (user_id, created_at desc);

-- Pago por (divisão de despesas)
alter table public.fornecedores
  add column pago_por text;
