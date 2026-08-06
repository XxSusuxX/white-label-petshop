"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [activeTimeframe, setActiveTimeframe] = useState("hoje");

  return (
    <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container border border-hairline-border p-6 rounded-2xl extruded-shadow">
          <div>
            <div className="flex items-center gap-2 text-primary font-label-bold text-xs uppercase tracking-widest mb-1">
              <span className="material-symbols-outlined text-sm">dashboard</span>
              Visão Geral Operacional
            </div>
            <h1 className="text-headline-md font-headline-md font-bold text-on-surface">Painel de Gestão SaaS</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/agendar"
              target="_blank"
              className="bg-primary/10 border border-primary/30 text-primary px-4 py-2.5 rounded-xl text-body-sm font-label-bold flex items-center gap-2 hover:bg-primary/20 transition-all"
            >
              <span className="material-symbols-outlined text-sm">link</span>
              Link Público de Agendamento
            </Link>

            <Link
              href="/admin/pdv"
              className="bg-primary text-on-primary px-4 py-2.5 rounded-xl text-body-sm font-label-bold flex items-center gap-2 hover:brightness-110 transition-all extruded-shadow"
            >
              <span className="material-symbols-outlined text-sm">point_of_sale</span>
              Abrir PDV
            </Link>
          </div>
        </header>

        {/* Operational KPI Grid (Inspired by Hashiko) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Financial */}
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5 extruded-shadow flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">
                Faturamento Hoje
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">attach_money</span>
              </div>
            </div>
            <div>
              <div className="text-headline-lg font-bold text-on-surface">R$ 1.850,00</div>
              <p className="text-caption text-emerald-400 font-label-bold flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +12% vs. ontem
              </p>
            </div>
          </div>

          {/* KPI 2: Today's Schedule */}
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5 extruded-shadow flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">
                Agenda do Dia
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">calendar_month</span>
              </div>
            </div>
            <div>
              <div className="text-headline-lg font-bold text-on-surface">18 Agendamentos</div>
              <p className="text-caption text-on-surface-variant mt-1">12 Banhos • 4 Tosas • 2 Vets</p>
            </div>
          </div>

          {/* KPI 3: Active Subscriptions */}
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5 extruded-shadow flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">
                Pacotes Ativos
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">repeat</span>
              </div>
            </div>
            <div>
              <div className="text-headline-lg font-bold text-on-surface">42 Assinaturas</div>
              <p className="text-caption text-amber-400 font-label-bold mt-1">R$ 6.250,00 recorrente/mês</p>
            </div>
          </div>

          {/* KPI 4: Zap Automations */}
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5 extruded-shadow flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-caption font-label-bold text-on-surface-variant uppercase tracking-wider">
                Zap Notifica
              </span>
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">chat</span>
              </div>
            </div>
            <div>
              <div className="text-headline-lg font-bold text-on-surface">127 Enviadas</div>
              <p className="text-caption text-primary font-label-bold mt-1">94% confirmações ativas</p>
            </div>
          </div>
        </div>

        {/* Quick Action Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: PDV */}
          <Link
            href="/admin/pdv"
            className="bg-surface-container border border-hairline-border hover:border-primary/40 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between gap-4 group extruded-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span className="material-symbols-outlined text-2xl">point_of_sale</span>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">arrow_forward</span>
            </div>
            <div>
              <h3 className="font-label-bold text-headline-sm text-on-surface mb-1">Frente de Caixa (PDV)</h3>
              <p className="text-body-sm text-on-surface-variant">Realize vendas de balcão, lance serviços e receba por PIX/Cartão em segundos.</p>
            </div>
          </Link>

          {/* Card 2: Vet Records */}
          <Link
            href="/admin/prontuario"
            className="bg-surface-container border border-hairline-border hover:border-primary/40 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between gap-4 group extruded-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">stethoscope</span>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:text-blue-400 transition-colors">arrow_forward</span>
            </div>
            <div>
              <h3 className="font-label-bold text-headline-sm text-on-surface mb-1">Prontuário Veterinário</h3>
              <p className="text-body-sm text-on-surface-variant">Ficha médica completa dos pets, registro de vacinas (V10, Antirrábica) e receitas.</p>
            </div>
          </Link>

          {/* Card 3: WhatsApp Automations */}
          <Link
            href="/admin/automacoes"
            className="bg-surface-container border border-hairline-border hover:border-primary/40 p-6 rounded-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between gap-4 group extruded-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                <span className="material-symbols-outlined text-2xl">mark_chat_unread</span>
              </div>
              <span className="material-symbols-outlined text-outline group-hover:text-emerald-400 transition-colors">arrow_forward</span>
            </div>
            <div>
              <h3 className="font-label-bold text-headline-sm text-on-surface mb-1">Zap Notifica (Automações)</h3>
              <p className="text-body-sm text-on-surface-variant">Configure lembretes 24h, parabéns no aniversário do pet e aviso de "Pet Pronto!".</p>
            </div>
          </Link>
        </div>

        {/* Live Operations & Appointments Today */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-surface-container border border-hairline-border rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hairline-border pb-4">
              <h3 className="font-label-bold text-headline-sm text-on-surface">Próximos Atendimentos de Hoje</h3>
              <Link href="/admin/agenda" className="text-caption font-label-bold text-primary hover:underline">
                Ver Agenda Completa →
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { time: "09:00", pet: "Thor", breed: "Golden Retriever", service: "Banho & Tosa Completo", status: "Em Banho", tutor: "Carlos Eduardo" },
                { time: "10:30", pet: "Mel", breed: "Poodle Toy", service: "Hidratação de Pelagem", status: "Aguardando", tutor: "Mariana Costa" },
                { time: "14:00", pet: "Bidu", breed: "SRD", service: "Consulta Vet + Vacina V10", status: "Confirmado", tutor: "Welington Souza" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-container-high rounded-xl border border-hairline-border">
                  <div className="flex items-center gap-3">
                    <span className="font-headline-sm font-bold text-primary tabular-nums shrink-0">{item.time}</span>
                    <div>
                      <h4 className="font-label-bold text-on-surface text-body-sm">{item.pet} ({item.breed})</h4>
                      <p className="text-caption text-on-surface-variant">{item.service} • Tutor: {item.tutor}</p>
                    </div>
                  </div>
                  <span className="text-caption font-label-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 self-start sm:self-center">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 bg-elevated-card border border-hairline-border rounded-2xl p-6 flex flex-col justify-between gap-4 extruded-shadow">
            <div>
              <span className="text-caption font-label-bold text-primary uppercase tracking-widest block mb-1">
                Link de Agendamento
              </span>
              <h3 className="font-label-bold text-headline-sm text-on-surface">Agendamento Público 24/7</h3>
              <p className="text-caption text-on-surface-variant mt-2 leading-relaxed">
                Seus clientes podem agendar serviços pelo link direto do seu petshop.
              </p>
            </div>

            <div className="bg-surface-container p-3 rounded-xl border border-hairline-border text-xs text-on-surface-variant font-mono">
              hashiko.com.br/patinhas-felizes
            </div>

            <Link
              href="/agendar"
              target="_blank"
              className="w-full bg-primary text-on-primary font-label-bold py-3.5 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer text-body-sm"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              Testar Agendamento Online
            </Link>
          </div>
        </div>
      </main>
  );
}
