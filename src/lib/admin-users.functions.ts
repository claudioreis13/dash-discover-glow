import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Erro ao verificar permissão");
  if (!data) throw new Error("Acesso negado");
}

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9_.-]+$/, "Use letras, números, ponto, hífen ou underline");

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const { data: authData, error: authErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (authErr) throw new Error(authErr.message);

    const { data: roles, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (roleErr) throw new Error(roleErr.message);

    const { data: usernames, error: unErr } = await supabaseAdmin
      .from("usernames")
      .select("user_id, username");
    if (unErr) throw new Error(unErr.message);

    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }
    const userNameMap = new Map<string, string>();
    for (const u of usernames ?? []) userNameMap.set(u.user_id, u.username);

    return authData.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      username: userNameMap.get(u.id) ?? "",
      createdAt: u.created_at,
      roles: roleMap.get(u.id) ?? [],
    }));
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      email: z.string().trim().email().max(255),
      username: usernameSchema,
      password: z.string().min(8).max(128),
      role: z.enum(["admin", "user"]),
    }).parse,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    const { data: existing } = await supabaseAdmin
      .from("usernames")
      .select("user_id")
      .ilike("username", data.username)
      .maybeSingle();
    if (existing) throw new Error("Nome de usuário já está em uso");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);

    const { error: rerr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: data.role });
    if (rerr) throw new Error(rerr.message);

    const { error: uerr } = await supabaseAdmin
      .from("usernames")
      .insert({ user_id: created.user.id, username: data.username });
    if (uerr) throw new Error(uerr.message);

    return { id: created.user.id };
  });

export const updateUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      password: z.string().min(8).max(128),
    }).parse,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      data.userId,
      { password: data.password },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateUsername = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      username: usernameSchema,
    }).parse,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { data: existing } = await supabaseAdmin
      .from("usernames")
      .select("user_id")
      .ilike("username", data.username)
      .maybeSingle();
    if (existing && existing.user_id !== data.userId) {
      throw new Error("Nome de usuário já está em uso");
    }
    const { error } = await supabaseAdmin
      .from("usernames")
      .upsert(
        { user_id: data.userId, username: data.username },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["admin", "user"]),
    }).parse,
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);

    // Prevent removing the last admin (locking everyone out).
    if (data.role !== "admin") {
      const { count, error: countErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      if (countErr) throw new Error(countErr.message);

      const { data: target } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", data.userId)
        .eq("role", "admin")
        .maybeSingle();

      if (target && (count ?? 0) <= 1) {
        throw new Error("É necessário manter pelo menos um administrador");
      }
    }

    const { error: delErr } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (delErr) throw new Error(delErr.message);
    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (insErr) throw new Error(insErr.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid() }).parse)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    if (data.userId === context.userId) {
      throw new Error("Você não pode remover sua própria conta");
    }
    // Prevent removing the last admin.
    const { data: targetRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (targetRole) {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "admin");
      if ((count ?? 0) <= 1) {
        throw new Error("É necessário manter pelo menos um administrador");
      }
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
