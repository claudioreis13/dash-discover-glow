import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Fornecedor } from "@/types/wedding";

interface Props {
  fornecedor: Fornecedor | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteFornecedorDialog({ fornecedor, onOpenChange, onConfirm }: Props) {
  return (
    <AlertDialog open={!!fornecedor} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a excluir <strong>{fornecedor?.nome}</strong> e todas as suas
            parcelas. Você poderá desfazer logo em seguida.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
