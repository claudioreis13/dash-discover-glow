import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/hooks/useFinancialCalculations";
import { Calendar, AlertTriangle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePagamentoCelebration } from "@/hooks/usePagamentoCelebration";

interface Parcela {
  fornecedorId: string;
  fornecedorNome: string;
  numero: number;
  valor: number;
  data: string;
  diasRestantes: number;
}

export function PaymentTimeline({ items }: { items: Parcela[] }) {
  const toggleParcelaPaga = useWeddingStore((s) => s.toggleParcelaPaga);
  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-semibold">Próximos pagamentos</h3>
      </div>
      {items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground py-8">
          Nenhum pagamento pendente
        </div>
      ) : (
        <ScrollArea className="flex-1 -mr-2 pr-2 max-h-72">
          <ul className="space-y-3">
            {items.slice(0, 8).map((p) => {
              const atrasado = p.diasRestantes < 0;
              const urgente = p.diasRestantes >= 0 && p.diasRestantes <= 14;
              const id = `tl-${p.fornecedorId}-${p.numero}`;
              return (
                <li
                  key={id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-accent/30 transition-colors"
                >
                  <Checkbox
                    id={id}
                    className="mt-0.5"
                    onCheckedChange={() => {
                      toggleParcelaPaga(p.fornecedorId, p.numero);
                      toast.success(`Parcela ${p.numero} marcada como paga ✓`);
                    }}
                  />
                  <label
                    htmlFor={id}
                    className="flex-1 flex items-start justify-between gap-3 cursor-pointer min-w-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {p.fornecedorNome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Parcela {p.numero} •{" "}
                        {format(parseISO(p.data), "dd 'de' MMM, yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(p.valor)}
                      </p>
                      {atrasado ? (
                        <Badge variant="destructive" className="mt-1 text-[10px]">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {Math.abs(p.diasRestantes)}d atrasado
                        </Badge>
                      ) : urgente ? (
                        <Badge className="mt-1 text-[10px] bg-[var(--warning)]/20 text-[var(--warning)] hover:bg-[var(--warning)]/20">
                          <Clock className="w-3 h-3 mr-1" />
                          em {p.diasRestantes}d
                        </Badge>
                      ) : (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          em {p.diasRestantes}d
                        </p>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      )}
    </Card>
  );
}
