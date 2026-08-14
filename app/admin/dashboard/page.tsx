"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
  revenueToday: number;
  revenueChangePct: number | null;
  todaysAppointmentsCount: number;
  breakdown: { banho: number; tosa: number; vet: number; outros: number };
  newClientsThisWeek: number;
  totalClients: number;
  activeAutomations: number;
  totalAutomations: number;
  upcoming: { time: string; pet: string; breed: string; service: string; status: string; tutor: string }[];
}

const STATUS_LABEL: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em Atendimento",
  pronto: "Pronto para Busca",
  em_rota: "Em Rota",
  concluido: "Concluído",
  cancelado: "Cancelado",
  bloqueio: "Bloqueio",
};

const STATUS_STYLE: Record<string, string> = {
  agendado: "bg-primary/10 text-primary border-primary/30",
  confirmado: "bg-primary/10 text-primary border-primary/30",
  em_atendimento: "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse",
  pronto: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  em_rota: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  concluido: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  cancelado: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadDashboard = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Não foi possível carregar o dashboard.");
      setData(json);
    } catch (err: any) {
      console.error("Erro ao carregar dashboard:", err);
      setLoadError(err.message || "Erro ao carregar dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCopyBookingLink = () => {
    const link = `${window.location.origin}/agendar`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Indicador de Carregamento / Erro */}
      {isLoading ? (
        <div className="p-12 text-center text-on-surface-variant bg-elevated-card rounded-2xl border border-hairline-border flex flex-col items-center justify-center min-h-[50vh]">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-3">sync</span>
          <p className="font-bold text-sm">Carregando indicadores essenciais...</p>
        </div>
      ) : loadError ? (
        <div className="p-12 text-center bg-elevated-card rounded-2xl border border-rose-500/30 space-y-3">
          <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
          <p className="font-bold text-rose-400">{loadError}</p>
          <button
            onClick={loadDashboard}
            className="bg-primary text-on-primary font-bold text-xs px-5 py-2.5 rounded-xl hover:brightness-110 cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        data && (
          <>
            {/* 1. CARDS DE MÉTRICAS ESSENCIAIS (KPIs) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Faturamento Hoje */}
              <div className="bg-surface-container border border-hairline-border rounded-2xl p-5 extruded-shadow flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                    Faturamento Hoje
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">attach_money</span>
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                    R$ {data.revenueToday.toFixed(2).replace(".", ",")}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {data.revenueChangePct === null ? (
                      "Sem dados de ontem"
                    ) : (
                      <span
                        className={`font-bold inline-flex items-center gap-1 ${
                          data.revenueChangePct >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {data.revenueChangePct >= 0 ? "trending_up" : "trending_down"}
                        </span>
                        {data.revenueChangePct >= 0 ? "+" : ""}
                        {data.revenueChangePct}% vs. ontem
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Card 2: Agenda do Dia */}
              <div className="bg-surface-container border border-hairline-border rounded-2xl p-5 extruded-shadow flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                    Agenda de Hoje
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">calendar_month</span>
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                    {data.todaysAppointmentsCount} <span className="text-xs font-bold text-on-surface-variant font-normal">atendimentos</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1 font-semibold">
                    {data.breakdown.banho} Banhos • {data.breakdown.tosa} Tosas • {data.breakdown.vet} Vet
                  </p>
                </div>
              </div>

              {/* Card 3: Clientes */}
              <div className="bg-surface-container border border-hairline-border rounded-2xl p-5 extruded-shadow flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                    Novos Clientes
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">group_add</span>
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                    +{data.newClientsThisWeek} <span className="text-xs font-bold text-on-surface-variant font-normal">na semana</span>
                  </div>
                  <p className="text-xs text-amber-400 font-bold mt-1">
                    {data.totalClients} tutores cadastrados
                  </p>
                </div>
              </div>

              {/* Card 4: Zap Notifica */}
              <div className="bg-surface-container border border-hairline-border rounded-2xl p-5 extruded-shadow flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                    Automações Zap
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">mark_chat_unread</span>
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                    {data.activeAutomations} <span className="text-xs font-bold text-primary font-normal">ativas</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    de {data.totalAutomations} configuradas
                  </p>
                </div>
              </div>
            </div>

            {/* 2. CONTEÚDO PRINCIPAL (LAYOUT LIMPO 2 COLUNAS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* COLUNA ESQUERDA: PRÓXIMOS ATENDIMENTOS (8 COLUNAS) */}
              <div className="lg:col-span-8 bg-surface-container border border-hairline-border rounded-2xl p-6 extruded-shadow space-y-4">
                <div className="flex items-center justify-between border-b border-hairline-border pb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                    <h3 className="font-bold text-base text-on-surface">Próximos Atendimentos de Hoje</h3>
                  </div>
                  <Link
                    href="/admin/agenda"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Ver Agenda Completa →
                  </Link>
                </div>

                <div className="space-y-3">
                  {data.upcoming.length === 0 ? (
                    <div className="text-center py-8 text-on-surface-variant space-y-2">
                      <span className="material-symbols-outlined text-3xl text-outline">event_available</span>
                      <p className="text-xs font-bold">Nenhum atendimento pendente para hoje.</p>
                    </div>
                  ) : (
                    data.upcoming.map((item, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface-container-high rounded-xl border border-hairline-border/60 hover:border-hairline-border transition-all"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="font-mono font-extrabold text-primary text-sm bg-matte-canvas px-2.5 py-1 rounded-lg border border-hairline-border">
                            {item.time}
                          </span>
                          <div>
                            <h4 className="font-bold text-on-surface text-sm">
                              {item.pet} <span className="text-xs font-normal text-on-surface-variant">({item.breed})</span>
                            </h4>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {item.service} • Tutor: <strong className="text-on-surface">{item.tutor}</strong>
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border self-start sm:self-center shrink-0 ${
                            STATUS_STYLE[item.status] || "bg-primary/10 text-primary border-primary/30"
                          }`}
                        >
                          {STATUS_LABEL[item.status] || item.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* COLUNA DIREITA: ATALHOS RÁPIDOS & AGENDAMENTO PÚBLICO (4 COLUNAS) */}
              <div className="lg:col-span-4 space-y-6">
                {/* ATALHOS RÁPIDOS */}
                <div className="bg-surface-container border border-hairline-border rounded-2xl p-6 extruded-shadow space-y-4">
                  <h3 className="font-bold text-base text-on-surface border-b border-hairline-border pb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">bolt</span>
                    Atalhos Rápidos
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/admin/pdv"
                      className="bg-surface-container-high border border-hairline-border hover:border-primary p-3.5 rounded-xl flex flex-col items-center gap-2 text-center transition-all group"
                    >
                      <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">
                        point_of_sale
                      </span>
                      <span className="text-xs font-bold text-on-surface">Abrir PDV</span>
                    </Link>

                    <Link
                      href="/admin/operacao"
                      className="bg-surface-container-high border border-hairline-border hover:border-primary p-3.5 rounded-xl flex flex-col items-center gap-2 text-center transition-all group"
                    >
                      <span className="material-symbols-outlined text-amber-400 text-2xl group-hover:scale-110 transition-transform">
                        bubble_chart
                      </span>
                      <span className="text-xs font-bold text-on-surface">Esteira Ao Vivo</span>
                    </Link>

                    <Link
                      href="/admin/prontuario"
                      className="bg-surface-container-high border border-hairline-border hover:border-primary p-3.5 rounded-xl flex flex-col items-center gap-2 text-center transition-all group"
                    >
                      <span className="material-symbols-outlined text-sky-400 text-2xl group-hover:scale-110 transition-transform">
                        stethoscope
                      </span>
                      <span className="text-xs font-bold text-on-surface">Módulo Vet</span>
                    </Link>

                    <Link
                      href="/admin/agenda"
                      className="bg-surface-container-high border border-hairline-border hover:border-primary p-3.5 rounded-xl flex flex-col items-center gap-2 text-center transition-all group"
                    >
                      <span className="material-symbols-outlined text-emerald-400 text-2xl group-hover:scale-110 transition-transform">
                        calendar_today
                      </span>
                      <span className="text-xs font-bold text-on-surface">Nova Agenda</span>
                    </Link>
                  </div>
                </div>

                {/* LINK DE AGENDAMENTO PÚBLICO */}
                <div className="bg-surface-container border border-primary/30 rounded-2xl p-6 extruded-shadow space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">link</span>
                    <h3 className="font-bold text-base text-on-surface">Agendamento Online 24/7</h3>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Compartilhe este link com seus tutores para agendarem serviços diretamente online.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleCopyBookingLink}
                      className="flex-1 bg-surface-container-high border border-hairline-border hover:border-primary text-on-surface font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        {copiedLink ? "check" : "content_copy"}
                      </span>
                      {copiedLink ? "Link Copiado!" : "Copiar Link Público"}
                    </button>
                    <Link
                      href="/agendar"
                      target="_blank"
                      className="p-3 bg-primary text-on-primary rounded-xl hover:brightness-110 transition-all flex items-center justify-center cursor-pointer shadow-md"
                      title="Abrir página pública de agendamento"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </main>
  );
}
