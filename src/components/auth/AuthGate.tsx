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
      <div className="min-h-dvh flex items-center justify-center bg-background px-6">
        <div className="flex flex-col items-center gap-4">
          <div
            aria-hidden
            className="h-14 w-14 rounded-full bg-gradient-to-br from-olive to-sage shadow-hero flex items-center justify-center text-cream text-xl font-display animate-[brand-pulse_1.6s_ease-in-out_infinite]"
          >
            ♥
          </div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-sage font-semibold">
            Carregando seu casamento
          </p>
        </div>
      </div>
    );
  }


  if (status === "anon") {
    return <LoginPage />;
  }

  return <>{children}</>;
}
