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
} from "lucide-react";
import {
  useWeddingStore,
  totalPago,
} from "@/store/useWeddingStore";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Fornecedor | null>(null);
  const [dialogTipo, setDialogTipo] = useState<TipoLancamento>("fornecedor");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<Fornecedor | null>(null);

  const filtered = useMemo(() => {
    return fornecedores.filter((f) => {
      if (filterCat !== "todos" && f.categoria !== filterCat) return false;
      if (filterStatus !== "todos" && f.status !== filterStatus) return false;
      if (search && !f.nome.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [fornecedores, search, filterCat, filterStatus]);

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
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-4">
          <div className="flex flex-1 gap-2 items-center flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filterCat}
              onValueChange={(v) => setFilterCat(v as CategoriaType | "todos")}
            >
              <SelectTrigger className="w-[160px]">
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
              <SelectTrigger className="w-[140px]">
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => openNew("avulso")}>
              <ShoppingBag className="w-4 h-4 mr-1" /> Compra avulsa
            </Button>
            <Button onClick={() => openNew("fornecedor")}>
              <Plus className="w-4 h-4 mr-1" /> Novo fornecedor
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 overflow-hidden">
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
                                    onCheckedChange={() => {
                                      toggleParcelaPaga(f.id, p.numero);
                                      toast.success(
                                        p.pago
                                          ? `Parcela ${p.numero} desmarcada`
                                          : `Parcela ${p.numero} paga ✓`,
                                      );
                                    }}
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
