"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminOperacaoPage() {
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
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors rounded-lg font-label-bold"
            href="/admin/agenda"
          >
            <span className="material-symbols-outlined">calendar_month</span>
            <span>Agenda Geral</span>
          </Link>
          <Link
            className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-label-bold extruded-shadow"
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
            <span className="text-on-surface font-bold">Kanban Esteira de Operação em Tempo Real</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Fila de Atendimento ao Vivo (Kanban)</h1>
            <p className="text-sm text-on-surface-variant">Arraste ou avance o status dos pets na esteira de banho, tosa e entrega.</p>
          </div>

          {/* Kanban Columns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Column 1: Check-in / Coletado */}
            <div className="bg-surface-container border border-hairline-border p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-hairline-border/50 pb-2">
                <span className="font-bold text-xs text-on-surface uppercase tracking-wider">1. Chegada / Coletado</span>
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">1</span>
              </div>
              <div className="bg-elevated-card border border-hairline-border p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-on-surface">Bob (Poodle)</h4>
                  <span className="text-[10px] font-mono text-outline">14:40</span>
                </div>
                <p className="text-xs text-on-surface-variant">Tutor: Felipe Ramos</p>
                <button
                  onClick={() => alert("Avançar Bob para Banho")}
                  className="w-full py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all cursor-pointer"
                >
                  Mover para Banho →
                </button>
              </div>
            </div>

            {/* Column 2: Em Banho */}
            <div className="bg-surface-container border border-hairline-border p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-hairline-border/50 pb-2">
                <span className="font-bold text-xs text-on-surface uppercase tracking-wider">2. Em Banho</span>
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">1</span>
              </div>
              <div className="bg-elevated-card border border-hairline-border p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-on-surface">Luna (Siamês)</h4>
                  <span className="text-[10px] font-mono text-outline">15:00</span>
                </div>
                <p className="text-xs text-on-surface-variant">Banhista: Ana Costa</p>
                <button
                  onClick={() => alert("Avançar Luna para Tosa")}
                  className="w-full py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all cursor-pointer"
                >
                  Mover para Tosa →
                </button>
              </div>
            </div>

            {/* Column 3: Em Tosa */}
            <div className="bg-surface-container border border-hairline-border p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-hairline-border/50 pb-2">
                <span className="font-bold text-xs text-warning-amber uppercase tracking-wider">3. Em Tosa (Atual)</span>
                <span className="w-5 h-5 rounded-full bg-warning-amber/20 text-warning-amber text-[11px] font-bold flex items-center justify-center">1</span>
              </div>
              <div className="bg-elevated-card border border-warning-amber/40 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-on-surface">Thor (Golden)</h4>
                  <span className="text-[10px] font-mono text-warning-amber font-bold">15:30</span>
                </div>
                <p className="text-xs text-on-surface-variant">Groomer: Ricardo M.</p>
                <button
                  onClick={() => alert("Notificar Tutor via WhatsApp: Thor finalizou a tosa!")}
                  className="w-full py-1.5 bg-[#10b981] text-on-primary text-xs font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer"
                >
                  Finalizar & Notificar Whats
                </button>
              </div>
            </div>

            {/* Column 4: Finalizado / Entrega */}
            <div className="bg-surface-container border border-hairline-border p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-hairline-border/50 pb-2">
                <span className="font-bold text-xs text-on-surface uppercase tracking-wider">4. Pronto / Entrega</span>
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center">1</span>
              </div>
              <div className="bg-elevated-card border border-hairline-border p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-on-surface">Max (French)</h4>
                  <span className="text-[10px] font-mono text-primary font-bold">Concluído</span>
                </div>
                <p className="text-xs text-on-surface-variant">Motorista: Carlos A.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
