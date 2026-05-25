import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Moon,
  Settings,
  LogOut,
  Home,
  LayoutDashboard,
  Users,
  FileBarChart,
  Heart,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWeddingStore } from "@/store/useWeddingStore";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AdminUsersDialog } from "@/components/admin/AdminUsersDialog";
import { Overview } from "@/components/wedding/Overview";
import { FornecedorTable } from "@/components/wedding/FornecedorTable";
import { Relatorios } from "@/components/wedding/Relatorios";
import { EmptyState } from "@/components/wedding/EmptyState";
import { QuickAddButton } from "@/components/wedding/QuickAddButton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Financeiro do Casamento" },
      {
        name: "description",
        content: "Gerencie orçamento, fornecedores e parcelas do seu casamento em um só lugar.",
      },
    ],
  }),
  component: WeddingDashboard,
});

function WeddingDashboard() {
  const { darkMode, toggleDarkMode, settings, orcamentoTotal, saveSettings, userId } =
    useWeddingStore();
  const { isAdmin } = useIsAdmin(userId);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const [tab, setTab] = useState("inicio");
  const [settingsDraft, setSettingsDraft] = useState(settings);
  const [orcamentoDraft, setOrcamentoDraft] = useState(String(orcamentoTotal));
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    setSettingsDraft(settings);
    setOrcamentoDraft(String(orcamentoTotal));
  }, [settings, orcamentoTotal]);

  const today = new Date().toISOString().slice(0, 10);

  const handleSaveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (settingsDraft.dataCasamento) {
      const parsed = new Date(settingsDraft.dataCasamento);
      const year = parsed.getUTCFullYear();
      if (isNaN(parsed.getTime()) || year < 2000 || year > 2100) {
        toast.error("Data do casamento inválida. Use o formato AAAA-MM-DD.");
        return;
      }
    }

    setIsSavingSettings(true);
    const saved = await saveSettings(settingsDraft, Number(orcamentoDraft) || 0);
    setIsSavingSettings(false);

    if (saved) {
      toast.success("Configurações salvas");
    } else {
      toast.error("Não foi possível salvar as configurações");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-0 relative">
          <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto order-2 sm:order-1 min-w-0">
            <TabsList className="sr-only">
              <TabsTrigger value="inicio">Início</TabsTrigger>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
              <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            </TabsList>
            <div className="relative -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <nav
                role="tablist"
                aria-label="Navegação principal"
                className="relative inline-flex w-max sm:w-auto items-center gap-0.5 rounded-full border border-sage/30 bg-card/70 p-1 shadow-[0_4px_20px_-8px_color-mix(in_oklab,var(--sage)_40%,transparent)] backdrop-blur"
              >
                {[
                  { value: "inicio", label: "Início", Icon: Home },
                  { value: "overview", label: "Visão Geral", Icon: LayoutDashboard },
                  { value: "fornecedores", label: "Fornecedores", Icon: Users },
                  { value: "relatorios", label: "Relatórios", Icon: FileBarChart },
                ].map(({ value, label, Icon }) => {
                  const isActive = tab === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setTab(value)}
                      className={`group relative flex items-center justify-center gap-1.5 rounded-full px-3.5 sm:px-4 py-2 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap min-h-[40px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                        isActive
                          ? "text-sage-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="menu-pill"
                          aria-hidden
                          className="absolute inset-0 rounded-full bg-gradient-to-br from-sage to-sage/85 shadow-[0_6px_18px_-6px_color-mix(in_oklab,var(--sage)_70%,transparent)]"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <Icon
                        className={`relative z-10 w-4 h-4 transition-transform duration-200 ${
                          isActive ? "" : "group-hover:scale-110"
                        }`}
                        strokeWidth={isActive ? 2.2 : 1.75}
                      />
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </Tabs>

          <div className="order-1 sm:order-2 flex items-center justify-end gap-1 sm:absolute sm:right-4 md:right-6 sm:top-1/2 sm:-translate-y-1/2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-sage/15 hover:bg-sage/25 text-foreground border border-sage/30 shadow-sm transition-colors"
                  aria-label="Abrir menu de opções"
                >
                  <Settings className="w-[18px] h-[18px]" strokeWidth={1.8} />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={10}
                className="w-[min(calc(100vw-1.5rem),360px)] p-0 overflow-hidden rounded-2xl border-border/70 shadow-xl"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-border/60 bg-card">
                  <h2 className="font-serif text-2xl font-semibold text-foreground leading-tight">
                    Configurações
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-sage font-semibold mt-1">
                    Personalize sua experiência
                  </p>
                </div>

                <div className="px-5 py-5 space-y-6 max-h-[min(75vh,560px)] overflow-y-auto">
                  {/* Section: Casamento */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-4 bg-sage rounded-full" />
                      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Heart className="w-3 h-3 text-sage" />
                        Casamento
                      </h3>
                    </div>

                    <form onSubmit={handleSaveSettings} className="space-y-3">
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
                            setSettingsDraft((current) => ({
                              ...current,
                              noivos: e.target.value,
                            }))
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
                        disabled={isSavingSettings}
                        className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md shadow-primary/10 transition-all active:scale-[0.98]"
                      >
                        {isSavingSettings ? "Salvando..." : "Salvar alterações"}
                      </Button>
                    </form>
                  </section>

                  {/* Section: Preferências */}
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-4 bg-sage rounded-full" />
                      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        Preferências
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="dark-mode-switch"
                        className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/60 cursor-pointer hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-card rounded-lg shadow-sm text-sage border border-border/40">
                            <Moon className="w-4 h-4" strokeWidth={1.8} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground leading-tight">
                              Modo escuro
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              Reduz o brilho da interface
                            </span>
                          </div>
                        </div>
                        <Switch
                          id="dark-mode-switch"
                          checked={darkMode}
                          onCheckedChange={toggleDarkMode}
                          aria-label="Alternar modo escuro"
                        />
                      </label>

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

                {/* Footer: Logout */}
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="sr-only">
            <TabsTrigger value="inicio">Início</TabsTrigger>
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="inicio" className="space-y-6">
            <EmptyState />
          </TabsContent>
          <TabsContent value="overview" className="space-y-6">
            <Overview />
          </TabsContent>
          <TabsContent value="fornecedores">
            <FornecedorTable />
          </TabsContent>
          <TabsContent value="relatorios">
            <Relatorios />
          </TabsContent>
        </Tabs>
      </main>

      <QuickAddButton />
    </div>
  );
}
