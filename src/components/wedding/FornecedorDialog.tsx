import { useState } from "react";
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
import { Trash2, Plus } from "lucide-react";
import {
  CATEGORIA_LABELS,
  type CategoriaType,
  type Fornecedor,
  type Parcela,
  type PrioridadeType,
} from "@/types/wedding";
import { useWeddingStore } from "@/store/useWeddingStore";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor?: Fornecedor | null;
}

const emptyForm = {
  nome: "",
  categoria: "festa" as CategoriaType,
  valorTotal: 0,
  dataCont: new Date().toISOString().split("T")[0],
  vencimento: new Date().toISOString().split("T")[0],
  prioridade: "média" as PrioridadeType,
  observacoes: "",
  contato: "",
  email: "",
  parcelas: [
    { numero: 1, valor: 0, dataPagamento: new Date().toISOString().split("T")[0], pago: false },
  ] as Parcela[],
};

export function FornecedorDialog({ open, onOpenChange, fornecedor }: Props) {
  const { addFornecedor, updateFornecedor } = useWeddingStore();
  const [form, setForm] = useState(() =>
    fornecedor ? { ...fornecedor } : emptyForm,
  );

  // Reset when prop changes
  const [lastId, setLastId] = useState(fornecedor?.id);
  if (fornecedor?.id !== lastId) {
    setLastId(fornecedor?.id);
    setForm(fornecedor ? { ...fornecedor } : emptyForm);
  }

  const setField = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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
        {
          numero: f.parcelas.length + 1,
          valor: 0,
          dataPagamento: new Date().toISOString().split("T")[0],
          pago: false,
        },
      ],
    }));
  };

  const removeParcela = (idx: number) => {
    setForm((f) => ({
      ...f,
      parcelas: f.parcelas
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, numero: i + 1 })),
    }));
  };

  const handleSave = () => {
    if (!form.nome.trim()) return;
    const payload = {
      nome: form.nome.trim(),
      categoria: form.categoria,
      valorTotal: Number(form.valorTotal) || 0,
      dataCont: form.dataCont,
      vencimento: form.vencimento,
      prioridade: form.prioridade,
      observacoes: form.observacoes,
      contato: form.contato,
      email: form.email,
      parcelas: form.parcelas.map((p) => ({
        ...p,
        valor: Number(p.valor) || 0,
      })),
    };
    if (fornecedor) {
      updateFornecedor(fornecedor.id, payload);
    } else {
      addFornecedor({ ...payload, status: "pendente" });
    }
    onOpenChange(false);
    setForm(emptyForm);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fornecedor ? "Editar fornecedor" : "Novo fornecedor"}
          </DialogTitle>
          <DialogDescription>
            Cadastre o contrato, parcelas e datas de vencimento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="nome">Nome do fornecedor</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setField("nome", e.target.value)}
                placeholder="Ex: Buffet do João"
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
            <div>
              <Label>Prioridade</Label>
              <Select
                value={form.prioridade}
                onValueChange={(v) =>
                  setField("prioridade", v as PrioridadeType)
                }
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
            <div>
              <Label htmlFor="valor">Valor total (R$)</Label>
              <Input
                id="valor"
                type="number"
                value={form.valorTotal}
                onChange={(e) =>
                  setField("valorTotal", Number(e.target.value))
                }
              />
            </div>
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
            <div className="col-span-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={form.observacoes}
                onChange={(e) => setField("observacoes", e.target.value)}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Parcelas</Label>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={addParcela}
              >
                <Plus className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {form.parcelas.map((p, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-2 items-center"
                >
                  <span className="text-xs text-muted-foreground w-6">
                    #{p.numero}
                  </span>
                  <Input
                    type="number"
                    placeholder="Valor"
                    value={p.valor}
                    onChange={(e) =>
                      updateParcela(idx, { valor: Number(e.target.value) })
                    }
                  />
                  <Input
                    type="date"
                    value={p.dataPagamento}
                    onChange={(e) =>
                      updateParcela(idx, { dataPagamento: e.target.value })
                    }
                  />
                  <label className="flex items-center gap-1 text-xs">
                    <Checkbox
                      checked={p.pago}
                      onCheckedChange={(v) =>
                        updateParcela(idx, { pago: !!v })
                      }
                    />
                    pago
                  </label>
                  <Button
                    size="icon"
                    variant="ghost"
                    type="button"
                    onClick={() => removeParcela(idx)}
                    disabled={form.parcelas.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {fornecedor ? "Salvar alterações" : "Adicionar fornecedor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
