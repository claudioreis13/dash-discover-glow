import { useState } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { FornecedorDialog } from "./FornecedorDialog";
import type { TipoLancamento } from "@/types/wedding";

interface Props {
  defaultTipo?: TipoLancamento;
}

export function QuickAddButton({ defaultTipo = "fornecedor" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Adicionar novo lançamento"
        className="fixed bottom-5 right-5 sm:bottom-8 sm:right-8 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-sage to-sage/85 text-sage-foreground shadow-[0_12px_30px_-8px_color-mix(in_oklab,var(--sage)_55%,transparent)] flex items-center justify-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/60 focus-visible:ring-offset-2"
      >
        <Plus
          className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90"
          strokeWidth={2.2}
        />
        <span className="sr-only">Adicionar lançamento rápido</span>
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-sage/40 -z-10 animate-ping opacity-0 group-hover:opacity-30"
        />
      </motion.button>

      <FornecedorDialog
        open={open}
        onOpenChange={setOpen}
        defaultTipo={defaultTipo}
      />
    </>
  );
}
