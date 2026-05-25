import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

// Resolve a username (or email) + password into a Supabase session.
// Runs server-side so the username -> email mapping is never exposed.
export const loginWithIdentifier = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      identifier: z.string().trim().min(1).max(255),
      password: z.string().min(1).max(128),
    }).parse,
  )
  .handler(async ({ data }) => {
    const raw = data.identifier.trim();
    let email = raw;

    // If it's not an email, treat it as a username and resolve to an email.
    if (!raw.includes("@")) {
      const { data: row, error } = await supabaseAdmin
        .from("usernames")
        .select("user_id")
        .ilike("username", raw)
        .maybeSingle();
      if (error) throw new Error("Erro ao validar usuário");
      if (!row) throw new Error("Usuário ou senha inválidos");

      const { data: userRes, error: uErr } =
        await supabaseAdmin.auth.admin.getUserById(row.user_id);
      if (uErr || !userRes.user?.email) {
        throw new Error("Usuário ou senha inválidos");
      }
      email = userRes.user.email;
    }

    // Use a fresh anon client (no persistence) to validate the password.
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
      throw new Error("Usuário ou senha inválidos");
    }

    return {
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
    };
  });
