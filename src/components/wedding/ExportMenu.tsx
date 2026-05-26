import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWeddingStore } from "@/store/useWeddingStore";
import { useFinancialCalculations } from "@/hooks/useFinancialCalculations";
import { exportCSV, exportPDF } from "@/lib/exportReport";

export function ExportMenu() {
  const fornecedores = useWeddingStore((s) => s.fornecedores);
  const settings = useWeddingStore((s) => s.settings);
  const { dashboard, gastosPorCategoria } = useFinancialCalculations();

  const payload = {
    noivos: settings.noivos,
    dataCasamento: settings.dataCasamento,
    dashboard,
    gastosPorCategoria,
    fornecedores,
  };

  const disabled = fornecedores.length === 0;

  const handlePDF = () => {
    try {
      exportPDF(payload);
      toast.success("PDF gerado");
    } catch (e) {
      console.error("[export] PDF failed", e);
      toast.error("Falha ao gerar PDF");
    }
  };

  const handleCSV = () => {
    try {
      exportCSV(payload);
      toast.success("CSV gerado");
    } catch (e) {
      console.error("[export] CSV failed", e);
      toast.error("Falha ao gerar CSV");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handlePDF} className="gap-2">
          <FileText className="w-4 h-4" />
          Relatório PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCSV} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Planilha CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
