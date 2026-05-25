import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import type { Parcela } from "@/types/wedding";

interface Props {
  parcelas: Parcela[];
  somaParcelas: number;
  onUpdate: (idx: number, patch: Partial<Parcela>) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

export function ParcelasEditor({ parcelas, somaParcelas, onUpdate, onAdd, onRemove }: Props) {
  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <Label className="text-sm font-semibold">Parcelas</Label>
          <p className="text-xs text-muted-foreground">
            Soma: R$ {somaParcelas.toLocaleString("pt-BR")}
          </p>
        </div>
        <Button size="sm" variant="outline" type="button" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>
      <div className="space-y-2">
        {parcelas.map((p, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-border/60 bg-muted/30 p-2.5 space-y-2 sm:bg-transparent sm:border-0 sm:p-0 sm:space-y-0 sm:grid sm:grid-cols-[auto_1fr_1fr_auto_auto] sm:gap-2 sm:items-center"
          >
            <div className="flex items-center justify-between sm:contents">
              <span className="text-xs font-medium text-muted-foreground sm:w-6">
                Parcela #{p.numero}
              </span>
              <div className="flex items-center gap-1 sm:contents">
                <label
                  className="flex items-center gap-1.5 text-xs cursor-pointer sm:order-2"
                  htmlFor={`pago-${idx}`}
                >
                  <Checkbox
                    id={`pago-${idx}`}
                    checked={p.pago}
                    onCheckedChange={(v) => onUpdate(idx, { pago: !!v })}
                  />
                  pago
                </label>
                <Button
                  size="icon"
                  variant="ghost"
                  type="button"
                  onClick={() => onRemove(idx)}
                  disabled={parcelas.length === 1}
                  aria-label="Remover parcela"
                  className="h-8 w-8 sm:order-3"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:contents">
              <div className="sm:contents">
                <Label
                  htmlFor={`valor-${idx}`}
                  className="text-[10px] uppercase tracking-wide text-muted-foreground sm:sr-only"
                >
                  Valor (R$)
                </Label>
                <Input
                  id={`valor-${idx}`}
                  type="number"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={p.valor || ""}
                  onChange={(e) => onUpdate(idx, { valor: Number(e.target.value) })}
                />
              </div>
              <div className="sm:contents">
                <Label
                  htmlFor={`data-${idx}`}
                  className="text-[10px] uppercase tracking-wide text-muted-foreground sm:sr-only"
                >
                  Data
                </Label>
                <Input
                  id={`data-${idx}`}
                  type="date"
                  value={p.dataPagamento}
                  onChange={(e) => onUpdate(idx, { dataPagamento: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
