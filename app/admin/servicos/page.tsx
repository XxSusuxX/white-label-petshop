"use client";

export default function ServicosPage() {
  return (
    <div className="w-full">
      {/* Desktop Workspace */}
      <main className="hidden md:block flex-1 w-full pl-64 pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto p-margin-desktop pb-safe">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-stack-lg gap-4">
            <div>
              <h2 className="text-headline-lg font-headline-lg text-on-surface mb-1">Serviços e Preços</h2>
              <p className="text-body-base font-body-base text-on-surface-variant">Gerencie suas ofertas de serviços, durações e preços.</p>
            </div>
            <button className="bg-primary-container text-on-primary-container font-label-bold text-label-bold py-2.5 px-6 rounded-DEFAULT extruded-shadow flex items-center justify-center gap-2 hover:bg-emerald-glow transition-colors shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
              Novo Serviço
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Services Table Card */}
            <div className="lg:col-span-2 bg-elevated-card border border-hairline-border rounded-lg overflow-hidden flex flex-col shadow-[0_4px_24px_-10px_rgba(0,0,0,0.5)]">
              <div className="p-5 border-b border-hairline-border flex justify-between items-center bg-surface-container-lowest">
                <h3 className="text-body-lg font-body-lg font-semibold text-on-surface">Serviços Ativos</h3>
                <button className="text-primary hover:text-surface-tint font-label-bold text-label-bold flex items-center gap-1 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  Filtrar
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-hairline-border bg-surface-container-lowest/50">
                      <th className="py-3 px-5 text-label-muted font-label-muted text-on-surface-variant font-medium tracking-wider">Nome do Serviço</th>
                      <th className="py-3 px-5 text-label-muted font-label-muted text-on-surface-variant font-medium tracking-wider hidden sm:table-cell">Descrição</th>
                      <th className="py-3 px-5 text-label-muted font-label-muted text-on-surface-variant font-medium tracking-wider">Duração</th>
                      <th className="py-3 px-5 text-label-muted font-label-muted text-on-surface-variant font-medium tracking-wider">Preço (R$)</th>
                      <th className="py-3 px-5 text-right text-label-muted font-label-muted text-on-surface-variant font-medium tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-border">
                    <tr className="hover:bg-surface-container-low transition-colors group">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[18px]">water_drop</span>
                          </div>
                          <span className="text-body-base font-body-base font-medium text-on-surface">Banho</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 hidden sm:table-cell text-body-base font-body-base text-on-surface-variant truncate max-w-[200px]">Banho padrão com shampoo premium.</td>
                      <td className="py-4 px-5 text-body-base font-body-base text-on-surface-variant">45 min</td>
                      <td className="py-4 px-5 text-body-base font-body-base font-medium text-on-surface">60,00</td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded hover:bg-surface-container-high" title="Editar">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Workspace */}
      <main className="block md:hidden px-5 py-6 space-y-8 pb-32">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-muted text-label-muted text-on-surface-variant">Catálogo Ativo</span>
            <span className="font-headline-md text-headline-md text-on-surface">6 Serviços</span>
          </div>
          <button className="bg-primary text-on-primary font-label-bold text-label-bold px-4 py-3 rounded-xl extruded-shadow flex items-center gap-2">
            <span className="material-symbols-outlined">add</span>
            Novo Serviço
          </button>
        </div>

        <section className="space-y-4">
          <h2 className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider">Principais Serviços</h2>
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-4 flex items-center gap-4 extruded-shadow">
            <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">shower</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="font-body-lg text-body-lg text-on-surface truncate">Banho</h3>
                <span className="font-label-bold text-label-bold text-primary">R$ 45,00</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span className="font-caption text-caption">45 min</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
