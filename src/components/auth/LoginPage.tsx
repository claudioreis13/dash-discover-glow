import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { loginWithIdentifier } from "@/lib/auth-login.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useServerFn(loginWithIdentifier);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { access_token, refresh_token } = await login({
        data: { identifier, password },
      });
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-serif tracking-tight text-foreground">
            Bem-vindos
          </h1>
          <p className="text-sm text-muted-foreground">
            Entre para acessar o painel do casamento.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="identifier">Usuário</Label>
            <Input
              id="identifier"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Entrar
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          O acesso é restrito. Solicite ao administrador.
        </p>
      </div>
    </div>
  );
}
