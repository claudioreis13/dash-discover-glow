import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/hooks/useFinancialCalculations";
import { totalPago } from "@/store/useWeddingStore";
import { CATEGORIA_LABELS, type Fornecedor } from "@/types/wedding";
import { statusStyle } from "./statusStyle";
import { FornecedorParcelasList } from "./FornecedorParcelasList";

interface Props {
  fornecedor: Fornecedor;
  isOpen: boolean;
  onToggleExpand: () => void;
  onTogglePaga: (numero: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function FornecedorMobileCard({
  fornecedor: f,
  isOpen,
  onToggleExpand,
  onTogglePaga,
  onEdit,
  onDelete,
}: Props) {
  const pago = totalPago(f);
  const pct = f.valorTotal > 0 ? (pago / f.valorTotal) * 100 : 0;
  const pagas = f.parcelas.filter((p) => p.pago).length;

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full text-left p-3 active:bg-muted/40"
        aria-expanded={isOpen}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{f.nome}</div>
            <div className="text-xs text-muted-foreground truncate">
              {CATEGORIA_LABELS[f.categoria]}
              {f.contato ? ` · ${f.contato}` : ""}
            </div>
          </div>
          <Badge variant="outline" className={`${statusStyle[f.status]} shrink-0`}>
            {f.status}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <span className="text-base font-semibold tabular-nums">{formatCurrency(f.valorTotal)}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {pagas}/{f.parcelas.length} · {pct.toFixed(0)}%
          </span>
        </div>
        <Progress value={pct} className="h-1.5" />
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {isOpen ? "Recolher parcelas" : "Ver parcelas"}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border/60 bg-muted/20 px-3 py-2 space-y-1">
          <FornecedorParcelasList fornecedor={f} variant="mobile" onTogglePaga={onTogglePaga} />
          <div className="flex gap-2 pt-2 border-t border-border/60">
            <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
