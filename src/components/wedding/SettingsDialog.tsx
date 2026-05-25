import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  LogOut,
  Users,
  Heart,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useWeddingStore } from "@/store/useWeddingStore";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AdminUsersDialog } from "@/components/admin/AdminUsersDialog";

export function SettingsDialog() {
  const { darkMode, toggleDarkMode, settings, orcamentoTotal, saveSettings, userId } =
    useWeddingStore();
  const { isAdmin } = useIsAdmin(userId);

  const [settingsDraft, setSettingsDraft] = useState(settings);
  const [orcamentoDraft, setOrcamentoDraft] = useState(String(orcamentoTotal));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettingsDraft(settings);
    setOrcamentoDraft(String(orcamentoTotal));
  }, [settings, orcamentoTotal]);

  const today = new Date().toISOString().slice(0, 10);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (settingsDraft.dataCasamento) {
      const parsed = new Date(settingsDraft.dataCasamento);
      const year = parsed.getUTCFullYear();
      if (isNaN(parsed.getTime()) || year < 2000 || year > 2100) {
        toast.error("Data do casamento inválida. Use o formato AAAA-MM-DD.");
        return;
      }
    }

    setIsSaving(true);
    const saved = await saveSettings(settingsDraft, Number(orcamentoDraft) || 0);
    setIsSaving(false);

    if (saved) toast.success("Configurações salvas");
    else toast.error("Não foi possível salvar as configurações");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost-sage"
          size="icon"
          className="h-10 w-10 rounded-full"
          aria-label="Abrir menu de opções"
        >
          <SettingsIcon className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(calc(100vw-1.5rem),360px)] p-0 overflow-hidden rounded-2xl border-border/70 shadow-xl"
      >
        <div className="px-5 py-4 border-b border-border/60 bg-card">
          <h2 className="font-serif text-2xl font-semibold text-foreground leading-tight">
            Configurações
          </h2>
          <p className="text-[10px] uppercase tracking-[0.18em] text-sage font-semibold mt-1">
            Personalize sua experiência
          </p>
        </div>

        <div className="px-5 py-5 space-y-6 max-h-[min(75vh,560px)] overflow-y-auto">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-sage rounded-full" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Heart className="w-3 h-3 text-sage" />
                Casamento
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="noivos"
                  className="text-[10px] font-medium text-sage uppercase tracking-wider ml-1"
                >
                  Nomes do Casal
                </Label>
                <Input
                  id="noivos"
                  value={settingsDraft.noivos}
                  onChange={(e) =>
                    setSettingsDraft((current) => ({ ...current, noivos: e.target.value }))
                  }
                  className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-sage/40 focus-visible:border-sage"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="data"
                    className="text-[10px] font-medium text-sage uppercase tracking-wider ml-1"
                  >
                    Data
                  </Label>
                  <Input
                    id="data"
                    type="date"
                    min={today}
                    max="2100-12-31"
                    value={settingsDraft.dataCasamento}
                    onChange={(e) =>
                      setSettingsDraft((current) => ({
                        ...current,
                        dataCasamento: e.target.value,
                      }))
                    }
                    className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-sage/40 focus-visible:border-sage px-3"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="orc"
                    className="text-[10px] font-medium text-sage uppercase tracking-wider ml-1"
                  >
                    Orçamento
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-sage pointer-events-none">
                      R$
                    </span>
                    <Input
                      id="orc"
                      type="number"
                      inputMode="decimal"
                      value={orcamentoDraft}
                      onChange={(e) => setOrcamentoDraft(e.target.value)}
                      className="h-10 rounded-xl bg-muted/40 border-border/60 focus-visible:ring-sage/40 focus-visible:border-sage pl-8"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full h-11 rounded-xl font-medium shadow-md shadow-primary/10 transition-all active:scale-[0.98]"
              >
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </form>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-sage rounded-full" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Preferências
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/60 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-card rounded-lg shadow-sm text-sage border border-border/40 flex items-center justify-center">
                    <AnimatedThemeToggler onToggle={() => toggleDarkMode()} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground leading-tight">
                      Modo escuro
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Toque no ícone para alternar
                    </span>
                  </div>
                </div>
              </div>

              {isAdmin && userId && (
                <AdminUsersDialog
                  currentUserId={userId}
                  trigger={
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/60 hover:bg-muted/60 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-card rounded-lg shadow-sm text-sage border border-border/40">
                          <Users className="w-4 h-4" strokeWidth={1.8} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground leading-tight">
                            Gerenciar usuários
                          </span>
                          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Apenas administradores
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  }
                />
              )}
            </div>
          </section>
        </div>

        <div className="px-5 py-3 bg-muted/30 border-t border-border/60">
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Encerrar sessão
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
