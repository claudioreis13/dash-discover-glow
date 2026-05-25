import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWeddingStore } from "@/store/useWeddingStore";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AdminUsersDialog } from "@/components/admin/AdminUsersDialog";
import { Overview } from "@/components/wedding/Overview";
import { FornecedorTable } from "@/components/wedding/FornecedorTable";
import { Relatorios } from "@/components/wedding/Relatorios";
import { EmptyState } from "@/components/wedding/EmptyState";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Financeiro do Casamento" },
      {
        name: "description",
        content:
          "Gerencie orçamento, fornecedores e parcelas do seu casamento em um só lugar.",
      },
    ],
  }),
  component: WeddingDashboard,
});

function WeddingDashboard() {
  const {
    darkMode,
    toggleDarkMode,
    settings,
    setSettings,
    orcamentoTotal,
    setOrcamentoTotal,
    userId,
  } = useWeddingStore();
  const { isAdmin } = useIsAdmin(userId);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const [tab, setTab] = useState("inicio");



  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-0 relative">
          <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto order-2 sm:order-1">
            <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex h-9">
              <TabsTrigger value="inicio" className="text-xs sm:text-sm px-2">Início</TabsTrigger>
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2">Visão</TabsTrigger>
              <TabsTrigger value="fornecedores" className="text-xs sm:text-sm px-2">Fornec.</TabsTrigger>
              <TabsTrigger value="relatorios" className="text-xs sm:text-sm px-2">Relatórios</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="order-1 sm:order-2 flex items-center justify-end gap-1 sm:absolute sm:right-4 md:right-6 sm:top-1/2 sm:-translate-y-1/2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Configurações">
                  <Settings className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[calc(100vw-1.5rem)] sm:w-72 space-y-3"
              >
                <div>
                  <Label htmlFor="noivos">Noivos</Label>
                  <Input
                    id="noivos"
                    value={settings.noivos}
                    onChange={(e) => setSettings({ noivos: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="data">Data do casamento</Label>
                  <Input
                    id="data"
                    type="date"
                    value={settings.dataCasamento}
                    onChange={(e) =>
                      setSettings({ dataCasamento: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="orc">Orçamento total (R$)</Label>
                  <Input
                    id="orc"
                    type="number"
                    inputMode="decimal"
                    value={orcamentoTotal}
                    onChange={(e) =>
                      setOrcamentoTotal(Number(e.target.value))
                    }
                  />
                </div>
                {isAdmin && userId && (
                  <div className="pt-2 border-t border-border">
                    <AdminUsersDialog currentUserId={userId} />
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={toggleDarkMode}
              aria-label="Alternar tema"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => void supabase.auth.signOut()}
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </Button>
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
    </div>
  );
}
