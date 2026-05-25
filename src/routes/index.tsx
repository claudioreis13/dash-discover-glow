import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeddingStore } from "@/store/useWeddingStore";
import { Overview } from "@/components/wedding/Overview";
import { FornecedorTable } from "@/components/wedding/FornecedorTable";
import { Relatorios } from "@/components/wedding/Relatorios";
import { EmptyState } from "@/components/wedding/EmptyState";
import { QuickAddButton } from "@/components/wedding/QuickAddButton";
import { TopNav, type TabValue } from "@/components/wedding/TopNav";
import { SettingsDialog } from "@/components/wedding/SettingsDialog";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

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
  const { darkMode } = useWeddingStore();
  const [tab, setTab] = useState<TabValue>("inicio");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-0 relative">
          <div className="w-full sm:w-auto order-2 sm:order-1 min-w-0">
            <TopNav value={tab} onChange={setTab} />
          </div>

          <div className="order-1 sm:order-2 flex items-center justify-end gap-2 sm:absolute sm:right-4 md:right-6 sm:top-1/2 sm:-translate-y-1/2">
            <AnimatedThemeToggler onToggle={() => useWeddingStore.getState().toggleDarkMode()} />
            <SettingsDialog />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="space-y-6">
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

      {(tab === "overview" || tab === "fornecedores") && <QuickAddButton />}
    </div>
  );
}
