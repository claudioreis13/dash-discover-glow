import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const categoriaEnum = z.enum([
  "cerimonia",
  "festa",
  "visual",
  "foto-video",
  "convites",
  "musica",
  "lua-de-mel",
  "logistica",
  "avulso",
  "extras",
]);
const statusEnum = z.enum(["pago", "parcial", "pendente", "atrasado"]);
const prioridadeEnum = z.enum(["alta", "média", "baixa"]);
const tipoEnum = z.enum(["fornecedor", "avulso"]);
const pagoPorEnum = z.enum([
  "noivo",
  "noiva",
  "pais_noivo",
  "pais_noiva",
  "compartilhado",
]);

const parcelaSchema = z.object({
  numero: z.number().int().min(1).max(120),
  valor: z.number().min(0).max(1_000_000_000),
  dataPagamento: z.string().max(40),
  pago: z.boolean(),
});

const fornecedorSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().trim().min(1).max(200),
  categoria: categoriaEnum,
  valorTotal: z.number().min(0).max(1_000_000_000),
  dataCont: z.string().max(40).optional().default(""),
  vencimento: z.string().max(40).optional().default(""),
  parcelas: z.array(parcelaSchema).max(120),
  status: statusEnum,
  prioridade: prioridadeEnum,
  observacoes: z.string().max(5000).optional().default(""),
  contato: z.string().max(200).optional(),
  email: z.string().max(200).optional(),
  tipo: tipoEnum.optional(),
  pagoPor: pagoPorEnum.optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional().default([]),
});

function toRow(f: z.infer<typeof fornecedorSchema>, userId: string) {
  return {
    id: f.id,
    user_id: userId,
    nome: f.nome,
    categoria: f.categoria,
    valor_total: f.valorTotal,
    data_cont: f.dataCont || null,
    vencimento: f.vencimento || null,
    parcelas: f.parcelas,
    status: f.status,
    prioridade: f.prioridade,
    observacoes: f.observacoes ?? "",
    contato: f.contato ?? null,
    email: f.email ?? null,
    tipo: f.tipo ?? null,
    pago_por: f.pagoPor ?? null,
  };
}

export const loadWeddingData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [fornRes, settingsRes, auditRes] = await Promise.all([
      supabase.from("fornecedores").select("*").order("created_at", { ascending: true }),
      supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (fornRes.error) throw new Error(fornRes.error.message);

    let settingsRow = settingsRes.data;
    if (!settingsRow) {
      await supabase.from("user_settings").insert({ user_id: userId });
      settingsRow = {
        user_id: userId,
        noivos: "Casal",
        data_casamento: null,
        orcamento_total: 45000,
        dark_mode: false,
        updated_at: new Date().toISOString(),
      };
    }

    return {
      fornecedores: fornRes.data ?? [],
      settings: settingsRow,
      auditLog: auditRes.data ?? [],
    };
  });


export const createFornecedor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => fornecedorSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("fornecedores").insert(toRow(data, userId) as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateFornecedor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => fornecedorSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const row = toRow(data, userId) as Record<string, unknown>;
    delete row.id;
    delete row.user_id;
    const { error } = await supabase
      .from("fornecedores")
      .update(row as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFornecedor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("fornecedores").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateFornecedorParcelas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        parcelas: z.array(parcelaSchema).max(120),
        status: statusEnum,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("fornecedores")
      .update({ parcelas: data.parcelas, status: data.status } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const settingsSchema = z.object({
  noivos: z.string().trim().min(1).max(200),
  dataCasamento: z.string().max(40).optional().default(""),
  orcamentoTotal: z.number().min(0).max(1_000_000_000),
  darkMode: z.boolean(),
});

export const saveUserSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => settingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: userId,
        noivos: data.noivos,
        data_casamento: data.dataCasamento || null,
        orcamento_total: data.orcamentoTotal,
        dark_mode: data.darkMode,
      } as never,
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ───────────── Audit Log ─────────────
const auditEntrySchema = z.object({
  type: z.enum(["add", "update", "delete", "pay", "unpay"]),
  description: z.string().trim().min(1).max(500),
  fornecedorNome: z.string().max(200).optional(),
});

export const appendAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => auditEntrySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("audit_log")
      .insert({
        user_id: userId,
        type: data.type,
        description: data.description,
        fornecedor_nome: data.fornecedorNome ?? null,
      } as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const clearAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("audit_log").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

