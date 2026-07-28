"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [activeTimeframe, setActiveTimeframe] = useState("mes");

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
            className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-label-bold extruded-shadow"
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

        <div className="p-4 border-t border-hairline-border space-y-4">
          <Link
            href="/"
            className="w-full bg-surface-container-high border border-hairline-border text-on-surface py-2.5 rounded-xl font-label-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-base">visibility</span>
            <span>Portal do Tutor (Cliente)</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 w-full flex justify-between items-center px-4 md:px-8 sticky top-0 z-30 bg-matte-canvas/90 backdrop-blur-md border-b border-hairline-border">
          <div className="flex items-center gap-3 md:hidden">
            <span className="font-bold text-primary text-lg">Painel Admin</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-sm text-on-surface-variant">
            <span>Administração</span>
            <span>/</span>
            <span className="text-on-surface font-bold">Dashboard Executivo</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-glow/20 border border-emerald-glow/40 text-primary text-xs font-bold rounded-full flex items-center gap-1.5 uppercase">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              WhatsApp Online
            </span>
            <button
              onClick={() => alert("Notificações Admin: 3 novos agendamentos recebidos")}
              className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Visão Geral do Estabelecimento</h1>
              <p className="text-sm text-on-surface-variant">Métricas em tempo real de faturamento, atendimentos e CRM WhatsApp.</p>
            </div>

            <div className="flex bg-surface-container p-1 rounded-lg border border-hairline-border">
              <button
                onClick={() => setActiveTimeframe("hoje")}
                className={`px-3 py-1.5 rounded font-bold text-xs transition-all cursor-pointer ${
                  activeTimeframe === "hoje" ? "bg-primary text-on-primary" : "text-on-surface-variant"
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setActiveTimeframe("semana")}
                className={`px-3 py-1.5 rounded font-bold text-xs transition-all cursor-pointer ${
                  activeTimeframe === "semana" ? "bg-primary text-on-primary" : "text-on-surface-variant"
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setActiveTimeframe("mes")}
                className={`px-3 py-1.5 rounded font-bold text-xs transition-all cursor-pointer ${
                  activeTimeframe === "mes" ? "bg-primary text-on-primary" : "text-on-surface-variant"
                }`}
              >
                Mês Atual
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-elevated-card border border-hairline-border p-5 rounded-2xl extruded-shadow space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant font-bold">
                <span>FATURAMENTO MENSAL</span>
                <span className="text-primary font-mono">+18.4%</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-on-surface">R$ 42.850,00</p>
              <p className="text-[11px] text-outline">Meta mensal: R$ 50.000,00 (85%)</p>
            </div>

            <div className="bg-elevated-card border border-hairline-border p-5 rounded-2xl extruded-shadow space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant font-bold">
                <span>ATENDIMENTOS DO DIA</span>
                <span className="text-warning-amber font-mono">18 / 24</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-primary">18 Pets</p>
              <p className="text-[11px] text-outline">6 agendamentos pendentes</p>
            </div>

            <div className="bg-elevated-card border border-hairline-border p-5 rounded-2xl extruded-shadow space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant font-bold">
                <span>CLIENTES ATIVOS (CRM)</span>
                <span className="text-primary font-mono">+42 novos</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-on-surface">348 Tutores</p>
              <p className="text-[11px] text-outline">Automação WhatsApp ativa</p>
            </div>

            <div className="bg-elevated-card border border-hairline-border p-5 rounded-2xl extruded-shadow space-y-2">
              <div className="flex items-center justify-between text-xs text-on-surface-variant font-bold">
                <span>TICKET MÉDIO</span>
                <span className="text-tertiary font-mono">R$ 138,00</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-tertiary">R$ 138,50</p>
              <p className="text-[11px] text-outline">Banhos, tosas e consultas</p>
            </div>
          </div>

          {/* Quick Action Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/admin/operacao"
              className="bg-surface-container border border-hairline-border rounded-2xl p-6 hover:border-primary/40 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">pending_actions</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-base">Esteira de Operação</h3>
                <p className="text-xs text-on-surface-variant">Acompanhe a fila de banho, tosa e entrega ao vivo.</p>
              </div>
            </Link>

            <Link
              href="/admin/clientes"
              className="bg-surface-container border border-hairline-border rounded-2xl p-6 hover:border-primary/40 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">chat</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-base">Automação WhatsApp</h3>
                <p className="text-xs text-on-surface-variant">Dispare lembretes de vacinas e fotos dos atendimentos.</p>
              </div>
            </Link>

            <Link
              href="/admin/servicos"
              className="bg-surface-container border border-hairline-border rounded-2xl p-6 hover:border-primary/40 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">sell</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-base">Tabela de Serviços</h3>
                <p className="text-xs text-on-surface-variant">Gerencie pacotes e valores por porte do pet.</p>
              </div>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
