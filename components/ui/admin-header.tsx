"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `há ${diffD}d`;
}

export function AdminHeader() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Gestor Admin");
  const [userRole, setUserRole] = useState("Administrador");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  // Estados de Notificações
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLoadingNotif, setIsLoadingNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAdminProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, role")
            .eq("id", user.id)
            .maybeSingle();

          const name =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Gestor Admin";

          const avatar =
            profile?.avatar_url ||
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          setUserName(name);
          if (profile?.role) {
            setUserRole(profile.role === "admin" ? "Administrador" : profile.role);
          }
          if (avatar) setUserAvatar(avatar);
        }
      } catch (err) {
        console.warn("Aviso ao carregar perfil em AdminHeader:", err);
      }
    }
    loadAdminProfile();
  }, []);

  const loadNotifications = async () => {
    setIsLoadingNotif(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn("Aviso ao carregar notificações em AdminHeader:", err);
    } finally {
      setIsLoadingNotif(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenNotifications = () => {
    setIsNotifOpen((v) => !v);
    if (!isNotifOpen) loadNotifications();
  };

  const handleMarkRead = async (notif: NotificationItem) => {
    if (notif.is_read) return;
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    if (!notif.computed) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id }),
      });
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
  };

  const getPageDetails = () => {
    switch (pathname) {
      case "/admin/operacao":
        return {
          title: "Operação Ao Vivo",
          subtitle: "Acompanhe os pets em atendimento no Kanban em tempo real",
        };
      case "/admin/agenda":
        return {
          title: "Agenda de Agendamentos",
          subtitle: "Gerencie horários, profissionais e agendamentos gerais",
        };
      case "/admin/clientes":
        return {
          title: "Clientes / Tutores",
          subtitle: "Base de clientes ativos e contatos do WhatsApp",
        };
      case "/admin/pets":
        return {
          title: "Pets & Prontuários",
          subtitle: "Fichas médicas, histórico de vacinas e raças dos pets",
        };
      case "/admin/servicos":
        return {
          title: "Serviços & Preços",
          subtitle: "Tabela de preços, duração e catálogo de serviços",
        };
      case "/admin/pdv":
        return {
          title: "Frente de Caixa (PDV)",
          subtitle: "Vendas no balcão, lançamento de pacotes e recebimentos",
        };
      case "/admin/prontuario":
        return {
          title: "Módulo Veterinário",
          subtitle: "Fichas clínicas completas, prescrições e vacinas",
        };
      case "/admin/whatsapp":
      case "/admin/automacoes":
        return {
          title: "Zap Notifica / Central do WhatsApp",
          subtitle: "Gerenciamento da conexão, automações de mensagens e lembretes",
        };
      case "/admin/dashboard":
      default:
        return {
          title: "Painel de Gestão SaaS",
          subtitle: "Visão geral da operação, faturamento e agendamentos do petshop",
        };
    }
  };

  const details = getPageDetails();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <header className="sticky top-0 z-40 bg-matte-canvas/90 backdrop-blur-md border-b border-hairline-border px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Título e Subtítulo da Página Admin */}
      <div>
        <h1 className="font-headline-lg text-xl md:text-2xl font-extrabold text-on-surface flex items-center gap-2">
          {details.title}
        </h1>
        <p className="font-body-base text-xs text-on-surface-variant mt-0.5">
          {details.subtitle}
        </p>
      </div>

      {/* Ações e Badge do Usuário Admin */}
      <div className="flex items-center gap-3">
        {/* Ícone e Dropdown de Notificações do Admin */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotifications}
            title="Notificações do Sistema"
            className="p-2.5 rounded-xl bg-surface-container border border-hairline-border hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center shadow-md">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Painel Dropdown de Notificações do Admin */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-elevated-card border border-hairline-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-hairline-border bg-surface-container/50">
                <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">notifications</span>
                  Notificações do Gestor
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Marcar lidas
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-hairline-border/50">
                {isLoadingNotif ? (
                  <div className="text-center py-8 text-xs text-on-surface-variant flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg animate-spin text-primary">sync</span>
                    Carregando notificações...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <span className="material-symbols-outlined text-3xl text-outline mb-2 block">notifications_off</span>
                    <p className="text-xs text-on-surface-variant font-bold">Nenhuma notificação recente.</p>
                    <p className="text-[11px] text-outline mt-1">Os alertas operacionais e agendamentos aparecerão aqui.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleMarkRead(notif)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors cursor-pointer ${
                        notif.is_read ? "hover:bg-surface-container" : "bg-primary/5 hover:bg-primary/10"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-lg mt-0.5 ${notif.is_read ? "text-on-surface-variant" : "text-primary"}`}>
                        {TYPE_ICON[notif.type] || "notifications"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold ${notif.is_read ? "text-on-surface-variant" : "text-on-surface"}`}>
                            {notif.title}
                          </p>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                          {notif.body}
                        </p>
                        <p className="text-[10px] text-outline mt-1 font-mono">
                          {relativeTime(notif.created_at)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* CTA Rápido: Abrir PDV */}
        <Link
          href="/admin/pdv"
          className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl extruded-shadow hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">point_of_sale</span>
          <span className="hidden sm:inline">Abrir PDV</span>
        </Link>

        {/* User Badge Admin com Logout */}
        <div className="flex items-center gap-2 pl-3 border-l border-hairline-border">
          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 overflow-hidden flex items-center justify-center">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-bold text-xs">
                {userName.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden lg:block text-left">
            <div className="font-label-bold text-xs text-on-surface line-clamp-1">
              {userName}
            </div>
            <div className="text-[10px] text-primary font-bold">
              {userRole}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sair da Conta Admin"
            className="p-2 text-on-surface-variant hover:text-rose-400 hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer ml-1"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
