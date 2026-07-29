"use client";

export default function ClientesPage() {
  return (
    <div className="w-full">
      {/* Desktop Layout */}
      <main className="hidden md:block p-margin-desktop space-y-8">
        {/* Page Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Clientes</h1>
            <p className="text-on-surface-variant font-label-muted">5 clientes cadastrados no sistema</p>
          </div>
          <button className="bg-primary text-on-primary font-label-bold text-label-bold px-6 py-3 rounded-lg flex items-center gap-2 extruded-shadow hover:brightness-110 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-xl">person_add</span>
            Cadastrar cliente
          </button>
        </div>

        {/* Bento Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-elevated-card border border-hairline-border p-5 rounded-xl extruded-shadow group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary bg-emerald-glow/20 p-2 rounded-lg">group</span>
              <span className="text-caption text-primary">+12%</span>
            </div>
            <div className="text-headline-md font-headline-md text-on-surface">5</div>
            <div className="text-caption font-label-muted text-on-surface-variant">Total de clientes</div>
          </div>
          <div className="bg-elevated-card border border-hairline-border p-5 rounded-xl extruded-shadow group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary bg-emerald-glow/20 p-2 rounded-lg">person_check</span>
              <span className="text-caption text-primary">80%</span>
            </div>
            <div className="text-headline-md font-headline-md text-on-surface">4</div>
            <div className="text-caption font-label-muted text-on-surface-variant">Clientes ativos</div>
          </div>
          <div className="bg-elevated-card border border-hairline-border p-5 rounded-xl extruded-shadow group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary bg-emerald-glow/20 p-2 rounded-lg">pets</span>
              <span className="text-caption text-primary">+5</span>
            </div>
            <div className="text-headline-md font-headline-md text-on-surface">7</div>
            <div className="text-caption font-label-muted text-on-surface-variant">Pets cadastrados</div>
          </div>
          <div className="bg-elevated-card border border-hairline-border p-5 rounded-xl extruded-shadow group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <span className="material-symbols-outlined text-primary bg-emerald-glow/20 p-2 rounded-lg">event_available</span>
              <span className="text-caption text-primary">Recorde</span>
            </div>
            <div className="text-headline-md font-headline-md text-on-surface">48</div>
            <div className="text-caption font-label-muted text-on-surface-variant">Total de visitas</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-surface-container border border-hairline-border p-4 rounded-xl flex flex-wrap items-center gap-4">
          <div className="flex-1 relative min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input className="w-full bg-matte-canvas border-hairline-border border rounded-lg pl-10 pr-4 py-2.5 text-label-muted focus:ring-1 focus:ring-primary focus:border-primary outline-none text-on-surface" placeholder="Buscar por nome, email, telefone ou pet..." type="text" />
          </div>
          <div className="flex items-center gap-2">
            <select className="bg-matte-canvas border border-hairline-border rounded-lg px-4 py-2.5 text-label-muted text-on-surface-variant focus:ring-1 focus:ring-primary outline-none">
              <option>Todos os status</option>
              <option>Ativo</option>
              <option>Inativo</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-matte-canvas border border-hairline-border rounded-lg text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              <span className="font-label-muted">Filtros</span>
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-elevated-card border border-hairline-border rounded-xl extruded-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-hairline-border bg-surface-container-low">
                  <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Pets</th>
                  <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">Última Visita</th>
                  <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-caption font-label-bold text-on-surface-variant uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-border">
                <tr className="hover:bg-surface-container-high/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-glow/20 flex items-center justify-center text-primary font-bold">CS</div>
                      <div>
                        <div className="font-label-bold text-on-surface">Carlos Silva</div>
                        <div className="text-caption text-on-surface-variant">12 visitas realizadas</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">call</span>
                        <span className="text-label-muted">(11) 99999-1234</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant/70">
                        <span className="material-symbols-outlined text-sm">mail</span>
                        <span className="text-caption">carlos@email.com</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-surface-container-highest border border-hairline-border rounded text-[11px] font-label-bold"><span className="material-symbols-outlined text-[14px] text-primary">pets</span> Thor</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      <span className="text-label-muted">14/01/2024</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-label-bold uppercase">Ativo</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-high/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-fixed-dim font-bold">AB</div>
                      <div>
                        <div className="font-label-bold text-on-surface">Ana Beatriz</div>
                        <div className="text-caption text-on-surface-variant">8 visitas realizadas</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">call</span>
                        <span className="text-label-muted">(11) 98888-5678</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant/70">
                        <span className="material-symbols-outlined text-sm">mail</span>
                        <span className="text-caption">ana@email.com</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-surface-container-highest border border-hairline-border rounded text-[11px] font-label-bold"><span className="material-symbols-outlined text-[14px] text-primary">pets</span> Luna</span>
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-surface-container-highest border border-hairline-border rounded text-[11px] font-label-bold"><span className="material-symbols-outlined text-[14px] text-primary">pets</span> Mimi</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      <span className="text-label-muted">13/01/2024</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-label-bold uppercase">Ativo</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-high/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary font-bold">RN</div>
                      <div>
                        <div className="font-label-bold text-on-surface">Roberto Nunes</div>
                        <div className="text-caption text-on-surface-variant">5 visitas realizadas</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">call</span>
                        <span className="text-label-muted">(11) 97777-9012</span>
                      </div>
                      <div className="flex items-center gap-2 text-on-surface-variant/70">
                        <span className="material-symbols-outlined text-sm">mail</span>
                        <span className="text-caption">roberto@email.com</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-surface-container-highest border border-hairline-border rounded text-[11px] font-label-bold"><span className="material-symbols-outlined text-[14px] text-primary">pets</span> Max</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      <span className="text-label-muted">09/01/2024</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-label-bold uppercase">Ativo</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-hairline-border bg-surface-container-low flex items-center justify-between">
            <span className="text-caption font-label-muted text-on-surface-variant">Mostrando 5 de 5 clientes</span>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded border border-hairline-border text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30" disabled>
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button className="px-3 py-1 rounded bg-primary text-on-primary font-label-bold text-caption">1</button>
              <button className="p-1.5 rounded border border-hairline-border text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30" disabled>
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Layout */}
      <main className="block md:hidden px-4 pt-4 pb-24 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Clientes</h1>
            <p className="text-on-surface-variant text-sm font-label-muted">5 clientes cadastrados</p>
          </div>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar -mx-4 px-4">
          <div className="min-w-[160px] flex-1 bg-elevated-card border border-hairline-border p-4 rounded-xl extruded-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="material-symbols-outlined text-primary bg-emerald-glow/20 p-1.5 rounded-lg text-lg">group</span>
              <span className="text-[10px] text-primary font-bold">+12%</span>
            </div>
            <div className="text-xl font-bold text-on-surface">5</div>
            <div className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">total de Clientes</div>
          </div>
          <div className="min-w-[160px] flex-1 bg-elevated-card border border-hairline-border p-4 rounded-xl extruded-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="material-symbols-outlined text-primary bg-emerald-glow/20 p-1.5 rounded-lg text-lg">person_check</span>
              <span className="text-[10px] text-primary font-bold">80%</span>
            </div>
            <div className="text-xl font-bold text-on-surface">4</div>
            <div className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Ativos</div>
          </div>
          <div className="min-w-[160px] flex-1 bg-elevated-card border border-hairline-border p-4 rounded-xl extruded-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="material-symbols-outlined text-primary bg-emerald-glow/20 p-1.5 rounded-lg text-lg">pets</span>
              <span className="text-[10px] text-primary font-bold">+5</span>
            </div>
            <div className="text-xl font-bold text-on-surface">7</div>
            <div className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider">Pets</div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input className="w-full bg-surface-container border-hairline-border border rounded-full pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none text-on-surface" placeholder="Buscar..." type="text" />
          </div>
          <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
            <button className="px-4 py-1.5 bg-primary text-on-primary rounded-full text-xs font-bold whitespace-nowrap">Todos</button>
            <button className="px-4 py-1.5 bg-surface-container border border-hairline-border text-on-surface-variant rounded-full text-xs font-bold whitespace-nowrap">Ativos</button>
            <button className="px-4 py-1.5 bg-surface-container border border-hairline-border text-on-surface-variant rounded-full text-xs font-bold whitespace-nowrap">Inativos</button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-elevated-card border border-hairline-border p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-glow/20 flex items-center justify-center text-primary font-bold">CS</div>
              <div>
                <div className="font-bold text-on-surface">Carlos Silva</div>
                <div className="flex gap-1 mt-1">
                  <span className="px-1.5 py-0.5 bg-surface-container-highest rounded text-[10px] text-on-surface-variant flex items-center"><span className="material-symbols-outlined text-[14px] mr-1">pets</span>Thor</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-full">
                <span className="material-symbols-outlined text-lg">chat</span>
              </button>
              <button className="text-on-surface-variant">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
          </div>
          <div className="bg-elevated-card border border-hairline-border p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-fixed-dim font-bold">AB</div>
              <div>
                <div className="font-bold text-on-surface">Ana Beatriz</div>
                <div className="flex gap-1 mt-1">
                  <span className="px-1.5 py-0.5 bg-surface-container-highest rounded text-[10px] text-on-surface-variant flex items-center"><span className="material-symbols-outlined text-[14px] mr-1">pets</span>Luna</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-full">
                <span className="material-symbols-outlined text-lg">chat</span>
              </button>
              <button className="text-on-surface-variant">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
          </div>
        </div>
        <button className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg z-50 active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-2xl">person_add</span>
        </button>
      </main>
    </div>
  );
}
