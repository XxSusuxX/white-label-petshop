"use client";

import { useState } from "react";
import Link from "next/link";

export default function OperacaoPage() {
  const [tasks, setTasks] = useState([
    { id: "1", pet: "Thor", breed: "Golden Retriever", time: "09:00", service: "Banho & Tosa", status: "bathing", tutor: "Carlos Eduardo", phone: "(11) 99999-9999" },
    { id: "2", pet: "Mel", breed: "Poodle Toy", time: "10:30", service: "Hidratação", status: "waiting", tutor: "Mariana Costa", phone: "(11) 98888-7777" },
    { id: "3", pet: "Bidu", breed: "SRD", time: "14:00", service: "Consulta Vet", status: "finished", tutor: "Welington Souza", phone: "(11) 97777-6666" },
  ]);

  const notifyTutorWhatsApp = (task: typeof tasks[0]) => {
    const formattedPhone = task.phone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá ${task.tutor}! 🐾 Notícia boa: o(a) ${task.pet} acabou de finalizar o serviço de ${task.service} e está cheiroso e pronto para ser retirado na recepção do Petshop!`
    );
    window.open(`https://wa.me/55${formattedPhone}?text=${msg}`, "_blank");
  };

  const moveTask = (id: string, newStatus: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
  };

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

        {/* Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Column 1: Aguardando Entrada */}
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hairline-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <h3 className="font-label-bold text-body-sm uppercase tracking-wider text-on-surface">Aguardando (1)</h3>
              </div>
            </div>

            {tasks
              .filter((t) => t.status === "waiting")
              .map((t) => (
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
                    onClick={() => moveTask(t.id, "bathing")}
                    className="w-full bg-surface-container-high border border-hairline-border text-primary hover:bg-primary/20 py-2 rounded-lg text-caption font-label-bold flex items-center justify-center gap-1 transition-all"
                  >
                    Iniciar Banho →
                  </button>
                </div>
              ))}
          </div>

          {/* Column 2: Em Banho / Tosa */}
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hairline-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                <h3 className="font-label-bold text-body-sm uppercase tracking-wider text-on-surface">Em Atendimento (1)</h3>
              </div>
            </div>

            {tasks
              .filter((t) => t.status === "bathing")
              .map((t) => (
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
                    onClick={() => moveTask(t.id, "finished")}
                    className="w-full bg-primary text-on-primary py-2 rounded-lg text-caption font-label-bold flex items-center justify-center gap-1 transition-all"
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
                <h3 className="font-label-bold text-body-sm uppercase tracking-wider text-on-surface">Pronto para Busca (1)</h3>
              </div>
            </div>

            {tasks
              .filter((t) => t.status === "finished")
              .map((t) => (
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
      </main>
  );
}
