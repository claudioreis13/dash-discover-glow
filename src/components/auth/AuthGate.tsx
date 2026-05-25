import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWeddingStore } from "@/store/useWeddingStore";
import { LoginPage } from "./LoginPage";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authed" | "anon">("loading");
  const loadForUser = useWeddingStore((s) => s.loadForUser);
  const resetLocal = useWeddingStore((s) => s.resetLocal);

  useEffect(() => {
    let active = true;

    const handle = (userId: string | null) => {
      if (!active) return;
      if (userId) {
        setStatus("authed");
        void loadForUser(userId);
      } else {
        resetLocal();
        setStatus("anon");
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      handle(session?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      handle(data.session?.user?.id ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadForUser, resetLocal]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  if (status === "anon") {
    return <LoginPage />;
  }

  return <>{children}</>;
}
