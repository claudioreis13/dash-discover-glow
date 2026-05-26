import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { useWeddingStore } from "@/store/useWeddingStore";
import { formatCurrency } from "@/hooks/useFinancialCalculations";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface DayCell {
  date: Date | null;
  iso: string | null;
  valor: number;
  pago: number;
  pendente: number;
  itens: Array<{ fornecedor: string; valor: number; pago: boolean }>;
}

export function VencimentosHeatmap() {
  const { fornecedores } = useWeddingStore();
  const [offset, setOffset] = useState(0); // months from current

  const cursor = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offset);
    return d;
  }, [offset]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const byDay = useMemo(() => {
    const map = new Map<string, DayCell>();
    for (const f of fornecedores) {
      for (const p of f.parcelas) {
        if (!p.dataPagamento) continue;
        const iso = p.dataPagamento.slice(0, 10);
        if (!iso.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) continue;
        const cur = map.get(iso) ?? {
          date: new Date(iso + "T00:00:00"),
          iso,
          valor: 0,
          pago: 0,
          pendente: 0,
          itens: [],
        };
        cur.valor += p.valor;
        if (p.pago) cur.pago += p.valor;
        else cur.pendente += p.valor;
        cur.itens.push({ fornecedor: f.nome, valor: p.valor, pago: p.pago });
        map.set(iso, cur);
      }
    }
    return map;
  }, [fornecedores, year, month]);

  const maxValor = useMemo(
    () => Math.max(1, ...Array.from(byDay.values()).map((d) => d.valor)),
    [byDay],
  );

  const days: DayCell[] = useMemo(() => {
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: DayCell[] = [];
    for (let i = 0; i < startWeekday; i++) {
      cells.push({ date: null, iso: null, valor: 0, pago: 0, pendente: 0, itens: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push(
        byDay.get(iso) ?? {
          date: new Date(year, month, d),
          iso,
          valor: 0,
          pago: 0,
          pendente: 0,
          itens: [],
        },
      );
    }
    return cells;
  }, [year, month, byDay]);

  const totalMes = Array.from(byDay.values()).reduce((a, c) => a + c.valor, 0);
  const pendenteMes = Array.from(byDay.values()).reduce((a, c) => a + c.pendente, 0);

  const intensity = (v: number) => {
    if (v <= 0) return 0;
    const r = v / maxValor;
    if (r < 0.15) return 1;
    if (r < 0.35) return 2;
    if (r < 0.65) return 3;
    return 4;
  };

  const bgClass = (lvl: number) => {
    switch (lvl) {
      case 0: return "bg-muted/40";
      case 1: return "bg-primary/15";
      case 2: return "bg-primary/35";
      case 3: return "bg-primary/60";
      case 4: return "bg-primary";
      default: return "bg-muted/40";
    }
  };

  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold">Heatmap de vencimentos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Intensidade de cor por valor a pagar no dia. Identifica meses críticos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setOffset((o) => o - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {MONTH_LABELS[month]} {year}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setOffset((o) => o + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, i) => {
          if (!cell.date) {
            return <div key={i} className="aspect-square" />;
          }
          const lvl = intensity(cell.valor);
          const isToday = cell.iso === todayIso;
          const hasPendente = cell.pendente > 0;
          return (
            <div
              key={i}
              className={`aspect-square rounded-md flex flex-col items-center justify-center text-[10px] relative group cursor-default transition ${bgClass(lvl)} ${
                isToday ? "ring-2 ring-ring" : ""
              } ${lvl >= 3 ? "text-primary-foreground" : "text-foreground/80"}`}
              title={
                cell.valor > 0
                  ? `${cell.iso}\n${formatCurrency(cell.valor)} (${cell.itens.length} pagamento${cell.itens.length > 1 ? "s" : ""})\n${cell.itens.map((it) => `${it.pago ? "✓" : "•"} ${it.fornecedor}: ${formatCurrency(it.valor)}`).join("\n")}`
                  : cell.iso ?? ""
              }
            >
              <span className="font-medium">{cell.date.getDate()}</span>
              {cell.valor > 0 && (
                <span className="text-[8px] tabular-nums leading-tight opacity-80">
                  {cell.valor >= 1000 ? `${Math.round(cell.valor / 1000)}k` : Math.round(cell.valor)}
                </span>
              )}
              {hasPendente && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-warning" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Menos</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className={`w-3 h-3 rounded ${bgClass(l)}`} />
          ))}
          <span>Mais</span>
        </div>
        <div className="flex gap-4 text-muted-foreground tabular-nums">
          <span>Total no mês: <strong className="text-foreground">{formatCurrency(totalMes)}</strong></span>
          {pendenteMes > 0 && (
            <span>Pendente: <strong className="text-warning">{formatCurrency(pendenteMes)}</strong></span>
          )}
        </div>
      </div>
    </Card>
  );
}
