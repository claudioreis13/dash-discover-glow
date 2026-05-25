import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Plus,
  Utensils,
  Camera,
  Music,
  Shirt,
  Gem,
  Mail,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useWeddingStore } from "@/store/useWeddingStore";
import { CATEGORIA_LABELS, type CategoriaType } from "@/types/wedding";
import { FornecedorDialog } from "./FornecedorDialog";

type Suggestion = {
  categoria: CategoriaType;
  nome: string;
  hint: string;
  Icon: LucideIcon;
};

const SUGESTOES_PRIMARY: Suggestion[] = [
  {
    categoria: "festa",
    nome: "Buffet & Local",
    hint: "O coração da celebração",
    Icon: Utensils,
  },
  {
    categoria: "foto-video",
    nome: "Foto & Vídeo",
    hint: "Memórias para sempre",
    Icon: Camera,
  },
  {
    categoria: "musica",
    nome: "Música & Banda",
    hint: "A alma da sua festa",
    Icon: Music,
  },
];

const SUGESTOES_SECUNDARIAS: Suggestion[] = [
  {
    categoria: "visual",
    nome: "Vestido & Traje",
    hint: "Look do grande dia",
    Icon: Shirt,
  },
  {
    categoria: "cerimonia",
    nome: "Cerimonial",
    hint: "Coordenação completa",
    Icon: Gem,
  },
  {
    categoria: "convites",
    nome: "Convites & Papelaria",
    hint: "Primeiro toque dos convidados",
    Icon: Mail,
  },
];

export function EmptyState() {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<CategoriaType | undefined>(undefined);
  const [showAll, setShowAll] = useState(false);

  const { settings } = useWeddingStore();
  const dataCasamento = parseISO(settings.dataCasamento);
  const dataValida = !isNaN(dataCasamento.getTime());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dias =
    mounted && dataValida
      ? Math.max(0, differenceInCalendarDays(dataCasamento, new Date()))
      : 0;

  const start = (categoria?: CategoriaType) => {
    setCat(categoria);
    setOpen(true);
  };

  const sugestoes = showAll
    ? [...SUGESTOES_PRIMARY, ...SUGESTOES_SECUNDARIAS]
    : SUGESTOES_PRIMARY;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-3xl mx-auto py-6 md:py-10 space-y-10 md:space-y-14"
      >
        {/* Hero — Emotional Welcome */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blush/30"
          >
            <Heart className="w-6 h-6 text-blush" fill="currentColor" />
          </motion.div>
          <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Bem-vindos, {settings.noivos}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            {mounted && dataValida ? (
              <>
                O grande dia está a{" "}
                <span className="text-[var(--warning)] font-semibold tabular-nums">
                  {dias} {dias === 1 ? "dia" : "dias"}
                </span>{" "}
                de distância. Vamos tornar o planejamento tão especial quanto a
                festa?
              </>
            ) : (
              <>
                Defina a{" "}
                <span className="text-[var(--warning)] font-semibold">
                  data do casamento
                </span>{" "}
                nas configurações para começar a contagem regressiva.
              </>
            )}
          </p>
        </div>

        {/* Primary CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="relative overflow-hidden bg-card border border-sage/40 rounded-3xl p-6 md:p-10 text-center shadow-[0_10px_40px_-15px_color-mix(in_oklab,var(--sage)_40%,transparent)]"
        >
          <div
            aria-hidden
            className="absolute top-0 right-0 w-32 h-32 bg-sage/10 rounded-bl-full pointer-events-none"
          />
          <div className="relative z-10 max-w-sm mx-auto space-y-6">
            <div className="space-y-2">
              <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-semibold whitespace-nowrap">
                Sua jornada começa agora
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Adicione seu primeiro contrato para desbloquear o controle de
                parcelas e visibilidade total do seu orçamento.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => start()}
              className="bg-sage text-sage-foreground hover:bg-sage/90 rounded-full px-7 shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Cadastrar primeiro fornecedor
            </Button>
          </div>
        </motion.div>


        {/* Curated Suggestions */}
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="h-px flex-1 bg-[var(--warning)]/30" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--warning)] font-bold">
              Sugestões para começar
            </span>
            <div className="h-px flex-1 bg-[var(--warning)]/30" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {sugestoes.map((s, i) => (
              <motion.button
                key={s.categoria}
                onClick={() => start(s.categoria)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.35 }}
                whileHover={{ y: -2 }}
                className="group p-5 md:p-6 bg-card border border-border/60 hover:border-blush/50 hover:bg-blush/5 rounded-2xl text-left transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-muted group-hover:bg-card flex items-center justify-center mb-4 transition-colors">
                  <s.Icon className="w-5 h-5 text-foreground/80" strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-sm text-foreground">
                  {s.nome}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {s.hint}
                </p>
                <p className="sr-only">{CATEGORIA_LABELS[s.categoria]}</p>
              </motion.button>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {showAll ? "Ver menos categorias" : "Ver todas as categorias"}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.section>

      <FornecedorDialog
        open={open}
        onOpenChange={setOpen}
        defaultCategoria={cat}
      />
    </>
  );
}
