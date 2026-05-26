export type CategoriaType =
  | "cerimonia"
  | "festa"
  | "visual"
  | "foto-video"
  | "convites"
  | "musica"
  | "lua-de-mel"
  | "logistica"
  | "avulso"
  | "extras";

export type StatusType = "pago" | "parcial" | "pendente" | "atrasado";
export type PrioridadeType = "alta" | "média" | "baixa";
export type TipoLancamento = "fornecedor" | "avulso";

export type PagoPorType =
  | "noivo"
  | "noiva"
  | "pais_noivo"
  | "pais_noiva"
  | "compartilhado";

export const PAGO_POR_LABELS: Record<PagoPorType, string> = {
  noivo: "Noivo",
  noiva: "Noiva",
  pais_noivo: "Pais do noivo",
  pais_noiva: "Pais da noiva",
  compartilhado: "Compartilhado",
};

export interface Parcela {
  numero: number;
  valor: number;
  dataPagamento: string;
  pago: boolean;
}

export interface Fornecedor {
  id: string;
  nome: string;
  categoria: CategoriaType;
  valorTotal: number;
  dataCont: string;
  vencimento: string;
  parcelas: Parcela[];
  status: StatusType;
  prioridade: PrioridadeType;
  observacoes: string;
  contato?: string;
  email?: string;
  tipo?: TipoLancamento;
  pagoPor?: PagoPorType;
}

export const CATEGORIA_LABELS: Record<CategoriaType, string> = {
  cerimonia: "Cerimônia",
  festa: "Festa & Buffet",
  visual: "Visual & Beleza",
  "foto-video": "Foto & Vídeo",
  convites: "Convites",
  musica: "Música",
  "lua-de-mel": "Lua de Mel",
  logistica: "Logística",
  avulso: "Avulso / Compra única",
  extras: "Extras",
};
