import { Fragment, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pencil,
  Trash2,
  MoreVertical,
  Plus,
  ShoppingBag,
  Search,
  ChevronDown,
  ChevronRight,
  X,
  ArrowUpDown,
} from "lucide-react";
import {
  useWeddingStore,
  totalPago,
} from "@/store/useWeddingStore";
import { usePagamentoCelebration } from "@/hooks/usePagamentoCelebration";
import { formatCurrency } from "@/hooks/useFinancialCalculations";
import {
  CATEGORIA_LABELS,
  type CategoriaType,
  type Fornecedor,
  type StatusType,
  type TipoLancamento,
} from "@/types/wedding";
import { FornecedorDialog } from "./FornecedorDialog";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const statusStyle: Record<StatusType, string> = {
  pago: "bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30",
  parcial: "bg-[var(--warning)]/20 text-[var(--warning)] border-[var(--warning)]/30",
  pendente: "bg-muted text-muted-foreground border-border",
  atrasado: "bg-destructive/15 text-destructive border-destructive/30",
};

export function FornecedorTable() {
  const { fornecedores, deleteFornecedor, restoreFornecedor } =
    useWeddingStore();
  const markPaid = usePagamentoCelebration();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<CategoriaType | "todos">("todos");
  const [filterStatus, setFilterStatus] = useState<StatusType | "todos">(
    "todos",
  );
  const [sortBy, setSortBy] = useState<
    "recent" | "nome" | "valor-desc" | "valor-asc" | "vencimento"
  >("recent");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Fornecedor | null>(null);
  const [dialogTipo, setDialogTipo] = useState<TipoLancamento>("fornecedor");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<Fornecedor | null>(null);

  const hasActiveFilters =
    search !== "" || filterCat !== "todos" || filterStatus !== "todos";

  const clearFilters = () => {
    setSearch("");
    setFilterCat("todos");
    setFilterStatus("todos");
  };

  const filtered = useMemo(() => {
    const list = fornecedores.filter((f) => {
      if (filterCat !== "todos" && f.categoria !== filterCat) return false;
      if (filterStatus !== "todos" && f.status !== filterStatus) return false;
      if (search && !f.nome.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
    const sorted = [...list];
    switch (sortBy) {
      case "nome":
        sorted.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        break;
      case "valor-desc":
        sorted.sort((a, b) => b.valorTotal - a.valorTotal);
        break;
      case "valor-asc":
        sorted.sort((a, b) => a.valorTotal - b.valorTotal);
        break;
      case "vencimento":
        sorted.sort((a, b) =>
          (a.vencimento || "9999").localeCompare(b.vencimento || "9999"),
        );
        break;
      default:
        // keep store order (chronological)
        break;
    }
    return sorted;
  }, [fornecedores, search, filterCat, filterStatus, sortBy]);

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

  return (
    <>
      <Card className="p-3 sm:p-6">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-4">
          <div className="flex flex-1 gap-2 items-stretch flex-wrap">
            <div className="relative flex-1 min-w-[140px] sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select
                value={filterCat}
                onValueChange={(v) => setFilterCat(v as CategoriaType | "todos")}
              >
                <SelectTrigger className="flex-1 sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas categorias</SelectItem>
                  {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as StatusType | "todos")}
              >
                <SelectTrigger className="flex-1 sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos status</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:flex gap-2">
            <Button variant="outline" onClick={() => openNew("avulso")} className="w-full md:w-auto">
              <ShoppingBag className="w-4 h-4 mr-1" />
              <span className="truncate">Avulsa</span>
            </Button>
            <Button onClick={() => openNew("fornecedor")} className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-1" /> Novo
            </Button>
          </div>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {fornecedores.length === 0
                ? 'Nenhum fornecedor ainda. Toque em "Novo" para começar.'
                : "Nenhum resultado para os filtros aplicados."}
            </div>
          ) : (
            filtered.map((f) => {
              const pago = totalPago(f);
              const pct = f.valorTotal > 0 ? (pago / f.valorTotal) * 100 : 0;
              const isOpen = expanded.has(f.id);
              const pagas = f.parcelas.filter((p) => p.pago).length;
              return (
                <div
                  key={f.id}
                  className="rounded-xl border border-border/60 bg-card overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(f.id)}
                    className="w-full text-left p-3 active:bg-muted/40"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{f.nome}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {CATEGORIA_LABELS[f.categoria]}
                          {f.contato ? ` · ${f.contato}` : ""}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${statusStyle[f.status]} shrink-0`}
                      >
                        {f.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-base font-semibold tabular-nums">
                        {formatCurrency(f.valorTotal)}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {pagas}/{f.parcelas.length} · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        {isOpen ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        {isOpen ? "Recolher parcelas" : "Ver parcelas"}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border/60 bg-muted/20 px-3 py-2 space-y-1">
                      <ul className="space-y-1">
                        {f.parcelas.map((p) => (
                          <li
                            key={p.numero}
                            className="flex items-center gap-3 py-1.5 text-sm"
                          >
                            <Checkbox
                              id={`mp-${f.id}-${p.numero}`}
                              checked={p.pago}
                              onCheckedChange={() =>
                                markPaid(f.id, p.numero)
                              }
                              className="h-5 w-5"
                            />
                            <label
                              htmlFor={`mp-${f.id}-${p.numero}`}
                              className="cursor-pointer flex-1 flex items-center justify-between gap-2"
                            >
                              <span
                                className={`text-xs ${
                                  p.pago
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }`}
                              >
                                #{p.numero} ·{" "}
                                {format(parseISO(p.dataPagamento), "dd MMM yy", {
                                  locale: ptBR,
                                })}
                              </span>
                              <span className="tabular-nums font-medium text-sm">
                                {formatCurrency(p.valor)}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2 pt-2 border-t border-border/60">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEdit(f)}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive hover:text-destructive"
                          onClick={() => setToDelete(f)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
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
                    {fornecedores.length === 0
                      ? "Nenhum fornecedor ainda. Clique em \"Novo fornecedor\" para começar."
                      : "Nenhum resultado para os filtros aplicados."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f) => {
                  const pago = totalPago(f);
                  const pct =
                    f.valorTotal > 0 ? (pago / f.valorTotal) * 100 : 0;
                  const isOpen = expanded.has(f.id);
                  return (
                    <Fragment key={f.id}>
                      <TableRow className="group">
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => toggleExpand(f.id)}
                            aria-label={isOpen ? "Recolher parcelas" : "Expandir parcelas"}
                          >
                            {isOpen ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{f.nome}</div>
                          {f.contato && (
                            <div className="text-xs text-muted-foreground">
                              {f.contato}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {CATEGORIA_LABELS[f.categoria]}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatCurrency(f.valorTotal)}
                        </TableCell>
                        <TableCell className="min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-2" />
                            <span className="text-xs text-muted-foreground tabular-nums w-10">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {f.parcelas.filter((p) => p.pago).length}/
                            {f.parcelas.length} parcelas
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusStyle[f.status]}
                          >
                            {f.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" aria-label="Ações">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(f)}>
                                <Pencil className="w-4 h-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setToDelete(f)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="bg-muted/30">
                          <TableCell></TableCell>
                          <TableCell colSpan={6} className="py-3">
                            <ul className="space-y-1.5">
                              {f.parcelas.map((p) => (
                                <li
                                  key={p.numero}
                                  className="flex items-center gap-3 text-sm"
                                >
                                  <Checkbox
                                    id={`p-${f.id}-${p.numero}`}
                                    checked={p.pago}
                                    onCheckedChange={() =>
                                      markPaid(f.id, p.numero)
                                    }
                                  />
                                  <label
                                    htmlFor={`p-${f.id}-${p.numero}`}
                                    className="cursor-pointer flex-1 flex items-center justify-between gap-3"
                                  >
                                    <span className={p.pago ? "line-through text-muted-foreground" : ""}>
                                      Parcela {p.numero} —{" "}
                                      {format(parseISO(p.dataPagamento), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                    </span>
                                    <span className="tabular-nums font-medium">
                                      {formatCurrency(p.valor)}
                                    </span>
                                  </label>
                                </li>
                              ))}
                            </ul>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
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

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir <strong>{toDelete?.nome}</strong> e
              todas as suas parcelas. Você poderá desfazer logo em seguida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
