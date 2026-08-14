"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface OpTask {
  id: string;
  pet: string;
  breed: string;
  species: string;
  photo: string | null;
  time: string;
  service: string;
  status: "agendado" | "confirmado" | "em_atendimento" | "pronto" | "em_rota" | "concluido" | "cancelado" | "bloqueio";
  tutor: string;
  phone: string;
  day: number;
  month: number;
  year: number;
  notes: string;
  address?: string;
  currentStepIndex: number;
}

// Utilitário para dividir serviços compostos por &, e, +
const parseServiceSteps = (serviceName: string): string[] => {
  if (!serviceName) return ["Atendimento"];

  let parts: string[] = [];
  if (serviceName.includes("&")) {
    parts = serviceName.split("&").map((s) => s.trim());
  } else if (/\b e \b/i.test(serviceName)) {
    parts = serviceName.split(/\b e \b/i).map((s) => s.trim());
  } else if (serviceName.includes("+")) {
    parts = serviceName.split("+").map((s) => s.trim());
  } else {
    parts = [serviceName.trim()];
  }

  const filtered = parts.filter(Boolean);
  return filtered.length > 0 ? filtered : [serviceName];
};

// Limpa tags prévias de operação e status das observações
const cleanTaskNotes = (notes?: string) => {
  if (!notes) return "";
  return notes
    .replace(/Status:\s*\w+\s*\|?/gi, "")
    .replace(/\[STATUS:\w+\]\s*\|?/gi, "")
    .replace(/\[OPERACAO\]\s*\|?/gi, "")
    .replace(/\[STEP:\d+\]\s*\|?/gi, "")
    .trim();
};

export default function OperacaoPage() {
  const [tasks, setTasks] = useState<OpTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"todos" | "concluidos" | "cancelados">("todos");

  const loadTodayOperacao = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/agenda");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível carregar a operação.");

      const today = new Date();
      const todayDay = today.getDate();
      const todayMonth = today.getMonth() + 1;
      const todayYear = today.getFullYear();

      const mapped: OpTask[] = (data.appointments || [])
        .filter((a: any) => {
          if (a.status === "bloqueio") return false;

          const isSameDay = a.day === todayDay && a.month === todayMonth && a.year === todayYear;

          // Incluir se for hoje OU se já possuir marcação de esteira em andamento
          if (isSameDay) return true;
          if (a.notes?.includes("[OPERACAO]") || a.notes?.includes("[STEP:")) return true;
          if (["em_atendimento", "pronto", "em_rota"].includes(a.status)) return true;

          return false;
        })
        .map((a: any) => {
          const rawNotes = a.notes || "";
          let stepIdx = 0;
          const stepMatch = rawNotes.match(/\[STEP:(\d+)\]/);
          if (stepMatch) {
            stepIdx = parseInt(stepMatch[1], 10);
          }

          const rawStatus = a.status || "agendado";
          const validStatus: OpTask["status"] =
            rawStatus === "cancelado"
              ? "cancelado"
              : rawStatus === "concluido"
              ? "concluido"
              : rawStatus === "em_rota"
              ? "em_rota"
              : rawStatus === "pronto"
              ? "pronto"
              : rawStatus === "em_atendimento"
              ? "em_atendimento"
              : "agendado";

          return {
            id: a.id,
            pet: a.pet_name,
            breed: a.pet_breed,
            species: a.pet_species || "Cachorro",
            photo: a.pet_photo || null,
            time: a.time,
            service: a.service_type,
            status: validStatus,
            tutor: a.tutor_name,
            phone: a.tutor_phone,
            day: a.day,
            month: a.month,
            year: a.year,
            notes: rawNotes,
            address: a.address || "",
            currentStepIndex: stepIdx,
          };
        });

      setTasks(mapped);
    } catch (err: any) {
      console.error("Erro ao carregar operação:", err);
      setLoadError(err.message || "Erro ao carregar a operação.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTodayOperacao();

    const supabase = createClient();
    const channel = supabase
      .channel("realtime-operacao-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          loadTodayOperacao();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateAppointmentStatusInSupabase = async (
    id: string,
    newStatus: OpTask["status"],
    notesTag?: string
  ) => {
    try {
      const payload: any = { id, status: newStatus };
      if (notesTag) payload.notes = notesTag;

      const res = await fetch("/api/admin/agenda", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Erro no PATCH do Supabase:", data);
        alert(`Erro ao atualizar status: ${data?.error || "Falha ao salvar no banco."}`);
        await loadTodayOperacao();
      }
    } catch (err: any) {
      console.error("Erro ao atualizar no Supabase:", err);
      alert(`Erro ao atualizar status: ${err?.message || "Conexão interrompida."}`);
      await loadTodayOperacao();
    }
  };

  // Iniciar Atendimento (Mover da coluna Aguardando para Em Atendimento)
  const handleStartAttendance = async (task: OpTask) => {
    const clean = cleanTaskNotes(task.notes);
    const newNotes = clean
      ? `[OPERACAO] | [STEP:0] | Status: em_atendimento | ${clean}`
      : `[OPERACAO] | [STEP:0] | Status: em_atendimento`;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: "em_atendimento", currentStepIndex: 0, notes: newNotes }
          : t
      )
    );
    await updateAppointmentStatusInSupabase(task.id, "em_atendimento", newNotes);
  };

  // Concluir Sub-etapa Atual ou Mover para Pronto para Busca no Botão Único Dinâmico
  const handleCompleteSubStep = async (task: OpTask) => {
    const steps = parseServiceSteps(task.service);
    const nextIdx = task.currentStepIndex + 1;
    const clean = cleanTaskNotes(task.notes);

    if (nextIdx < steps.length) {
      const newNotes = clean
        ? `[OPERACAO] | [STEP:${nextIdx}] | Status: em_atendimento | ${clean}`
        : `[OPERACAO] | [STEP:${nextIdx}] | Status: em_atendimento`;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, currentStepIndex: nextIdx, notes: newNotes }
            : t
        )
      );
      await updateAppointmentStatusInSupabase(task.id, "em_atendimento", newNotes);
    } else {
      const newNotes = clean
        ? `[OPERACAO] | Status: pronto | ${clean}`
        : `[OPERACAO] | Status: pronto`;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: "pronto", currentStepIndex: nextIdx, notes: newNotes }
            : t
        )
      );
      await updateAppointmentStatusInSupabase(task.id, "pronto", newNotes);
    }
  };

  // Mover de Pronto para Busca para Em Rota ou Concluído no Botão Único Dinâmico
  const handleMoveToRouteOrFinish = async (task: OpTask, targetStatus: "em_rota" | "concluido") => {
    const clean = cleanTaskNotes(task.notes);
    const newNotes = clean
      ? `[OPERACAO] | Status: ${targetStatus} | ${clean}`
      : `[OPERACAO] | Status: ${targetStatus}`;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: targetStatus, notes: newNotes } : t
      )
    );
    await updateAppointmentStatusInSupabase(task.id, targetStatus, newNotes);
  };

  const handleReactivateTask = async (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "agendado" } : t))
    );
    await updateAppointmentStatusInSupabase(id, "agendado");
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este atendimento do banco de dados?")) {
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/admin/agenda?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Erro ao excluir do banco.");
        await loadTodayOperacao();
      }
    } catch {
      alert("Erro ao conectar com o banco de dados.");
      await loadTodayOperacao();
    }
  };

  const waitingTasks = tasks.filter((t) => t.status === "agendado" || t.status === "confirmado");
  const bathingTasks = tasks.filter((t) => t.status === "em_atendimento");
  const readyTasks = tasks.filter((t) => t.status === "pronto");
  const inRouteTasks = tasks.filter((t) => t.status === "em_rota");
  const historyTasks = tasks.filter((t) => t.status === "concluido" || t.status === "cancelado");

  const filteredHistory = historyTasks.filter((t) => {
    if (historyFilter === "concluidos") return t.status === "concluido";
    if (historyFilter === "cancelados") return t.status === "cancelado";
    return true;
  });

  const getPetPhoto = (task: OpTask) => {
    if (task.photo && task.photo.trim()) return task.photo;
    if (task.species === "Gato") {
      return "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=80";
    }
    return "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80";
  };

  return (
    <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-12 text-on-surface">
      {/* Header com indicador em tempo real e atualização manual */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container p-4 md:p-6 rounded-2xl border border-hairline-border extruded-shadow">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Painel Operacional em Tempo Real
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-on-surface">Painel de Operações</h1>
          <p className="text-xs text-on-surface-variant">Gerencie serviços ativos, filas e fotos dos pets.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTodayOperacao}
            className="p-2.5 bg-matte-canvas border border-hairline-border text-on-surface-variant hover:text-on-surface rounded-xl transition-colors cursor-pointer"
            title="Atualizar painel"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
          <Link
            href="/admin/agenda"
            className="bg-primary text-on-primary font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            Ver Agenda
          </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="p-12 text-center text-on-surface-variant bg-elevated-card rounded-2xl border border-hairline-border">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">sync</span>
          <p className="font-bold text-sm">Carregando esteira de atendimento...</p>
        </div>
      ) : loadError ? (
        <div className="p-12 text-center bg-elevated-card rounded-2xl border border-rose-500/30 space-y-3">
          <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
          <p className="font-bold text-rose-400 text-sm">{loadError}</p>
          <button
            onClick={loadTodayOperacao}
            className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:brightness-110 cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* Esteira Kanban Responsiva para Celular e Desktop (4 Colunas Ativas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {/* Coluna 1: AGUARDANDO ENTRADA */}
            <div className="bg-surface-container border border-hairline-border rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-hairline-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface">
                    Aguardando ({waitingTasks.length})
                  </h3>
                </div>
              </div>

              {waitingTasks.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-6">Nenhum pet aguardando.</p>
              )}

              {waitingTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-elevated-card border border-hairline-border rounded-xl p-4 space-y-3 extruded-shadow hover:border-hairline-border/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Foto Avatar do Pet */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-hairline-border bg-surface-container shrink-0 shadow-md">
                      <img
                        src={getPetPhoto(t)}
                        alt={t.pet}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-on-surface text-sm truncate">{t.pet}</h4>
                        <span className="text-[11px] font-mono bg-surface-container px-1.5 py-0.5 rounded text-on-surface-variant font-bold shrink-0 ml-1">
                          {t.time}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">{t.breed || t.species}</p>
                      <p className="text-[11px] text-on-surface-variant/80 truncate">Tutor: {t.tutor}</p>
                    </div>
                  </div>

                  <span className="text-xs font-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md block border border-amber-500/20 truncate">
                    {t.service}
                  </span>

                  {/* BOTÃO ÚNICO EM DESTAQUE */}
                  <button
                    onClick={() => handleStartAttendance(t)}
                    className="w-full bg-primary text-on-primary py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-base">play_arrow</span>
                    Iniciar Atendimento
                  </button>
                </div>
              ))}
            </div>

            {/* Coluna 2: EM ATENDIMENTO (SUB-ETAPAS DINÂMICAS) */}
            <div className="bg-surface-container border border-hairline-border rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-hairline-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface">
                    Em Atendimento ({bathingTasks.length})
                  </h3>
                </div>
              </div>

              {bathingTasks.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-6">Nenhum pet em atendimento.</p>
              )}

              {bathingTasks.map((t) => {
                const steps = parseServiceSteps(t.service);
                const stepIndex = Math.min(t.currentStepIndex, steps.length - 1);
                const currentStepName = steps[stepIndex] || "Atendimento";
                const isLastStep = stepIndex >= steps.length - 1;
                const nextStepName = !isLastStep ? steps[stepIndex + 1] : "Pronto para Busca";

                return (
                  <div
                    key={t.id}
                    className="bg-elevated-card border border-blue-500/40 rounded-xl p-4 space-y-3 extruded-shadow relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      {/* Foto Avatar do Pet */}
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-hairline-border bg-surface-container shrink-0 shadow-md">
                        <img
                          src={getPetPhoto(t)}
                          alt={t.pet}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-on-surface text-sm truncate">{t.pet}</h4>
                          <span className="text-[11px] font-mono bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold shrink-0 ml-1">
                            {t.time}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant truncate">{t.breed || t.species}</p>
                        <p className="text-[11px] text-on-surface-variant/80 truncate">Tutor: {t.tutor}</p>
                      </div>
                    </div>

                    {/* Indicador Visual das Sub-etapas (Pills) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-on-surface-variant">
                        <span>Serviço: {t.service}</span>
                        <span className="text-primary font-mono">{stepIndex + 1}/{steps.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {steps.map((st, idx) => (
                          <span
                            key={st}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                              idx === stepIndex
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse"
                                : idx < stepIndex
                                ? "bg-surface-container text-on-surface-variant/50 line-through"
                                : "bg-surface-container-low text-on-surface-variant/40"
                            }`}
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* BOTÃO ÚNICO DINÂMICO PARA CELULAR */}
                    <button
                      onClick={() => handleCompleteSubStep(t)}
                      className="w-full bg-emerald-500 text-black py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg"
                    >
                      <span className="material-symbols-outlined text-base">
                        {isLastStep ? "check_circle" : "arrow_forward"}
                      </span>
                      {isLastStep
                        ? `Finalizar ${currentStepName} ➔ Pronto para Busca`
                        : `Finalizar ${currentStepName} ➔ Iniciar ${nextStepName}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Coluna 3: PRONTO PARA BUSCA */}
            <div className="bg-surface-container border border-hairline-border rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-hairline-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface">
                    Pronto para Busca ({readyTasks.length})
                  </h3>
                </div>
              </div>

              {readyTasks.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-6">Nenhum pet pronto no momento.</p>
              )}

              {readyTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-elevated-card border border-primary/40 rounded-xl p-4 space-y-3 extruded-shadow"
                >
                  <div className="flex items-center gap-3">
                    {/* Foto Avatar do Pet */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-hairline-border bg-surface-container shrink-0 shadow-md">
                      <img
                        src={getPetPhoto(t)}
                        alt={t.pet}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-on-surface text-sm truncate">{t.pet}</h4>
                        <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded shrink-0 ml-1">
                          Pronto
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">{t.breed || t.species}</p>
                      <p className="text-[11px] text-on-surface-variant/80 truncate">Tutor: {t.tutor}</p>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant truncate font-bold">{t.service}</p>

                  {/* Endereço de Coleta/Entrega e Botão Google Maps para o Entregador */}
                  {t.address && (
                    <div className="p-2.5 bg-surface-container-low rounded-xl border border-hairline-border space-y-2">
                      <p className="text-[11px] text-on-surface-variant flex items-start gap-1">
                        <span className="material-symbols-outlined text-xs text-primary shrink-0 mt-0.5">location_on</span>
                        <span className="break-words font-medium">{t.address}</span>
                      </p>

                      <a
                        href={
                          t.address.includes("GPS: http")
                            ? t.address.split("GPS: ")[1]
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.address)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">map</span>
                        Abrir no Google Maps 🗺️
                      </a>
                    </div>
                  )}

                  {/* BOTÃO ÚNICO EM PRONTO PARA BUSCA */}
                  <button
                    onClick={() => handleMoveToRouteOrFinish(t, "em_rota")}
                    className="w-full bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-base">local_shipping</span>
                    Iniciar Rota de Entrega ➔
                  </button>
                </div>
              ))}
            </div>

            {/* Coluna 4: EM ROTA DE ENTREGA */}
            <div className="bg-surface-container border border-hairline-border rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-hairline-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface">
                    Em Rota ({inRouteTasks.length})
                  </h3>
                </div>
              </div>

              {inRouteTasks.length === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-6">Nenhum pet em rota no momento.</p>
              )}

              {inRouteTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-elevated-card border border-purple-500/30 rounded-xl p-4 space-y-3 extruded-shadow"
                >
                  <div className="flex items-center gap-3">
                    {/* Foto Avatar do Pet */}
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-hairline-border bg-surface-container shrink-0 shadow-md">
                      <img
                        src={getPetPhoto(t)}
                        alt={t.pet}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-on-surface text-sm truncate">{t.pet}</h4>
                        <span className="text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded shrink-0 ml-1">
                          Em Rota
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">{t.breed || t.species}</p>
                      <p className="text-[11px] text-on-surface-variant/80 truncate">Tutor: {t.tutor}</p>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant truncate font-bold">{t.service}</p>

                  {/* Endereço de Coleta/Entrega e Botão Google Maps para o Entregador */}
                  {t.address && (
                    <div className="p-2.5 bg-surface-container-low rounded-xl border border-hairline-border space-y-2">
                      <p className="text-[11px] text-on-surface-variant flex items-start gap-1">
                        <span className="material-symbols-outlined text-xs text-primary shrink-0 mt-0.5">location_on</span>
                        <span className="break-words font-medium">{t.address}</span>
                      </p>

                      <a
                        href={
                          t.address.includes("GPS: http")
                            ? t.address.split("GPS: ")[1]
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.address)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">map</span>
                        Abrir no Google Maps 🗺️
                      </a>
                    </div>
                  )}

                  <button
                    onClick={() => handleMoveToRouteOrFinish(t, "concluido")}
                    className="w-full bg-emerald-500 text-black py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-110 transition-colors cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-base">task_alt</span>
                    Marcar Entregue / Concluído
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* HISTÓRICO DE SERVIÇOS CONCLUÍDOS E CANCELADOS DO DIA */}
          <section className="bg-surface-container border border-hairline-border p-5 md:p-6 rounded-2xl space-y-5 extruded-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline-border pb-4">
              <div>
                <h2 className="font-bold text-lg text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">history</span>
                  Histórico de Atendimentos Concluídos & Cancelados
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Serviços entregues, concluídos ou cancelados durante o dia de hoje.
                </p>
              </div>

              {/* Filtros de Histórico */}
              <div className="flex items-center gap-2 bg-matte-canvas p-1 rounded-xl border border-hairline-border">
                <button
                  onClick={() => setHistoryFilter("todos")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    historyFilter === "todos"
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Todos ({historyTasks.length})
                </button>
                <button
                  onClick={() => setHistoryFilter("concluidos")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    historyFilter === "concluidos"
                      ? "bg-emerald-500 text-black"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Concluídos ({tasks.filter((t) => t.status === "concluido").length})
                </button>
                <button
                  onClick={() => setHistoryFilter("cancelados")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    historyFilter === "cancelados"
                      ? "bg-rose-500 text-white"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Cancelados ({tasks.filter((t) => t.status === "cancelado").length})
                </button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-8">
                Nenhum atendimento finalizado ou cancelado no filtro selecionado.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHistory.map((t) => (
                  <div
                    key={t.id}
                    className="bg-elevated-card border border-hairline-border rounded-xl p-4 space-y-3 extruded-shadow flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-hairline-border bg-surface-container shrink-0 shadow-md">
                          <img
                            src={getPetPhoto(t)}
                            alt={t.pet}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-on-surface text-sm truncate">{t.pet}</h4>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 ${
                                t.status === "concluido"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {t.status === "concluido" ? "Concluído" : "Cancelado"}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant truncate">{t.breed || t.species}</p>
                          <p className="text-[11px] text-on-surface-variant/80 truncate">Tutor: {t.tutor}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="font-bold text-on-surface-variant truncate">{t.service}</span>
                        <span className="font-mono text-on-surface-variant">{t.time}</span>
                      </div>
                    </div>

                    {/* Botões de Ação Rápida no Histórico */}
                    <div className="flex items-center gap-2 pt-2 border-t border-hairline-border/50">
                      {t.status === "cancelado" && (
                        <button
                          onClick={() => handleReactivateTask(t.id)}
                          className="flex-1 py-2 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Reativar
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="flex-1 py-2 px-3 bg-surface-container border border-hairline-border text-on-surface-variant hover:text-rose-400 hover:border-rose-500/30 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        title="Excluir do banco permanentemente"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
