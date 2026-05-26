import type { CategoriaType } from "@/types/wedding";

/**
 * Sugere uma categoria a partir do nome do fornecedor/descrição.
 * Heurística simples baseada em palavras-chave em PT-BR.
 * Retorna `null` quando nada é reconhecido (mantém escolha do usuário).
 */
const RULES: Array<{ cat: CategoriaType; words: string[] }> = [
  { cat: "cerimonia", words: ["igreja", "celebrante", "padre", "pastor", "juiz", "cartório", "cartorio", "cerimon", "altar"] },
  { cat: "festa", words: ["buffet", "bufê", "bufe", "salão", "salao", "espaço", "espaco", "open bar", "bar", "bebida", "drink", "bolo", "doce", "doces", "garçom", "garcom", "chácara", "chacara", "sítio", "sitio"] },
  { cat: "visual", words: ["cabelo", "maquiagem", "make", "noiva", "beleza", "spa", "manicure", "unha", "barba", "estética", "estetica"] },
  { cat: "foto-video", words: ["foto", "fotograf", "fotógraf", "fotografo", "vídeo", "video", "filmagem", "filmag", "drone", "cinegrafista", "álbum", "album"] },
  { cat: "convites", words: ["convite", "papelaria", "save the date", "lembrancinha", "lembranca", "lembrança"] },
  { cat: "musica", words: ["dj", "banda", "música", "musica", "som", "sonorização", "sonorizacao", "violino", "playlist", "cerimonial musical"] },
  { cat: "lua-de-mel", words: ["lua de mel", "viagem", "hotel", "resort", "passagem", "cruzeiro", "airbnb"] },
  { cat: "logistica", words: ["transporte", "carro", "ônibus", "onibus", "van", "shuttle", "uber", "valet", "estacionamento", "hospedagem", "translado"] },
  { cat: "extras", words: ["decoração", "decoracao", "flor", "florista", "iluminação", "iluminacao", "mobiliário", "mobiliario", "aluguel"] },
];

export function suggestCategoria(name: string): CategoriaType | null {
  const n = name.toLowerCase().trim();
  if (n.length < 3) return null;
  for (const { cat, words } of RULES) {
    if (words.some((w) => n.includes(w))) return cat;
  }
  return null;
}
