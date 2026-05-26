import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { useWeddingStore } from "@/store/useWeddingStore";
import { usePagamentoCelebration } from "@/hooks/usePagamentoCelebration";
import type { Fornecedor, TipoLancamento } from "@/types/wedding";
import { FornecedorDialog } from "./FornecedorDialog";
import { toast } from "sonner";
import { useFornecedorFilters } from "./fornecedor/useFornecedorFilters";
import { FornecedorToolbar } from "./fornecedor/FornecedorToolbar";
import { FornecedorMobileCard } from "./fornecedor/FornecedorMobileCard";
import { FornecedorTableRow } from "./fornecedor/FornecedorTableRow";
import { DeleteFornecedorDialog } from "./fornecedor/DeleteFornecedorDialog";

export function FornecedorTable() {
  const { fornecedores, deleteFornecedor, restoreFornecedor } = useWeddingStore();
  const markPaid = usePagamentoCelebration();
  const filters = useFornecedorFilters(fornecedores);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Fornecedor | null>(null);
  const [dialogTipo, setDialogTipo] = useState<TipoLancamento>("fornecedor");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<Fornecedor | null>(null);

  const openNew = (tipo: TipoLancamento = "fornecedor") => {
    setEditing(null);
    setDialogTipo(tipo);
    setDialogOpen(true);
  };
  const openEdit = (f: Fornecedor) => {
    setEditing(f);
    setDialogTipo(f.tipo ?? "fornecedor");
    setDialogOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const snapshot = toDelete;
    deleteFornecedor(snapshot.id);
    setToDelete(null);
    toast.success(`"${snapshot.nome}" excluído`, {
      action: {
        label: "Desfazer",
        onClick: () => restoreFornecedor(snapshot),
      },
    });
  };

  const { filtered } = filters;
  const emptyMessage =
    fornecedores.length === 0
      ? 'Nenhum fornecedor ainda. Toque em "Novo" para começar.'
      : "Nenhum resultado para os filtros aplicados.";

  return (
    <>
      <Card className="p-3 sm:p-6">
        <FornecedorToolbar
          search={filters.search}
          onSearchChange={filters.setSearch}
          filterCat={filters.filterCat}
          onFilterCatChange={filters.setFilterCat}
          filterStatus={filters.filterStatus}
          onFilterStatusChange={filters.setFilterStatus}
          filterTag={filters.filterTag}
          onFilterTagChange={filters.setFilterTag}
          availableTags={filters.availableTags}
          sortBy={filters.sortBy}
          onSortByChange={filters.setSortBy}
          hasActiveFilters={filters.hasActiveFilters}
          onClear={filters.clearFilters}
          onNew={openNew}
        />

        {filters.hasActiveFilters && (
          <p className="text-[11px] text-muted-foreground mb-3 -mt-1">
            Mostrando {filtered.length} de {fornecedores.length} lançamentos
          </p>
        )}

        {/* Mobile card list */}
        <div className="md:hidden space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            filtered.map((f) => (
              <FornecedorMobileCard
                key={f.id}
                fornecedor={f}
                isOpen={expanded.has(f.id)}
                onToggleExpand={() => toggleExpand(f.id)}
                onTogglePaga={(numero) => markPaid(f.id, numero)}
                onEdit={() => openEdit(f)}
                onDelete={() => setToDelete(f)}
              />
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block rounded-lg border border-border/60 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f) => (
                  <FornecedorTableRow
                    key={f.id}
                    fornecedor={f}
                    isOpen={expanded.has(f.id)}
                    onToggleExpand={() => toggleExpand(f.id)}
                    onTogglePaga={(numero) => markPaid(f.id, numero)}
                    onEdit={() => openEdit(f)}
                    onDelete={() => setToDelete(f)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <FornecedorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fornecedor={editing}
        defaultTipo={dialogTipo}
      />

      <DeleteFornecedorDialog
        fornecedor={toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
