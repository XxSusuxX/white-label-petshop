"use client";

export default function PetsPage() {
  return (
    <div className="w-full">
      {/* Desktop View */}
      <main className="hidden md:block p-margin-desktop min-h-screen pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Page Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Pets</h2>
              <p className="text-body-base text-on-surface-variant"><span className="text-primary font-bold">12 pets</span> registrados no sistema</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="px-5 py-2 rounded-full bg-primary text-on-primary font-label-bold text-label-bold extruded-shadow transition-all">
                Todos
              </button>
              <button className="px-5 py-2 rounded-full bg-elevated-card text-on-surface-variant hover:text-on-surface font-label-bold text-label-bold border border-hairline-border transition-all">
                Em Atendimento
              </button>
              <button className="px-5 py-2 rounded-full bg-elevated-card text-on-surface-variant hover:text-on-surface font-label-bold text-label-bold border border-hairline-border transition-all">
                Disponível
              </button>
            </div>
          </div>

          {/* Pets Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
            {/* Pet Card 1 */}
            <div className="bg-elevated-card border border-hairline-border rounded-xl p-5 extruded-shadow group hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <button className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="flex items-start gap-4 mb-5">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-hairline-border group-hover:border-primary/30 transition-colors">
                  <img className="w-full h-full object-cover" alt="Maximus" src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-headline-md text-body-lg font-bold text-on-surface">Maximus</h3>
                    <span className="flex h-2 w-2 rounded-full bg-primary pulse-node"></span>
                  </div>
                  <p className="text-caption text-on-surface-variant">Golden Retriever</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Peso</p>
                  <p className="text-label-bold text-on-surface">32.5 kg</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Pelagem</p>
                  <p className="text-label-bold text-on-surface">Pelo Longo</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Cor</p>
                  <p className="text-label-bold text-on-surface">Dourado</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Tutor</p>
                  <p className="text-label-bold text-primary">Sarah Jenkins</p>
                </div>
              </div>
              <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-primary/10 hover:text-primary border border-hairline-border transition-all font-label-bold text-label-bold">
                Ver Detalhes
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            {/* Pet Card 2 */}
            <div className="bg-elevated-card border border-hairline-border rounded-xl p-5 extruded-shadow group hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <button className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="flex items-start gap-4 mb-5">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-hairline-border group-hover:border-primary/30 transition-colors">
                  <img className="w-full h-full object-cover" alt="Luna" src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-headline-md text-body-lg font-bold text-on-surface">Luna</h3>
                    <span className="flex h-2 w-2 rounded-full bg-warning-amber"></span>
                  </div>
                  <p className="text-caption text-on-surface-variant">Siberian Husky</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Peso</p>
                  <p className="text-label-bold text-on-surface">21.0 kg</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Pelagem</p>
                  <p className="text-label-bold text-on-surface">Dupla Camada</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Cor</p>
                  <p className="text-label-bold text-on-surface">Preto/Branco</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/60 font-bold">Tutor</p>
                  <p className="text-label-bold text-primary">James Wilson</p>
                </div>
              </div>
              <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-surface-container-high text-on-surface hover:bg-primary/10 hover:text-primary border border-hairline-border transition-all font-label-bold text-label-bold">
                Ver Detalhes
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            {/* Add New Pet Card (Dashed) */}
            <button className="bg-surface-container-low border-2 border-dashed border-hairline-border rounded-xl p-5 hover:border-primary/50 hover:bg-surface-container-high transition-all flex flex-col items-center justify-center gap-3 min-h-[280px]">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[32px]">add</span>
              </div>
              <p className="font-label-bold text-label-bold text-on-surface">Cadastrar Novo Pet</p>
              <p className="text-caption text-on-surface-variant text-center px-4">Adicione um novo pet ao ecossistema PetNexus</p>
            </button>
          </div>
        </div>
      </main>

      {/* Mobile View */}
      <main className="block md:hidden px-5 pb-32 pt-4">
        {/* Compact Metrics Horizontal Scroll */}
        <section className="overflow-x-auto no-scrollbar flex gap-3 pb-2">
          <div className="flex-shrink-0 bg-elevated-card border border-hairline-border rounded-xl p-4 min-w-[140px] extruded-shadow">
            <div className="flex items-center justify-between mb-1">
              <span className="material-symbols-outlined text-primary text-lg">pets</span>
              <span className="text-primary font-bold text-label-bold">+12%</span>
            </div>
            <div className="text-on-surface-variant font-label-muted text-caption">Total de Pets</div>
            <div className="text-on-surface font-headline-md text-headline-md">142</div>
          </div>
          <div className="flex-shrink-0 bg-elevated-card border border-hairline-border rounded-xl p-4 min-w-[140px] extruded-shadow">
            <div className="flex items-center justify-between mb-1">
              <span className="material-symbols-outlined text-tertiary text-lg">medical_services</span>
              <div className="w-2 h-2 rounded-full bg-tertiary pulse-node"></div>
            </div>
            <div className="text-on-surface-variant font-label-muted text-caption">Tarefas Urgentes</div>
            <div className="text-on-surface font-headline-md text-headline-md">8</div>
          </div>
        </section>

        {/* Section Title & Filter */}
        <section className="mt-8 flex justify-between items-end mb-4">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Registro de Pets</h1>
            <p className="font-body-base text-body-base text-on-surface-variant">Gerencie seus clientes ativos</p>
          </div>
          <button className="bg-surface-container-high p-2 rounded-lg border border-hairline-border text-on-surface-variant">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </section>

        {/* Vertical List of Pet Cards */}
        <div className="space-y-4">
          <article className="bg-elevated-card border border-hairline-border rounded-xl p-4 extruded-shadow flex gap-4 items-center">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-primary/20">
              <img className="w-full h-full object-cover" alt="Cooper" src="https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=300&q=80" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-headline-md text-headline-md text-primary truncate">Cooper</h3>
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full font-label-bold text-caption border border-primary/30">Ativo</span>
              </div>
              <p className="font-label-muted text-caption text-on-surface-variant">Golden Retriever</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
                <span className="font-label-muted text-caption text-on-surface truncate">Sarah Jenkins</span>
              </div>
            </div>
            <button className="bg-primary text-on-primary font-label-bold text-caption px-3 py-2 rounded-lg extruded-shadow active:scale-95 transition-transform emerald-glow-effect">
              Ver Perfil
            </button>
          </article>
        </div>

        <button className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center extruded-shadow emerald-glow-effect active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-[32px]">add</span>
        </button>
      </main>
    </div>
  );
}
