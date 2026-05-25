import { ShoppingBag, Store } from "lucide-react";
import type { TipoLancamento } from "@/types/wedding";

interface Props {
  value: TipoLancamento;
  onChange: (tipo: TipoLancamento) => void;
}

export function TipoSwitch({ value, onChange }: Props) {
  const isAvulso = value === "avulso";
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg">
      <button
        type="button"
        onClick={() => onChange("fornecedor")}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
          !isAvulso
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Store className="w-4 h-4" /> Fornecedor
      </button>
      <button
        type="button"
        onClick={() => onChange("avulso")}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
          isAvulso
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <ShoppingBag className="w-4 h-4" /> Compra avulsa
      </button>
    </div>
  );
}
