"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  computed?: boolean;
}

const TYPE_ICON: Record<string, string> = {
  agendamento_criado: "event_available",
  agendamento_confirmado: "check_circle",
  agendamento_alterado: "update",
  agendamento_cancelado: "event_busy",
  lembrete: "notifications_active",
  mensagem: "campaign",
};

const TYPE_LABEL: Record<string, string> = {
  agendamento_criado: "Agendamento Criado",
  agendamento_confirmado: "Confirmado",
  agendamento_alterado: "Atualizado",
  agendamento_cancelado: "Cancelado",
  lembrete: "Lembrete",
  mensagem: "Aviso",
};

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours} ${diffHours === 1 ? "hora" : "horas"}`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<"todos" | "nao_lidas" | "agendamentos" | "lembretes">("todos");
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (notif: NotificationItem) => {
    if (notif.is_read) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
    );

    if (!notif.computed) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notif.id }),
        });
      } catch (err) {
        console.error("Erro ao marcar como lida:", err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all: true }),
      });
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "nao_lidas") return !item.is_read;
    if (filter === "agendamentos") return item.type.startsWith("agendamento");
    if (filter === "lembretes") return item.type === "lembrete" || item.type === "mensagem";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container border border-hairline-border p-5 rounded-3xl extruded-shadow">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-2xl">notifications_active</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-on-surface">Notificações e Alertas</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-bold">
                  {unreadCount} {unreadCount === 1 ? "nova" : "novas"}
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Fique por dentro das novidades, status de banho & tosa e lembretes dos seus pets.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="px-4 py-2.5 rounded-xl bg-surface-container-high border border-hairline-border hover:border-primary/40 text-primary text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">done_all</span>
            <span>Marcar todas como lidas</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "todos", label: "Todas", icon: "all_inbox" },
          { id: "nao_lidas", label: `Não Lidas (${unreadCount})`, icon: "mark_email_unread" },
          { id: "agendamentos", label: "Agendamentos", icon: "calendar_month" },
          { id: "lembretes", label: "Lembretes e Avisos", icon: "notifications" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              filter === tab.id
                ? "bg-primary text-on-primary shadow-md"
                : "bg-surface-container text-on-surface-variant hover:text-on-surface border border-hairline-border"
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-12 text-center space-y-3">
            <span className="material-symbols-outlined text-3xl text-primary animate-spin">sync</span>
            <p className="text-xs text-on-surface-variant font-medium">Carregando suas notificações...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-surface-container border border-hairline-border rounded-3xl p-10 text-center space-y-3 extruded-shadow">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high mx-auto flex items-center justify-center text-outline">
              <span className="material-symbols-outlined text-3xl">notifications_off</span>
            </div>
            <h3 className="text-sm font-bold text-on-surface">Nenhuma notificação encontrada</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              {filter === "nao_lidas"
                ? "Você já leu todas as suas notificações! Tudo atualizado por aqui."
                : "Não há notificações registradas nesta categoria no momento."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif)}
              className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                notif.is_read
                  ? "bg-surface-container border-hairline-border opacity-85 hover:opacity-100"
                  : "bg-surface-container-high border-primary/30 shadow-md relative overflow-hidden"
              }`}
            >
              {!notif.is_read && (
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary"></div>
              )}

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  notif.is_read
                    ? "bg-surface-container-highest border-hairline-border text-on-surface-variant"
                    : "bg-primary/10 border-primary/30 text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-xl">
                  {TYPE_ICON[notif.type] || "notifications"}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold ${notif.is_read ? "text-on-surface-variant" : "text-on-surface"}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant border border-hairline-border">
                      {TYPE_LABEL[notif.type] || "Notificação"}
                    </span>
                  </div>

                  <span className="text-[11px] text-outline font-medium">
                    {formatRelativeTime(notif.created_at)}
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {notif.body}
                </p>
              </div>

              {!notif.is_read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkRead(notif);
                  }}
                  title="Marcar como lida"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-primary hover:underline p-1.5 rounded-lg hover:bg-primary/10 shrink-0"
                >
                  <span className="material-symbols-outlined text-lg">check</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
