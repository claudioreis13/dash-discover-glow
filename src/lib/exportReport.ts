import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Fornecedor } from "@/types/wedding";
import { CATEGORIA_LABELS } from "@/types/wedding";
import { totalPago, totalPendente } from "@/store/useWeddingStore";

interface Dashboard {
  orcamentoTotal: number;
  valorComprometido: number;
  valorPago: number;
  valorPendente: number;
  saldoRestante: number;
  percentualUtilizado: number;
  contratosTotal: number;
}

interface CategoriaResumo {
  categoria: string;
  label: string;
  total: number;
  pago: number;
  pendente: number;
  percentual: number;
}

interface ReportInput {
  noivos: string;
  dataCasamento: string;
  dashboard: Dashboard;
  gastosPorCategoria: CategoriaResumo[];
  fornecedores: Fornecedor[];
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// ───────────── CSV ─────────────
function csvEscape(v: string | number): string {
  const s = String(v ?? "");
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportCSV(input: ReportInput): void {
  const rows: string[] = [];
  rows.push(
    ["Fornecedor", "Categoria", "Status", "Valor total", "Pago", "Pendente", "Vencimento", "Parcelas"]
      .map(csvEscape)
      .join(";"),
  );
  for (const f of input.fornecedores) {
    rows.push(
      [
        f.nome,
        CATEGORIA_LABELS[f.categoria] ?? f.categoria,
        f.status,
        f.valorTotal.toFixed(2).replace(".", ","),
        totalPago(f).toFixed(2).replace(".", ","),
        totalPendente(f).toFixed(2).replace(".", ","),
        f.vencimento ?? "",
        `${f.parcelas.filter((p) => p.pago).length}/${f.parcelas.length}`,
      ]
        .map(csvEscape)
        .join(";"),
    );
  }
  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `relatorio-casamento-${todayStr()}.csv`);
}

// ───────────── PDF ─────────────
export function exportPDF(input: ReportInput): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Relatório Financeiro do Casamento", margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  const subtitleParts: string[] = [];
  if (input.noivos) subtitleParts.push(input.noivos);
  if (input.dataCasamento) {
    try {
      subtitleParts.push(
        format(new Date(input.dataCasamento), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      );
    } catch {
      /* ignore */
    }
  }
  subtitleParts.push(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`);
  doc.text(subtitleParts.join("  ·  "), margin, y);
  y += 24;
  doc.setTextColor(0);

  // KPIs (2x3 grid)
  const d = input.dashboard;
  const kpis: Array<[string, string]> = [
    ["Orçamento total", brl(d.orcamentoTotal)],
    ["Total contratado", brl(d.valorComprometido)],
    ["Já pago", brl(d.valorPago)],
    ["A pagar", brl(d.valorPendente)],
    ["Saldo disponível", brl(d.saldoRestante)],
    ["% utilizado", `${d.percentualUtilizado.toFixed(1)}%`],
  ];

  const cols = 3;
  const gap = 8;
  const cardW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
  const cardH = 52;
  kpis.forEach(([label, value], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * (cardW + gap);
    const cy = y + row * (cardH + gap);
    doc.setDrawColor(220);
    doc.setFillColor(248, 248, 246);
    doc.roundedRect(x, cy, cardW, cardH, 6, 6, "FD");
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(label.toUpperCase(), x + 10, cy + 16);
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + 10, cy + 38);
    doc.setFont("helvetica", "normal");
  });
  y += Math.ceil(kpis.length / cols) * (cardH + gap) + 8;

  // Categorias
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Gastos por categoria", margin, y);
  y += 6;

  autoTable(doc, {
    startY: y + 4,
    margin: { left: margin, right: margin },
    head: [["Categoria", "Total", "Pago", "Pendente", "% do contratado"]],
    body: input.gastosPorCategoria.map((g) => [
      g.label,
      brl(g.total),
      brl(g.pago),
      brl(g.pendente),
      `${g.percentual.toFixed(1)}%`,
    ]),
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [60, 60, 60], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 248] },
  });
  // @ts-expect-error jsPDF-autotable adds lastAutoTable
  y = (doc.lastAutoTable?.finalY ?? y) + 18;

  // Fornecedores
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Fornecedores & contratos", margin, y);

  autoTable(doc, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [["Fornecedor", "Categoria", "Status", "Valor", "Pago", "Pendente", "Parcelas"]],
    body: input.fornecedores.map((f) => [
      f.nome,
      CATEGORIA_LABELS[f.categoria] ?? f.categoria,
      f.status,
      brl(f.valorTotal),
      brl(totalPago(f)),
      brl(totalPendente(f)),
      `${f.parcelas.filter((p) => p.pago).length}/${f.parcelas.length}`,
    ]),
    styles: { fontSize: 8.5, cellPadding: 4 },
    headStyles: { fillColor: [60, 60, 60], textColor: 255 },
    alternateRowStyles: { fillColor: [250, 250, 248] },
    columnStyles: {
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "center" },
    },
  });

  // Footer com numeração de páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageW - margin,
      doc.internal.pageSize.getHeight() - 18,
      { align: "right" },
    );
  }

  doc.save(`relatorio-casamento-${todayStr()}.pdf`);
}

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
