export type CategoriaType =
  | "cerimonia"
  | "festa"
  | "visual"
  | "foto-video"
  | "convites"
  | "musica"
  | "lua-de-mel"
  | "logistica"
  | "extras";

export type StatusType = "pago" | "parcial" | "pendente" | "atrasado";
export type PrioridadeType = "alta" | "média" | "baixa";

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
  extras: "Extras",
};
