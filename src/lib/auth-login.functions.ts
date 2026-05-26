import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

type LoginResult =
  | { ok: true; access_token: string; refresh_token: string }
  | { ok: false; error: string };

// Resolve a username (or email) + password into a Supabase session.
// Returns a result envelope so expected auth failures don't surface as
// unhandled server-function errors in the dev overlay.
export const loginWithIdentifier = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      identifier: z.string().trim().min(1).max(255),
      password: z.string().min(1).max(128),
    }).parse,
  )
  .handler(async ({ data }): Promise<LoginResult> => {
    const raw = data.identifier.trim();
    let email = raw;

    if (!raw.includes("@")) {
      const { data: row, error } = await supabaseAdmin
        .from("usernames")
        .select("user_id")
        .ilike("username", raw)
        .maybeSingle();
      if (error) return { ok: false, error: "Erro ao validar usuário" };
      if (!row) return { ok: false, error: "Usuário ou senha inválidos" };

      const { data: userRes, error: uErr } =
        await supabaseAdmin.auth.admin.getUserById(row.user_id);
      if (uErr || !userRes.user?.email) {
        return { ok: false, error: "Usuário ou senha inválidos" };
      }
      email = userRes.user.email;
    }

    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const anon = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });

    const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({
      email,
      password: data.password,
    });
    if (signErr || !signIn.session) {
      return { ok: false, error: "Usuário ou senha inválidos" };
    }

    return {
      ok: true,
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    };
  });
