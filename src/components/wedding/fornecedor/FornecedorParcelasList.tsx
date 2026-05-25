import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/hooks/useFinancialCalculations";
import type { Fornecedor } from "@/types/wedding";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  fornecedor: Fornecedor;
  variant: "mobile" | "desktop";
  onTogglePaga: (numero: number) => void;
}

export function FornecedorParcelasList({ fornecedor, variant, onTogglePaga }: Props) {
  const isMobile = variant === "mobile";
  return (
    <ul className={isMobile ? "space-y-1" : "space-y-1.5"}>
      {fornecedor.parcelas.map((p) => (
        <li
          key={p.numero}
          className={`flex items-center gap-3 text-sm ${isMobile ? "py-1.5" : ""}`}
        >
          <Checkbox
            id={`${variant}-${fornecedor.id}-${p.numero}`}
            checked={p.pago}
            onCheckedChange={() => onTogglePaga(p.numero)}
            className={isMobile ? "h-5 w-5" : undefined}
          />
          <label
            htmlFor={`${variant}-${fornecedor.id}-${p.numero}`}
            className="cursor-pointer flex-1 flex items-center justify-between gap-2"
          >
            <span
              className={`${isMobile ? "text-xs" : ""} ${p.pago ? "line-through text-muted-foreground" : ""}`}
            >
              {isMobile
                ? `#${p.numero} · ${format(parseISO(p.dataPagamento), "dd MMM yy", { locale: ptBR })}`
                : `Parcela ${p.numero} — ${format(parseISO(p.dataPagamento), "dd 'de' MMM, yyyy", { locale: ptBR })}`}
            </span>
            <span className={`tabular-nums font-medium ${isMobile ? "text-sm" : ""}`}>
              {formatCurrency(p.valor)}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
