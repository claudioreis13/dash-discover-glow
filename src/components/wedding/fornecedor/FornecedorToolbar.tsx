import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, ArrowUpDown, Plus, ShoppingBag } from "lucide-react";
import { CATEGORIA_LABELS, type CategoriaType, type StatusType, type TipoLancamento } from "@/types/wedding";
import type { SortBy } from "./useFornecedorFilters";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  filterCat: CategoriaType | "todos";
  onFilterCatChange: (v: CategoriaType | "todos") => void;
  filterStatus: StatusType | "todos";
  onFilterStatusChange: (v: StatusType | "todos") => void;
  filterTag: string;
  onFilterTagChange: (v: string) => void;
  availableTags: string[];
  sortBy: SortBy;
  onSortByChange: (v: SortBy) => void;
  hasActiveFilters: boolean;
  onClear: () => void;
  onNew: (tipo: TipoLancamento) => void;
}

export function FornecedorToolbar({
  search,
  onSearchChange,
  filterCat,
  onFilterCatChange,
  filterStatus,
  onFilterStatusChange,
  filterTag,
  onFilterTagChange,
  availableTags,
  sortBy,
  onSortByChange,
  hasActiveFilters,
  onClear,
  onNew,
}: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between mb-4">
      <div className="flex flex-1 gap-2 items-stretch flex-wrap">
        <div className="relative flex-1 min-w-[140px] sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar fornecedor..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <Select value={filterCat} onValueChange={(v) => onFilterCatChange(v as CategoriaType | "todos")}>
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
          <Select value={filterStatus} onValueChange={(v) => onFilterStatusChange(v as StatusType | "todos")}>
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
          <Select value={sortBy} onValueChange={(v) => onSortByChange(v as SortBy)}>
            <SelectTrigger className="flex-1 sm:w-[170px]">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="nome">Nome (A–Z)</SelectItem>
              <SelectItem value="valor-desc">Maior valor</SelectItem>
              <SelectItem value="valor-asc">Menor valor</SelectItem>
              <SelectItem value="vencimento">Vencimento próximo</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-9 px-3 text-muted-foreground hover:text-destructive"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 md:flex gap-2">
        <Button variant="outline" onClick={() => onNew("avulso")} className="w-full md:w-auto">
          <ShoppingBag className="w-4 h-4 mr-1" />
          <span className="truncate">Avulsa</span>
        </Button>
        <Button onClick={() => onNew("fornecedor")} className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-1" /> Novo
        </Button>
      </div>
    </div>
  );
}
