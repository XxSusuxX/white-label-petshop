"use client";

import { useState, useEffect } from "react";
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
}

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

export function ClientBottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    async function loadNotificationsAndRole() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.warn("Erro ao carregar notificações no ClientBottomNav:", err);
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          const userRole = (profile?.role || user.user_metadata?.role || "").toLowerCase();
          if (STAFF_ROLES.includes(userRole)) {
            setHasAdminAccess(true);
          }
        }
      } catch (err) {
        console.warn("Erro ao verificar role de admin no ClientBottomNav:", err);
      }
    }
    loadNotificationsAndRole();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const navLinks = [
    { href: "/client", label: "Início", icon: "home" },
    { href: "/client/pets", label: "Pets", icon: "pets" },
    { href: "/client/agenda", label: "Agendar", icon: "calendar_today" },
    { href: "/client/historico", label: "Histórico", icon: "history" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-matte-canvas/95 backdrop-blur-lg border-t border-hairline-border px-2 py-2 flex items-center justify-around md:hidden shadow-lg">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-h-[44px] justify-center ${
                isActive
                  ? "text-primary bg-primary/10 font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {link.icon}
              </span>
              <span className="text-[10px] font-label-bold">{link.label}</span>
            </Link>
          );
        })}

        {/* Botão MAIS */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all relative cursor-pointer min-h-[44px] justify-center ${
            isMoreOpen || showNotifications
              ? "text-primary bg-primary/10 font-bold"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <div className="relative">
            <span className="material-symbols-outlined text-xl">menu</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-label-bold">Mais</span>
        </button>
      </nav>

      {/* Drawer / Sheet do Menu MAIS no Cliente */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end flex-col md:hidden animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setIsMoreOpen(false)} />

          <div className="bg-surface-container border-t border-hairline-border rounded-t-3xl p-5 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-hairline-border pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                <h3 className="font-bold text-base text-on-surface">Menu do Tutor</h3>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Opção Exclusiva: Painel Admin (Visível apenas para Administradores / Equipe) */}
            {hasAdminAccess && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsMoreOpen(false)}
                className="bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 p-3.5 rounded-2xl flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-on-surface group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                      <span>Painel Administrativo</span>
                      <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-amber-500/20 text-amber-300 font-extrabold uppercase">
                        Admin
                      </span>
                    </h4>
                    <p className="text-[10px] text-amber-400/80 font-medium truncate">
                      Acessar gestão do Petshop (/admin)
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-amber-400 flex items-center gap-1 shrink-0">
                  <span>Acessar</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </Link>
            )}

            {/* Notificações no Drawer */}
            <Link
              href="/client/notificacoes"
              onClick={() => setIsMoreOpen(false)}
              className="bg-elevated-card border border-hairline-border hover:border-primary/40 p-3.5 rounded-2xl flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-lg">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">Central de Notificações</h4>
                  <p className="text-[10px] text-on-surface-variant">
                    {unreadCount > 0 ? `${unreadCount} alerta(s) novo(s)` : "Ver todos os alertas e histórico"}
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <span>Abrir</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </span>
            </Link>

            {/* Links Adicionais */}
            <div className="space-y-2">
              <Link
                href="/agendar"
                onClick={() => setIsMoreOpen(false)}
                className="p-3.5 bg-primary/15 border border-primary/40 rounded-2xl text-primary font-bold flex items-center justify-between text-xs transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">calendar_month</span>
                  <span>Link de Agendamento Público</span>
                </div>
                <span className="material-symbols-outlined text-base">open_in_new</span>
              </Link>
            </div>

            {/* Sair da Conta */}
            <button
              onClick={handleLogout}
              className="w-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-all cursor-pointer text-xs"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Sair da Conta (Logout)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
