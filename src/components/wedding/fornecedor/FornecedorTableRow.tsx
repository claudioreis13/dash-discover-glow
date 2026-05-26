import { Fragment } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
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

export function FornecedorTableRow({
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
    <Fragment>
      <TableRow className="group">
        <TableCell>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={onToggleExpand}
            aria-label={isOpen ? "Recolher parcelas" : "Expandir parcelas"}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </TableCell>
        <TableCell>
          <div className="font-medium">{f.nome}</div>
          {f.contato && <div className="text-xs text-muted-foreground">{f.contato}</div>}
          {f.tags && f.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {f.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {CATEGORIA_LABELS[f.categoria]}
        </TableCell>
        <TableCell className="text-right tabular-nums font-medium">
          {formatCurrency(f.valorTotal)}
        </TableCell>
        <TableCell className="min-w-[160px]">
          <div className="flex items-center gap-2">
            <Progress value={pct} className="h-2" />
            <span className="text-xs text-muted-foreground tabular-nums w-10">
              {pct.toFixed(0)}%
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {pagas}/{f.parcelas.length} parcelas
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className={statusStyle[f.status]}>
            {f.status}
          </Badge>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Ações">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {isOpen && (
        <TableRow className="bg-muted/30">
          <TableCell></TableCell>
          <TableCell colSpan={6} className="py-3">
            <FornecedorParcelasList fornecedor={f} variant="desktop" onTogglePaga={onTogglePaga} />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}
