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

const STAFF_ROLES = [
  "admin",
  "dono",
  "veterinario",
  "veterinarian",
  "banhista_tosador",
  "bather",
  "groomer",
  "recepcionista",
  "receptionist",
  "entregador",
  "auxiliar",
  "employee",
  "funcionario",
];

const shownClientNotifIds = new Set<string>();

export function ClientHeader() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Tutor");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLoadingNotif, setIsLoadingNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerServiceWorker();
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, role")
            .eq("id", user.id)
            .maybeSingle();

          const name = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Tutor";
          const avatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
          const userRole = (profile?.role || user.user_metadata?.role || "").toLowerCase();

          setUserName(name);
          if (avatar) setUserAvatar(avatar);
          if (STAFF_ROLES.includes(userRole)) {
            setHasAdminAccess(true);
          }
        }
      } catch (err) {
        console.warn("Aviso ao carregar perfil em ClientHeader:", err);
      }
    }
    loadUserProfile();
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

          if (!n.is_read && isRecent && !shownClientNotifIds.has(n.id)) {
            shownClientNotifIds.add(n.id);
            sendBrowserNotification(n.title, { body: n.body });
          }
        });
      }
    } catch (err) {
      console.warn("Aviso ao carregar notificações:", err);
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
    }).catch(() => {});
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    }).catch(() => {});
  };

  const getPageDetails = () => {
    switch (pathname) {
      case "/client/pets":
        return {
          title: "Meus Pets",
          subtitle: "Gerencie seus pets cadastrados e visualize seus prontuários",
        };
      case "/client/agenda":
        return {
          title: "Agendar Serviço",
          subtitle: "Escolha a data, horário e serviço ideal para o seu pet",
        };
      case "/client/historico":
        return {
          title: "Histórico de Serviços",
          subtitle: "Revise e gerencie os atendimentos passados dos seus pets",
        };
      case "/client":
      default:
        return {
          title: "Painel do Tutor",
          subtitle: "Acompanhe o status e agendamentos dos seus pets em tempo real",
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
      {/* Mobile Top Header: User Profile Badge + Actions */}
      <div className="flex md:hidden items-center justify-between gap-2 w-full">
        {/* User Profile Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/60 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-primary text-xl">person</span>
            )}
          </div>
          <div className="text-left min-w-0">
            <span className="font-bold text-sm text-on-surface block leading-tight truncate">
              {userName}
            </span>
            <span className="text-[11px] font-medium text-primary block leading-tight">
              Tutor Verificado
            </span>
          </div>
        </div>

        {/* Mobile Actions: Notifications, Admin Link & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {hasAdminAccess && (
            <Link
              href="/admin/dashboard"
              title="Painel Administrativo (/admin)"
              className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 transition-colors flex items-center justify-center cursor-pointer relative"
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
            </Link>
          )}

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleOpenNotifications}
              className="p-2.5 rounded-xl bg-surface-container border border-hairline-border text-on-surface-variant hover:text-on-surface transition-colors relative cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="fixed top-16 left-4 right-4 max-w-sm ml-auto bg-elevated-card border border-hairline-border rounded-2xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-hairline-border">
                  <h3 className="font-bold text-sm text-on-surface">Notificações</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[11px] font-bold text-primary hover:underline cursor-pointer">
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {isLoadingNotif ? (
                    <p className="text-xs text-on-surface-variant text-center py-8">Carregando...</p>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <span className="material-symbols-outlined text-3xl text-outline mb-2 block">notifications_off</span>
                      <p className="text-xs text-on-surface-variant">Nenhuma notificação por aqui.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleMarkRead(notif)}
                        className={`w-full text-left px-4 py-3 border-b border-hairline-border/50 last:border-b-0 flex items-start gap-3 transition-colors cursor-pointer ${
                          notif.is_read ? "hover:bg-surface-container" : "bg-primary/5 hover:bg-primary/10"
                        }`}
                      >
                        <span className={`material-symbols-outlined text-lg mt-0.5 ${notif.is_read ? "text-on-surface-variant" : "text-primary"}`}>
                          {TYPE_ICON[notif.type] || "notifications"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs font-bold ${notif.is_read ? "text-on-surface-variant" : "text-on-surface"}`}>{notif.title}</p>
                            {!notif.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>}
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">{notif.body}</p>
                          <p className="text-[10px] text-outline mt-1">{relativeTime(notif.created_at)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-hairline-border bg-surface-container/60 text-center">
                  <Link
                    href="/client/notificacoes"
                    onClick={() => setIsNotifOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    <span>Ver todas as notificações</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Sair da Conta"
            className="p-2.5 rounded-xl bg-surface-container border border-hairline-border hover:bg-red-500/10 hover:border-red-500/30 text-on-surface-variant hover:text-red-400 transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>

      {/* Desktop Header Left: Page Title */}
      <div className="hidden md:block">
        <h1 className="font-headline-lg text-lg md:text-2xl font-extrabold text-on-surface">
          {details.title}
        </h1>
        <p className="font-body-base text-xs text-on-surface-variant mt-0.5 hidden sm:block">
          {details.subtitle}
        </p>
      </div>

      {/* Mobile Sub-page Title (when not on root client page) */}
      {pathname !== "/client" && (
        <div className="md:hidden pt-1 border-t border-hairline-border/40">
          <h1 className="font-headline-lg text-base font-bold text-on-surface">
            {details.title}
          </h1>
        </div>
      )}

      {/* Desktop Header Right Actions */}
      <div className="hidden md:flex items-center gap-2 md:gap-3">
        {hasAdminAccess && (
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs hover:bg-amber-500/25 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
            <span>Painel Admin</span>
          </Link>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotifications}
            className="p-2.5 rounded-xl bg-surface-container border border-hairline-border hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-elevated-card border border-hairline-border rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-hairline-border">
                <h3 className="font-bold text-sm text-on-surface">Notificações</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-[11px] font-bold text-primary hover:underline cursor-pointer">
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {isLoadingNotif ? (
                  <p className="text-xs text-on-surface-variant text-center py-8">Carregando...</p>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <span className="material-symbols-outlined text-3xl text-outline mb-2 block">notifications_off</span>
                    <p className="text-xs text-on-surface-variant">Nenhuma notificação por aqui.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleMarkRead(notif)}
                      className={`w-full text-left px-4 py-3 border-b border-hairline-border/50 last:border-b-0 flex items-start gap-3 transition-colors cursor-pointer ${
                        notif.is_read ? "hover:bg-surface-container" : "bg-primary/5 hover:bg-primary/10"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-lg mt-0.5 ${notif.is_read ? "text-on-surface-variant" : "text-primary"}`}>
                        {TYPE_ICON[notif.type] || "notifications"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold ${notif.is_read ? "text-on-surface-variant" : "text-on-surface"}`}>{notif.title}</p>
                          {!notif.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>}
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">{notif.body}</p>
                        <p className="text-[10px] text-outline mt-1">{relativeTime(notif.created_at)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-hairline-border bg-surface-container/60 text-center">
                <Link
                  href="/client/notificacoes"
                  onClick={() => setIsNotifOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <span>Ver todas as notificações</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick CTA */}
        <Link
          href="/client/agenda"
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg"
        >
          <span className="material-symbols-outlined text-base">calendar_add_on</span>
          <span>Agendar Serviço</span>
        </Link>

        {/* User Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-hairline-border">
          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 overflow-hidden flex items-center justify-center">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="material-symbols-outlined text-primary text-lg">person</span>
            )}
          </div>
          <div className="hidden lg:block text-left">
            <span className="font-bold text-xs text-on-surface block leading-tight">{userName}</span>
            <span className="text-[10px] text-on-surface-variant block">Tutor Verificado</span>
          </div>
        </div>

        {/* Logout Button */}
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
