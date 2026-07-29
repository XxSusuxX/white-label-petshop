"use client";

export default function AgendaPage() {
  return (
    <div className="w-full">
      {/* Desktop Workspace */}
      <main className="hidden md:flex flex-col lg:flex-row gap-6 p-8 pb-8">
        {/* Left: Monthly Grid */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="font-headline-lg text-headline-lg">Julho 2026</h2>
              <div className="flex gap-1">
                <button className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors material-symbols-outlined text-on-surface-variant">chevron_left</button>
                <button className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors material-symbols-outlined text-on-surface-variant">chevron_right</button>
              </div>
            </div>
            <div className="flex bg-surface-container-high rounded-lg p-1 border border-hairline-border">
              <button className="px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-md font-label-bold text-label-bold">Mês</button>
              <button className="px-4 py-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-label-bold text-label-bold">Semana</button>
              <button className="px-4 py-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-label-bold text-label-bold">Dia</button>
            </div>
          </div>

          {/* Calendar Container */}
          <div className="bg-elevated-card border border-hairline-border rounded-xl overflow-hidden flex flex-col">
            <div className="grid grid-cols-7 border-b border-hairline-border bg-surface-container-low">
              <div className="py-3 text-center text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Dom</div>
              <div className="py-3 text-center text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Seg</div>
              <div className="py-3 text-center text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Ter</div>
              <div className="py-3 text-center text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Qua</div>
              <div className="py-3 text-center text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Qui</div>
              <div className="py-3 text-center text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Sex</div>
              <div className="py-3 text-center text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Sáb</div>
            </div>
            <div className="grid grid-cols-7 flex-1 min-h-[500px]">
              <div className="p-3 border-r border-b border-hairline-border bg-surface/30 opacity-30 text-on-surface-variant font-label-bold">31</div>
              <div className="p-3 border-r border-b border-hairline-border min-h-[90px] hover:bg-surface-container-highest transition-colors cursor-pointer group relative">
                <div className="flex justify-between items-start">
                  <span className="font-label-bold text-body-base text-on-surface">1</span>
                </div>
              </div>
              <div className="p-3 border-r border-b border-hairline-border min-h-[90px] hover:bg-surface-container-highest transition-colors cursor-pointer group relative">
                <div className="flex justify-between items-start">
                  <span className="font-label-bold text-body-base text-on-surface">2</span>
                </div>
              </div>
              <div className="p-3 border-r border-b border-hairline-border min-h-[90px] hover:bg-surface-container-highest transition-colors cursor-pointer group relative">
                <div className="flex justify-between items-start">
                  <span className="font-label-bold text-body-base text-on-surface">3</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-warning-amber"></div>
                </div>
                <div className="mt-2 hidden md:block text-[10px] text-on-surface-variant font-medium">2 Agend.</div>
              </div>
              <div className="p-3 border-r border-b border-hairline-border min-h-[90px] hover:bg-surface-container-highest transition-colors cursor-pointer group relative bg-primary/5">
                <div className="flex justify-between items-start">
                  <span className="font-label-bold text-body-base text-primary">15</span>
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(78,222,163,0.6)]"></span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-warning-amber"></div>
                </div>
                <div className="mt-2 hidden md:block text-[10px] text-on-surface-variant font-medium">2 Agend.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Daily Schedule Sidebar */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          <div className="bg-elevated-card border border-hairline-border rounded-xl p-5 flex flex-col gap-6 extruded-shadow h-full">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-headline-md text-headline-md">Quarta-feira</h3>
                <p className="text-on-surface-variant">15 de Julho, 2026</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">event</span>
              </div>
            </div>
            <div className="relative flex flex-col gap-0">
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-hairline-border"></div>
              <div className="relative pl-12 pb-8">
                <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full bg-deep-surface border-4 border-primary ring-4 ring-deep-surface"></div>
                <div className="flex flex-col gap-2">
                  <span className="text-caption font-label-bold text-primary uppercase">09:00 — 10:30</span>
                  <div className="bg-surface-container rounded-lg p-3 border border-hairline-border hover:border-primary/50 transition-colors cursor-pointer group">
                    <h4 className="font-label-bold text-body-base">Banho + Tosa: Bella (Golden)</h4>
                    <p className="text-caption text-on-surface-variant mt-1">Cliente: Maria Jenkins • Serviço Completo</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] rounded uppercase font-bold tracking-tighter flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-primary animate-pulse"></span> Confirmado
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Workspace */}
      <main className="block md:hidden pb-32">
        <section className="bg-surface-container pt-4 pb-6 px-4 border-b border-hairline-border">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile">Agenda</h1>
              <p className="font-label-muted text-label-muted text-on-surface-variant">Julho 2026</p>
            </div>
            <button className="bg-primary-container text-on-primary-container px-4 py-2 rounded-xl font-label-bold text-label-bold extruded-shadow flex items-center gap-2 active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Novo
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
            <button className="flex flex-col items-center justify-center min-w-[64px] h-24 rounded-2xl bg-primary text-on-primary extruded-shadow emerald-glow-effect active:scale-95 transition-all">
              <span className="font-label-bold text-label-bold uppercase tracking-wider">qua</span>
              <span className="font-headline-lg-mobile text-headline-lg-mobile leading-none mt-1">25</span>
              <div className="w-1.5 h-1.5 bg-on-primary rounded-full mt-1"></div>
            </button>
          </div>
        </section>

        <section className="mt-6 px-4 space-y-8 relative">
          <div className="absolute left-[51px] top-4 bottom-4 w-0.5 bg-hairline-border"></div>
          <div className="flex gap-6 relative">
            <div className="w-10 pt-2">
              <p className="font-label-bold text-label-bold text-on-surface-variant text-right">09:00</p>
              <p className="font-caption text-caption text-outline text-right uppercase">AM</p>
            </div>
            <div className="absolute left-[41px] top-3 z-10 w-5 h-5 rounded-full bg-surface border-4 border-primary ring-4 ring-surface"></div>
            <div className="flex-1 bg-elevated-card rounded-2xl p-5 border border-hairline-border extruded-shadow">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-caption text-caption mb-2">
                CONFIRMADO
              </span>
              <h3 className="font-body-lg text-body-lg text-on-surface">Banho + Tosa: Luna (Golden)</h3>
            </div>
          </div>
        </section>

        <button className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-on-primary rounded-2xl flex items-center justify-center extruded-shadow emerald-glow-effect z-40">
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      </main>
    </div>
  );
}
