import { useMemo, useState } from "react";
import type { CategoriaType, Fornecedor, StatusType } from "@/types/wedding";

export type SortBy = "recent" | "nome" | "valor-desc" | "valor-asc" | "vencimento";

export function useFornecedorFilters(fornecedores: Fornecedor[]) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<CategoriaType | "todos">("todos");
  const [filterStatus, setFilterStatus] = useState<StatusType | "todos">("todos");
  const [sortBy, setSortBy] = useState<SortBy>("recent");

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
      if (search && !f.nome.toLowerCase().includes(search.toLowerCase())) return false;
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
        break;
    }
    return sorted;
  }, [fornecedores, search, filterCat, filterStatus, sortBy]);

  return {
    search,
    setSearch,
    filterCat,
    setFilterCat,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    hasActiveFilters,
    clearFilters,
    filtered,
  };
}
