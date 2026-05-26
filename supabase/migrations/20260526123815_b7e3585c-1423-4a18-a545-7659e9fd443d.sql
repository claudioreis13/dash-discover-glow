ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];
CREATE INDEX IF NOT EXISTS idx_fornecedores_tags ON public.fornecedores USING GIN(tags);