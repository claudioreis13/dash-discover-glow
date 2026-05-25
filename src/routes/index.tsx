import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Heart, Moon, Sun, Settings } from "lucide-react";
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
import { Overview } from "@/components/wedding/Overview";
import { FornecedorTable } from "@/components/wedding/FornecedorTable";
import { Relatorios } from "@/components/wedding/Relatorios";
import { EmptyState } from "@/components/wedding/EmptyState";
import { HeroCard } from "@/components/wedding/HeroCard";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    fornecedores,
  } = useWeddingStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const [tab, setTab] = useState("inicio");
  const temFornecedores = fornecedores.length > 0;

  const data = parseISO(settings.dataCasamento);
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);
  useEffect(() => {
    setDiasRestantes(differenceInCalendarDays(data, new Date()));
  }, [data]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">
                {settings.noivos}
              </h1>
              <p className="text-xs text-muted-foreground">
                {format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                {diasRestantes !== null && diasRestantes >= 0 && (
                  <span className="ml-2 text-primary font-medium">
                    • faltam {diasRestantes} dias
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Configurações">
                  <Settings className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-3">
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
                    value={orcamentoTotal}
                    onChange={(e) =>
                      setOrcamentoTotal(Number(e.target.value))
                    }
                  />
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Alternar tema"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="inicio">Início</TabsTrigger>
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="inicio" className="space-y-6">
            {temFornecedores && <HeroCard />}
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
