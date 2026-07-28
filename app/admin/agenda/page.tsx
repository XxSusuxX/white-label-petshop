"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminAgendaPage() {
  const [selectedProfessional, setSelectedProfessional] = useState("todos");

  return (
    <div className="bg-matte-canvas text-on-surface font-body-base min-h-screen flex selection:bg-primary/30">
      {/* Admin Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-surface-container border-r border-hairline-border py-6 px-4 z-50">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center extruded-shadow">
            <span
              className="material-symbols-outlined text-on-primary-container text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              admin_panel_settings
            </span>
          </div>
          <div>
            <h1 className="font-headline-md text-headline-md text-primary font-bold leading-none">
              Painel Admin
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-1">
              Gestão de Petshop & Vet
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <Link
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-label-bold"
            href="/admin/dashboard"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-label-bold"
            href="/admin/clientes"
          >
            <span className="material-symbols-outlined">group</span>
            <span>Clientes / Tutores</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-label-bold"
            href="/admin/pets"
          >
            <span className="material-symbols-outlined">pets</span>
            <span>Pets & Prontuários</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-label-bold extruded-shadow"
            href="/admin/agenda"
          >
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Agenda Geral</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-label-bold"
            href="/admin/operacao"
          >
            <span className="material-symbols-outlined">pending_actions</span>
            <span>Esteira de Operação</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-label-bold"
            href="/admin/servicos"
          >
            <span className="material-symbols-outlined">sell</span>
            <span>Serviços & Preços</span>
          </Link>
        </nav>
      </aside>

      {/* Main Admin Workspace */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-16 w-full flex justify-between items-center px-4 md:px-8 sticky top-0 z-30 bg-matte-canvas/90 backdrop-blur-md border-b border-hairline-border">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Administração</span>
            <span>/</span>
            <span className="text-on-surface font-bold">Grade de Horários & Profissionais</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Agenda Integrada da Equipe</h1>
              <p className="text-sm text-on-surface-variant">Controle de banhistas, groomers e equipe médica veterinária.</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className="bg-surface-container border border-hairline-border rounded-xl px-3 py-2 text-on-surface text-sm outline-none cursor-pointer"
              >
                <option value="todos">Todos os Profissionais</option>
                <option value="ricardo">Ricardo M. (Groomer)</option>
                <option value="ana">Ana Costa (Banhista)</option>
                <option value="camila">Dra. Camila (Vet)</option>
              </select>

              <button
                onClick={() => alert("Novo Agendamento na Grade Admin")}
                className="px-4 py-2 bg-primary text-on-primary font-bold text-sm rounded-xl extruded-shadow hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Novo Encaixe</span>
              </button>
            </div>
          </div>

          {/* Schedule Time Table Grid */}
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 extruded-shadow space-y-4">
            <h3 className="font-bold text-on-surface text-lg">Grade do Dia — Quarta, 15 de Julho</h3>
            <div className="space-y-3">
              <div className="p-4 bg-surface-container-low border border-hairline-border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono font-bold text-primary">09:00</span>
                  <div>
                    <h4 className="font-bold text-on-surface">Thor (Golden Retriever)</h4>
                    <p className="text-xs text-on-surface-variant">Banho Completo + Tosa Bebê • Ricardo M.</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-warning-amber/10 border border-warning-amber/20 text-warning-amber text-xs font-bold rounded-full">
                  Em Tosa
                </span>
              </div>

              <div className="p-4 bg-surface-container-low border border-hairline-border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono font-bold text-primary">11:30</span>
                  <div>
                    <h4 className="font-bold text-on-surface">Luna (Gato Siamês)</h4>
                    <p className="text-xs text-on-surface-variant">Vacinação V10 • Dra. Camila</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-full">
                  Confirmado
                </span>
              </div>

              <div className="p-4 bg-surface-container-low border border-hairline-border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono font-bold text-primary">14:15</span>
                  <div>
                    <h4 className="font-bold text-on-surface">Max (French Bulldog)</h4>
                    <p className="text-xs text-on-surface-variant">Tosa Higiênica • Ana Costa</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-full">
                  Confirmado
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
