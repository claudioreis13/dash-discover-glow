import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { TAG_SUGESTOES } from "@/types/wedding";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

function normalize(t: string) {
  return t.trim().toLowerCase().slice(0, 30);
}

export function TagsInput({ value, onChange }: Props) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const t = normalize(raw);
    if (!t) return;
    if (value.includes(t)) return;
    if (value.length >= 10) return;
    onChange([...value, t]);
    setDraft("");
  };

  const remove = (t: string) => onChange(value.filter((x) => x !== t));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      remove(value[value.length - 1]);
    }
  };

  const sugestoes = TAG_SUGESTOES.filter((t) => !value.includes(t));

  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 min-h-9">
        {value.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1 pr-1">
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="hover:text-destructive"
              aria-label={`Remover tag ${t}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => draft && add(draft)}
          placeholder={value.length ? "" : "essencial, cortável..."}
          className="flex-1 min-w-[120px] h-7 border-0 px-1 shadow-none focus-visible:ring-0"
        />
      </div>
      {sugestoes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {sugestoes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => add(t)}
              className="text-xs px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground hover:bg-muted transition"
            >
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
