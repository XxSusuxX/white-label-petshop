"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface OpTask {
  id: string;
  pet: string;
  breed: string;
  time: string;
  service: string;
  status: "agendado" | "confirmado" | "em_atendimento" | "concluido" | "cancelado" | "bloqueio";
  tutor: string;
  phone: string;
  day: number;
  month: number;
  year: number;
}

const isToday = (day: number, month: number, year: number) => {
  const now = new Date();
  return day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
};

export default function OperacaoPage() {
  const [tasks, setTasks] = useState<OpTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/agenda");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível carregar a operação.");

      const mapped: OpTask[] = (data.appointments || [])
        .filter((a: any) => isToday(a.day, a.month, a.year))
        .filter((a: any) => a.status !== "cancelado" && a.status !== "bloqueio")
        .map((a: any) => ({
          id: a.id,
          pet: a.pet_name,
          breed: a.pet_breed,
          time: a.time,
          service: a.service_type,
          status: a.status,
          tutor: a.tutor_name,
          phone: a.tutor_phone,
          day: a.day,
          month: a.month,
          year: a.year,
        }));

      setTasks(mapped);
    } catch (err: any) {
      console.error("Erro ao carregar operação:", err);
      setLoadError(err.message || "Erro ao carregar a operação.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const notifyTutorWhatsApp = (task: OpTask) => {
    const formattedPhone = (task.phone || "").replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá ${task.tutor}! 🐾 Notícia boa: o(a) ${task.pet} acabou de finalizar o serviço de ${task.service} e está cheiroso e pronto para ser retirado na recepção do Petshop!`
    );
    window.open(`https://wa.me/55${formattedPhone}?text=${msg}`, "_blank");
  };

  const moveTask = async (id: string, newStatus: OpTask["status"]) => {
    const prevTasks = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    try {
      const res = await fetch("/api/admin/agenda", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Falha ao atualizar status.");
      }
    } catch (err) {
      console.error("Erro ao mover atendimento:", err);
      setTasks(prevTasks);
      alert("Não foi possível atualizar o atendimento. Tente novamente.");
    }
  };

  const waitingTasks = tasks.filter((t) => t.status === "agendado" || t.status === "confirmado");
  const bathingTasks = tasks.filter((t) => t.status === "em_atendimento");
  const finishedTasks = tasks.filter((t) => t.status === "concluido");

  return (
    <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container border border-hairline-border p-6 rounded-2xl extruded-shadow">
          <div>
            <div className="flex items-center gap-2 text-primary font-label-bold text-xs uppercase tracking-widest mb-1">
              <span className="material-symbols-outlined text-sm">bubble_chart</span>
              Esteira de Atendimento Ao Vivo
            </div>
            <h1 className="text-headline-md font-headline-md font-bold text-on-surface">Painel de Operação</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/agenda"
              className="bg-primary text-on-primary font-label-bold px-4 py-2.5 rounded-xl text-body-sm flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add_task</span>
              Novo Atendimento
            </Link>
          </div>
        </header>

        {isLoading ? (
          <div className="p-12 text-center text-on-surface-variant bg-elevated-card rounded-2xl border border-hairline-border">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">sync</span>
            <p className="font-bold">Carregando operação do dia...</p>
          </div>
        ) : loadError ? (
          <div className="p-12 text-center bg-elevated-card rounded-2xl border border-rose-500/30 space-y-3">
            <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
            <p className="font-bold text-rose-400">{loadError}</p>
            <button
              onClick={loadTasks}
              className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:brightness-110 cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
        /* Kanban Columns */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Column 1: Aguardando Entrada */}
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hairline-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <h3 className="font-label-bold text-body-sm uppercase tracking-wider text-on-surface">Aguardando ({waitingTasks.length})</h3>
              </div>
            </div>

            {waitingTasks.length === 0 && (
              <p className="text-caption text-on-surface-variant text-center py-6">Nenhum atendimento aguardando hoje.</p>
            )}
            {waitingTasks.map((t) => (
                <div key={t.id} className="bg-elevated-card border border-hairline-border rounded-xl p-4 space-y-3 extruded-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-on-surface text-body-sm">{t.pet}</h4>
                      <p className="text-caption text-on-surface-variant">{t.breed} • {t.tutor}</p>
                    </div>
                    <span className="text-caption font-mono bg-surface-container px-2 py-1 rounded text-on-surface-variant">
                      {t.time}
                    </span>
                  </div>

                  <span className="text-caption font-label-bold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-md block border border-amber-500/20">
                    {t.service}
                  </span>

                  <button
                    onClick={() => moveTask(t.id, "em_atendimento")}
                    className="w-full bg-surface-container-high border border-hairline-border text-primary hover:bg-primary/20 py-2 rounded-lg text-caption font-label-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    Iniciar Atendimento →
                  </button>
                </div>
              ))}
          </div>

          {/* Column 2: Em Banho / Tosa */}
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hairline-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                <h3 className="font-label-bold text-body-sm uppercase tracking-wider text-on-surface">Em Atendimento ({bathingTasks.length})</h3>
              </div>
            </div>

            {bathingTasks.length === 0 && (
              <p className="text-caption text-on-surface-variant text-center py-6">Nenhum atendimento em andamento.</p>
            )}
            {bathingTasks.map((t) => (
                <div key={t.id} className="bg-elevated-card border border-blue-500/40 rounded-xl p-4 space-y-3 extruded-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-on-surface text-body-sm">{t.pet}</h4>
                      <p className="text-caption text-on-surface-variant">{t.breed} • {t.tutor}</p>
                    </div>
                    <span className="text-caption font-mono bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                      {t.time}
                    </span>
                  </div>

                  <span className="text-caption font-label-bold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md block border border-blue-500/20">
                    {t.service}
                  </span>

                  <button
                    onClick={() => moveTask(t.id, "concluido")}
                    className="w-full bg-primary text-on-primary py-2 rounded-lg text-caption font-label-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    Finalizar Serviço ✓
                  </button>
                </div>
              ))}
          </div>

          {/* Column 3: Pronto para Retirada (Com Disparo WhatsApp) */}
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hairline-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h3 className="font-label-bold text-body-sm uppercase tracking-wider text-on-surface">Pronto para Busca ({finishedTasks.length})</h3>
              </div>
            </div>

            {finishedTasks.length === 0 && (
              <p className="text-caption text-on-surface-variant text-center py-6">Nenhum atendimento concluído hoje.</p>
            )}
            {finishedTasks.map((t) => (
                <div key={t.id} className="bg-elevated-card border border-primary/40 rounded-xl p-4 space-y-3 extruded-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-on-surface text-body-sm">{t.pet}</h4>
                      <p className="text-caption text-on-surface-variant">{t.breed} • {t.tutor}</p>
                    </div>
                    <span className="text-caption font-label-bold bg-primary/20 text-primary px-2 py-1 rounded">
                      Concluído
                    </span>
                  </div>

                  <button
                    onClick={() => notifyTutorWhatsApp(t)}
                    className="w-full bg-emerald-500 text-black font-label-bold py-2.5 rounded-lg text-caption flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">chat</span>
                    Avisar Tutor pelo WhatsApp
                  </button>
                </div>
              ))}
          </div>
        </div>
        )}
      </main>
  );
}
