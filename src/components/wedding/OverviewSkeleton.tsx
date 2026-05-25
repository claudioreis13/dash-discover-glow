import { Card } from "@/components/ui/card";

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-muted/60 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-card/80 to-transparent" />
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Carregando dashboard">
      {/* Hero band */}
      <Card variant="hero" className="p-0 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-3">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-9 w-2/3 max-w-md" />
          <Shimmer className="h-3 w-40" />
          <div className="pt-2">
            <Shimmer className="h-6 w-32 rounded-full" />
          </div>
        </div>
      </Card>

      {/* Section: Finanças */}
      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Shimmer className="h-2.5 w-16" />
            <Shimmer className="h-5 w-48" />
          </div>
          <Shimmer className="h-3 w-20" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} variant="stat" className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Shimmer className="h-3 w-20" />
                <Shimmer className="h-7 w-7 rounded-full" />
              </div>
              <Shimmer className="h-7 w-28" />
              <Shimmer className="h-2.5 w-24" />
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-baseline justify-between mb-4">
              <Shimmer className="h-4 w-44" />
              <Shimmer className="h-3 w-24" />
            </div>
            <div className="relative h-72 flex items-center justify-center">
              <Shimmer className="h-52 w-52 rounded-full" />
            </div>
          </Card>
          <Card className="p-6 space-y-4">
            <Shimmer className="h-4 w-36" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Shimmer className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Shimmer className="h-3 w-3/4" />
                  <Shimmer className="h-2.5 w-1/2" />
                </div>
                <Shimmer className="h-4 w-14" />
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* Section: Cronograma */}
      <section className="space-y-5">
        <div className="space-y-2">
          <Shimmer className="h-2.5 w-20" />
          <Shimmer className="h-5 w-52" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 space-y-3">
            <Shimmer className="h-4 w-40" />
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }).map((_, i) => (
                <Shimmer key={i} className="aspect-square" />
              ))}
            </div>
          </Card>
          <Card className="p-6 space-y-3">
            <Shimmer className="h-4 w-32" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Shimmer className="h-6 w-6 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Shimmer className="h-3 w-full" />
                  <Shimmer className="h-2.5 w-1/3" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* Section: Categorias */}
      <section className="space-y-5">
        <div className="space-y-2">
          <Shimmer className="h-2.5 w-20" />
          <Shimmer className="h-5 w-56" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} variant="soft" className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <Shimmer className="h-3 w-24" />
                <Shimmer className="h-4 w-10 rounded" />
              </div>
              <Shimmer className="h-5 w-32" />
              <Shimmer className="h-2.5 w-24" />
              <Shimmer className="h-1.5 w-full rounded-full" />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
