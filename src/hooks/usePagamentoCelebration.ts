import { useCallback } from "react";
import { toast } from "sonner";
import { useWeddingStore } from "@/store/useWeddingStore";
import { celebrateParcela, celebrateFornecedorQuitado } from "@/lib/celebrate";

/**
 * Wrapper único para alternar parcelas com animação premium:
 * - pequeno confetti ao marcar parcela como paga;
 * - celebração grande + toast especial quando o fornecedor fica 100% quitado.
 */
export function usePagamentoCelebration() {
  const toggleParcelaPaga = useWeddingStore((s) => s.toggleParcelaPaga);

  return useCallback(
    (fornecedorId: string, numero: number) => {
      const state = useWeddingStore.getState();
      const f = state.fornecedores.find((x) => x.id === fornecedorId);
      if (!f) return;
      const parcela = f.parcelas.find((p) => p.numero === numero);
      if (!parcela) return;

      const eraPaga = parcela.pago;
      const pagasAntes = f.parcelas.filter((p) => p.pago).length;
      const total = f.parcelas.length;

      toggleParcelaPaga(fornecedorId, numero);

      if (eraPaga) {
        toast.info(`Parcela ${numero} desmarcada`);
        return;
      }

      const ficouQuitado = pagasAntes + 1 === total;

      if (ficouQuitado) {
        celebrateFornecedorQuitado();
        toast.success(`${f.nome} quitado! 🎉`, {
          description: "Todas as parcelas foram pagas.",
          duration: 5000,
        });
      } else {
        celebrateParcela();
        toast.success(`Parcela ${numero} paga ✓`, {
          description: `${pagasAntes + 1} de ${total} parcelas quitadas`,
        });
      }
    },
    [toggleParcelaPaga],
  );
}
