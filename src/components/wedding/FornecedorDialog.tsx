import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CATEGORIA_LABELS,
  PAGO_POR_LABELS,
  type CategoriaType,
  type Fornecedor,
  type PagoPorType,
  type Parcela,
  type PrioridadeType,
  type TipoLancamento,
} from "@/types/wedding";
import { useWeddingStore } from "@/store/useWeddingStore";
import { toast } from "sonner";
import { TipoSwitch } from "./fornecedor/TipoSwitch";
import { ParcelasEditor } from "./fornecedor/ParcelasEditor";
import { TagsInput } from "./fornecedor/TagsInput";
import { suggestCategoria } from "@/lib/suggestCategoria";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor?: Fornecedor | null;
  defaultCategoria?: CategoriaType;
  defaultTipo?: TipoLancamento;
}

const today = () => new Date().toISOString().split("T")[0];

function makeEmpty(
  categoria: CategoriaType = "festa",
  tipo: TipoLancamento = "fornecedor",
) {
  const isAvulso = tipo === "avulso";
  return {
    nome: "",
    categoria: isAvulso ? ("avulso" as CategoriaType) : categoria,
    valorTotal: 0,
    dataCont: today(),
    vencimento: today(),
    prioridade: "média" as PrioridadeType,
    observacoes: "",
    contato: "",
    email: "",
    tipo,
    pagoPor: undefined as PagoPorType | undefined,
    parcelas: [
      { numero: 1, valor: 0, dataPagamento: today(), pago: isAvulso },
    ] as Parcela[],
  };
}

export function FornecedorDialog({
  open,
  onOpenChange,
  fornecedor,
  defaultCategoria,
  defaultTipo,
}: Props) {
  const { addFornecedor, updateFornecedor } = useWeddingStore();
  const [form, setForm] = useState(() =>
    fornecedor
      ? { ...fornecedor, tipo: fornecedor.tipo ?? "fornecedor" }
      : makeEmpty(defaultCategoria, defaultTipo),
  );

  useEffect(() => {
    if (open) {
      setForm(
        fornecedor
          ? { ...fornecedor, tipo: fornecedor.tipo ?? "fornecedor" }
          : makeEmpty(defaultCategoria, defaultTipo),
      );
    }
  }, [open, fornecedor, defaultCategoria, defaultTipo]);

  const isAvulso = form.tipo === "avulso";

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const switchTipo = (tipo: TipoLancamento) => {
    if (tipo === form.tipo) return;
    setForm((f) => {
      if (tipo === "avulso") {
        return {
          ...f,
          tipo,
          categoria: "avulso" as CategoriaType,
          contato: "",
          email: "",
          parcelas: [
            { numero: 1, valor: f.valorTotal || 0, dataPagamento: today(), pago: true },
          ],
        };
      }
      return { ...f, tipo };
    });
  };

  const updateParcela = (idx: number, patch: Partial<Parcela>) => {
    setForm((f) => ({
      ...f,
      parcelas: f.parcelas.map((p, i) => (i === idx ? { ...p, ...patch } : p)),
    }));
  };

  const addParcela = () => {
    setForm((f) => ({
      ...f,
      parcelas: [
        ...f.parcelas,
        { numero: f.parcelas.length + 1, valor: 0, dataPagamento: today(), pago: false },
      ],
    }));
  };

  const removeParcela = (idx: number) => {
    setForm((f) => ({
      ...f,
      parcelas: f.parcelas.filter((_, i) => i !== idx).map((p, i) => ({ ...p, numero: i + 1 })),
    }));
  };

  const somaParcelas = form.parcelas.reduce((a, p) => a + (Number(p.valor) || 0), 0);
  const sincronizarValor = () => setField("valorTotal", somaParcelas);

  const handleSave = () => {
    if (!form.nome.trim()) {
      toast.error(
        isAvulso ? "Informe a descrição da compra" : "Informe o nome do fornecedor",
      );
      return;
    }
    const parcelas = isAvulso
      ? [
          {
            numero: 1,
            valor: Number(form.valorTotal) || 0,
            dataPagamento: form.parcelas[0]?.dataPagamento ?? today(),
            pago: form.parcelas[0]?.pago ?? true,
          },
        ]
      : form.parcelas.map((p) => ({ ...p, valor: Number(p.valor) || 0 }));

    const payload = {
      nome: form.nome.trim(),
      categoria: form.categoria,
      valorTotal: Number(form.valorTotal) || 0,
      dataCont: form.dataCont,
      vencimento: isAvulso ? parcelas[0].dataPagamento : form.vencimento,
      prioridade: form.prioridade,
      observacoes: form.observacoes,
      contato: isAvulso ? "" : form.contato,
      email: isAvulso ? "" : form.email,
      tipo: form.tipo,
      pagoPor: form.pagoPor,
      parcelas,
    };
    if (fornecedor) {
      updateFornecedor(fornecedor.id, payload);
      toast.success(isAvulso ? "Compra atualizada" : "Fornecedor atualizado");
    } else {
      addFornecedor({ ...payload, status: "pendente" });
      toast.success(isAvulso ? "Compra adicionada" : "Fornecedor adicionado");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fornecedor
              ? isAvulso
                ? "Editar compra"
                : "Editar fornecedor"
              : isAvulso
                ? "Nova compra avulsa"
                : "Novo fornecedor"}
          </DialogTitle>
          <DialogDescription>
            {isAvulso
              ? "Registre uma compra única ou online sem contrato — ideal para itens pequenos."
              : "Cadastre o contrato, parcelas e datas de vencimento."}
          </DialogDescription>
        </DialogHeader>

        {!fornecedor && <TipoSwitch value={form.tipo} onChange={switchTipo} />}

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="nome">
                {isAvulso ? "Descrição da compra" : "Nome do fornecedor"}
              </Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setField("nome", e.target.value)}
                placeholder={
                  isAvulso ? "Ex: Sapato da noiva (loja online)" : "Ex: Buffet do João"
                }
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setField("categoria", v as CategoriaType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!isAvulso && (
              <div>
                <Label>Prioridade</Label>
                <Select
                  value={form.prioridade}
                  onValueChange={(v) => setField("prioridade", v as PrioridadeType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="média">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="valor">Valor {isAvulso ? "" : "total "}(R$)</Label>
              <div className="flex gap-2">
                <Input
                  id="valor"
                  type="number"
                  value={form.valorTotal || ""}
                  placeholder="0"
                  onChange={(e) => setField("valorTotal", Number(e.target.value))}
                />
                {!isAvulso && somaParcelas !== form.valorTotal && somaParcelas > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={sincronizarValor}
                    title={`Igualar à soma das parcelas (${somaParcelas})`}
                  >
                    = {somaParcelas}
                  </Button>
                )}
              </div>
            </div>
            {isAvulso ? (
              <>
                <div>
                  <Label htmlFor="dataCompra">Data da compra</Label>
                  <Input
                    id="dataCompra"
                    type="date"
                    value={form.parcelas[0]?.dataPagamento ?? today()}
                    onChange={(e) => updateParcela(0, { dataPagamento: e.target.value })}
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                  <Checkbox
                    id="pagoAvulso"
                    checked={form.parcelas[0]?.pago ?? true}
                    onCheckedChange={(v) => updateParcela(0, { pago: !!v })}
                  />
                  <Label htmlFor="pagoAvulso" className="text-sm cursor-pointer">
                    Já paguei esta compra
                  </Label>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="venc">Vencimento final</Label>
                  <Input
                    id="venc"
                    type="date"
                    value={form.vencimento}
                    onChange={(e) => setField("vencimento", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="contato">Contato</Label>
                  <Input
                    id="contato"
                    value={form.contato}
                    onChange={(e) => setField("contato", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="col-span-2">
              <Label>Pago por</Label>
              <Select
                value={form.pagoPor ?? "__none"}
                onValueChange={(v) =>
                  setField("pagoPor", v === "__none" ? undefined : (v as PagoPorType))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Não especificado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Não especificado</SelectItem>
                  {Object.entries(PAGO_POR_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={form.observacoes}
                onChange={(e) => setField("observacoes", e.target.value)}
                placeholder={
                  isAvulso ? "Link do produto, loja, código do pedido..." : ""
                }
              />
            </div>
          </div>

          {!isAvulso && (
            <ParcelasEditor
              parcelas={form.parcelas}
              somaParcelas={somaParcelas}
              onUpdate={updateParcela}
              onAdd={addParcela}
              onRemove={removeParcela}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {fornecedor
              ? "Salvar alterações"
              : isAvulso
                ? "Adicionar compra"
                : "Adicionar fornecedor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
