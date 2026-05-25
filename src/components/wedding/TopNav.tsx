import { motion } from "motion/react";
import { Home, LayoutDashboard, Users, FileBarChart, type LucideIcon } from "lucide-react";

export type TabValue = "inicio" | "overview" | "fornecedores" | "relatorios";

const ITEMS: { value: TabValue; label: string; Icon: LucideIcon }[] = [
  { value: "inicio", label: "Início", Icon: Home },
  { value: "overview", label: "Visão Geral", Icon: LayoutDashboard },
  { value: "fornecedores", label: "Fornecedores", Icon: Users },
  { value: "relatorios", label: "Relatórios", Icon: FileBarChart },
];

interface TopNavProps {
  value: TabValue;
  onChange: (v: TabValue) => void;
}

export function TopNav({ value, onChange }: TopNavProps) {
  return (
    <div className="relative -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <nav
        role="tablist"
        aria-label="Navegação principal"
        className="relative inline-flex w-max sm:w-auto items-center gap-0.5 rounded-full border border-sage/30 bg-card/70 p-1 shadow-[0_4px_20px_-8px_color-mix(in_oklab,var(--sage)_40%,transparent)] backdrop-blur"
      >
        {ITEMS.map(({ value: v, label, Icon }) => {
          const isActive = value === v;
          return (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(v)}
              className={`group relative flex items-center justify-center gap-1.5 rounded-full px-3.5 sm:px-4 py-2 sm:py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap min-h-[40px] sm:min-h-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                isActive ? "text-sage-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="menu-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-sage to-sage/85 shadow-[0_6px_18px_-6px_color-mix(in_oklab,var(--sage)_70%,transparent)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon
                className={`relative z-10 w-4 h-4 transition-transform duration-200 ${
                  isActive ? "" : "group-hover:scale-110"
                }`}
                strokeWidth={isActive ? 2.2 : 1.75}
              />
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
