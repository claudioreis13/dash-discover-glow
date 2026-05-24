import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Plus } from "lucide-react";
import { CATEGORIA_LABELS, type CategoriaType } from "@/types/wedding";
import { FornecedorDialog } from "./FornecedorDialog";

const SUGESTOES: { categoria: CategoriaType; nome: string; emoji: string }[] = [
  { categoria: "festa", nome: "Buffet & local", emoji: "🍽️" },
  { categoria: "foto-video", nome: "Foto & vídeo", emoji: "📸" },
  { categoria: "musica", nome: "DJ / banda", emoji: "🎵" },
  { categoria: "visual", nome: "Vestido & traje", emoji: "👰" },
  { categoria: "cerimonia", nome: "Cerimonial", emoji: "💍" },
  { categoria: "convites", nome: "Convites & papelaria", emoji: "✉️" },
];

export function EmptyState() {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<CategoriaType | undefined>(undefined);

  const start = (categoria?: CategoriaType) => {
    setCat(categoria);
    setOpen(true);
  };

  return (
    <>
      <Card className="p-10 text-center bg-gradient-to-br from-primary/5 to-accent/30 border-dashed border-primary/30">
        <div className="max-w-xl mx-auto space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Heart className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Vamos começar?</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Cadastre seu primeiro fornecedor para acompanhar parcelas,
              vencimentos e o orçamento do casamento.
            </p>
          </div>

          <div className="pt-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Sugestões para começar
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s.categoria + s.nome}
                  onClick={() => start(s.categoria)}
                  className="group flex items-center gap-2 p-3 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 transition text-left"
                >
                  <span className="text-xl">{s.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{s.nome}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {CATEGORIA_LABELS[s.categoria]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button size="lg" onClick={() => start()} className="mt-2">
            <Plus className="w-4 h-4 mr-1" /> Novo fornecedor
          </Button>
        </div>
      </Card>

      <FornecedorDialog
        open={open}
        onOpenChange={setOpen}
        defaultCategoria={cat}
      />
    </>
  );
}
