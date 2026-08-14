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

import { requestNotificationPermission, sendBrowserNotification, registerServiceWorker } from "@/lib/client/push-notifications";
import { canAccessRoute } from "@/lib/auth-permissions";

// Rastrear IDs de notificações já disparadas no sistema nativo
const shownNotifIds = new Set<string>();

export function AdminHeader() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Gestor Admin");
  const [userRole, setUserRole] = useState("Administrador");
  const [userRawRole, setUserRawRole] = useState<string>("admin");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(true);

  // Estados de Notificações
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLoadingNotif, setIsLoadingNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerServiceWorker();
    requestNotificationPermission();

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

          const rawRole = profile?.role || user.user_metadata?.role || "admin";
          setUserRawRole(rawRole);
          const isRoleAdminOrOwner = rawRole === "admin" || rawRole === "dono" || rawRole === "Administrador";
          setIsAdminUser(isRoleAdminOrOwner);

          const ROLE_LABELS: Record<string, string> = {
            admin: "Administrador",
            dono: "Dono(a)",
            veterinario: "Médico(a) Veterinário(a)",
            veterinarian: "Médico(a) Veterinário(a)",
            banhista_tosador: "Banhista & Tosador(a)",
            bather: "Banhista & Tosador(a)",
            groomer: "Banhista & Tosador(a)",
            recepcionista: "Recepcionista",
            receptionist: "Recepcionista",
            entregador: "Entregador",
            auxiliar: "Auxiliar Geral",
            employee: "Funcionário Geral",
            funcionario: "Funcionário Geral",
            tutor: "Cliente / Tutor",
            cliente: "Cliente / Tutor",
            client: "Cliente / Tutor",
          };

          setUserRole(ROLE_LABELS[rawRole] || rawRole);
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
        const fetched: NotificationItem[] = data.notifications || [];
        setNotifications(fetched);
        setUnreadCount(data.unreadCount || 0);

        const now = Date.now();
        fetched.forEach((n) => {
          const createdTime = new Date(n.created_at).getTime();
          const isRecent = !isNaN(createdTime) && now - createdTime < 10 * 60 * 1000;

          if (!n.is_read && isRecent && !shownNotifIds.has(n.id)) {
            shownNotifIds.add(n.id);
            sendBrowserNotification(n.title, { body: n.body });
          }
        });
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
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notif.id }),
    });
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
          title: "Clientes / Funcionários",
          subtitle: "Base de clientes ativos, tutores e equipe de colaboradores",
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
      case "/admin/register-admin":
        return {
          title: "Cadastro de Equipe & Gestão",
          subtitle: "Cadastre ou promova colaboradores e defina cargos da equipe",
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
    <header className="sticky top-0 z-40 bg-matte-canvas/90 backdrop-blur-md border-b border-hairline-border px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
      {/* Título e Subtítulo da Página Admin */}
      <div>
        <h1 className="font-headline-lg text-xl md:text-2xl font-extrabold text-on-surface flex items-center gap-2">
          {details.title}
        </h1>
        <p className="font-body-base text-xs text-on-surface-variant mt-0.5 hidden sm:block">
          {details.subtitle}
        </p>
      </div>

      {/* Desktop actions */}
      <div className="hidden md:flex items-center gap-3">
        {/* Ícone e Dropdown de Notificações do Admin */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotifications}
            title="Notificações do Sistema"
            className="h-10 w-10 rounded-xl bg-surface-container border border-hairline-border hover:bg-surface-container-high hover:border-primary/40 text-on-surface-variant hover:text-on-surface transition-all relative flex items-center justify-center cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-extrabold flex items-center justify-center shadow-sm">
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

        {/* Botão de Atalho para Painel do Cliente */}
        <Link
          href="/client"
          className="h-10 px-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm"
          title="Ver Área do Cliente (/client)"
        >
          <span className="material-symbols-outlined text-base">person</span>
          <span className="hidden sm:inline">Área do Cliente</span>
        </Link>

        {/* Botão para Registrar Admin (Disponível quando cargo for Administrador) */}
        {isAdminUser && (
          <Link
            href="/admin/register-admin"
            className="h-10 px-3.5 rounded-xl bg-surface-container border border-hairline-border hover:border-primary/50 text-on-surface font-bold text-xs flex items-center gap-2 hover:bg-surface-container-high transition-all cursor-pointer shadow-sm"
            title="Registrar Novo Administrador no Sistema"
          >
            <span className="material-symbols-outlined text-base text-primary">person_add</span>
            <span className="hidden sm:inline">Registrar Admin</span>
          </Link>
        )}

        {/* CTA Rápido: Abrir PDV */}
        {canAccessRoute(userRawRole, "/admin/pdv") && (
          <Link
            href="/admin/pdv"
            className="h-10 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-sm shadow-primary/20"
          >
            <span className="material-symbols-outlined text-base">point_of_sale</span>
            <span className="hidden sm:inline">Abrir PDV</span>
          </Link>
        )}

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

      {/* Mobile-only actions */}
      <div className="flex md:hidden items-center justify-between gap-2">
        <Link
          href="/client"
          title="Área do Cliente (/client)"
          className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">person</span>
        </Link>
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotifications}
            title="Notificações"
            className="p-2.5 rounded-xl bg-surface-container border border-hairline-border text-on-surface-variant hover:text-on-surface transition-colors relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center shadow-md">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

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

        <button
          onClick={handleLogout}
          title="Sair da Conta"
          className="p-2.5 rounded-xl bg-surface-container border border-hairline-border hover:bg-red-500/10 hover:border-red-500/30 text-on-surface-variant hover:text-red-400 transition-colors flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
        </button>
      </div>
    </header>
  );
}
