import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useWeddingStore } from "@/store/useWeddingStore";
import { formatCurrency } from "@/hooks/useFinancialCalculations";
import { toast } from "sonner";

interface Item {
  fornecedorId: string;
  fornecedorNome: string;
  numero: number;
  valor: number;
  data: Date;
  pago: boolean;
}

export function PaymentCalendar() {
  const { fornecedores, toggleParcelaPaga } = useWeddingStore();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const items: Item[] = useMemo(
    () =>
      fornecedores.flatMap((f) =>
        f.parcelas.map((p) => ({
          fornecedorId: f.id,
          fornecedorNome: f.nome,
          numero: p.numero,
          valor: p.valor,
          data: parseISO(p.dataPagamento),
          pago: p.pago,
        })),
      ),
    [fornecedores],
  );

  const mesItems = items.filter((i) => isSameMonth(i.data, cursor));
  const totalMes = mesItems.reduce((a, i) => a + i.valor, 0);
  const pagoMes = mesItems
    .filter((i) => i.pago)
    .reduce((a, i) => a + i.valor, 0);

  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });

  const days: Date[] = [];
  for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) {
    days.push(d);
  }

  const today = new Date();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="text-lg font-semibold">Calendário de pagamentos</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCursor(addMonths(cursor, -1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <p className="text-sm font-medium capitalize w-32 text-center">
            {format(cursor, "MMMM yyyy", { locale: ptBR })}
          </p>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCursor(addMonths(cursor, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div key={d} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const dia = d.getDate();
          const noMes = isSameMonth(d, cursor);
          const isToday = isSameDay(d, today);
          const dayItems = items.filter((i) => isSameDay(i.data, d));
          const totalDia = dayItems.reduce((a, i) => a + i.valor, 0);
          const todosPagos = dayItems.length > 0 && dayItems.every((i) => i.pago);
          const algumAtrasado = dayItems.some(
            (i) => !i.pago && i.data < today,
          );

          const cell = (
            <button
              type="button"
              className={`relative w-full aspect-square min-h-[58px] p-1.5 rounded-lg border text-left transition
                ${noMes ? "bg-card" : "bg-muted/30 text-muted-foreground"}
                ${isToday ? "border-primary ring-1 ring-primary/30" : "border-border/50"}
                ${dayItems.length ? "hover:border-primary/50 cursor-pointer" : "cursor-default"}
              `}
              disabled={dayItems.length === 0}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`text-xs font-medium ${
                    isToday ? "text-primary" : ""
                  }`}
                >
                  {dia}
                </span>
                {dayItems.length > 0 && (
                  <span
                    className={`text-[9px] font-semibold px-1 rounded ${
                      algumAtrasado
                        ? "bg-destructive/20 text-destructive"
                        : todosPagos
                          ? "bg-[var(--success)]/20 text-[var(--success)]"
                          : "bg-primary/15 text-primary"
                    }`}
                  >
                    {dayItems.length}
                  </span>
                )}
              </div>
              {dayItems.length > 0 && (
                <p className="text-[9px] tabular-nums text-muted-foreground mt-auto absolute bottom-1 left-1.5">
                  {formatCurrency(totalDia)}
                </p>
              )}
            </button>
          );

          if (dayItems.length === 0) {
            return <div key={d.toISOString()}>{cell}</div>;
          }

          return (
            <Popover key={d.toISOString()}>
              <PopoverTrigger asChild>{cell}</PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <p className="text-xs font-semibold mb-2">
                  {format(d, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                <ul className="space-y-2">
                  {dayItems.map((i) => (
                    <li
                      key={`${i.fornecedorId}-${i.numero}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        id={`cal-${i.fornecedorId}-${i.numero}`}
                        checked={i.pago}
                        onCheckedChange={() => {
                          toggleParcelaPaga(i.fornecedorId, i.numero);
                          toast.success(
                            i.pago
                              ? `Parcela desmarcada`
                              : `Parcela ${i.numero} paga ✓`,
                          );
                        }}
                      />
                      <label
                        htmlFor={`cal-${i.fornecedorId}-${i.numero}`}
                        className="flex-1 flex items-center justify-between cursor-pointer gap-2"
                      >
                        <span
                          className={`truncate ${
                            i.pago ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {i.fornecedorNome}{" "}
                          <span className="text-xs text-muted-foreground">
                            #{i.numero}
                          </span>
                        </span>
                        <span className="tabular-nums font-medium text-xs shrink-0">
                          {formatCurrency(i.valor)}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      {mesItems.length > 0 && (
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {mesItems.length} parcela{mesItems.length > 1 ? "s" : ""} no mês
          </span>
          <span className="tabular-nums">
            Pago:{" "}
            <strong className="text-[var(--success)]">
              {formatCurrency(pagoMes)}
            </strong>{" "}
            / Total:{" "}
            <strong className="text-foreground">{formatCurrency(totalMes)}</strong>
          </span>
        </div>
      )}
    </Card>
  );
}
