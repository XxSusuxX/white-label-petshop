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
}

export function AdminBottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Carregar contagem de notificações não lidas
  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.warn("Erro ao carregar notificações no AdminBottomNav:", err);
      }
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const navLinks = [
    { href: "/admin/dashboard", label: "Início", icon: "dashboard" },
    { href: "/admin/operacao", label: "Operação", icon: "bubble_chart" },
    { href: "/admin/agenda", label: "Agenda", icon: "calendar_today" },
    { href: "/admin/clientes", label: "Clientes", icon: "group" },
  ];

  const moreLinks = [
    { href: "/admin/pdv", label: "PDV & Caixa", icon: "point_of_sale", highlight: true },
    { href: "/admin/pets", label: "Pets & Prontuários", icon: "pets" },
    { href: "/admin/servicos", label: "Serviços & Preços", icon: "price_change" },
    { href: "/admin/equipe", label: "Escala da Equipe", icon: "calendar_view_week" },
    { href: "/admin/horarios", label: "Funcionamento", icon: "schedule" },
    { href: "/admin/prontuario", label: "Módulo Vet", icon: "stethoscope" },
    { href: "/admin/financeiro", label: "Financeiro", icon: "monitoring" },
    { href: "/admin/whatsapp", label: "Central WhatsApp", icon: "chat" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 py-2 bg-matte-canvas/95 backdrop-blur-lg border-t border-hairline-border shadow-2xl md:hidden">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-h-[44px] ${
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
              <span className="text-[10px] font-label-bold mt-0.5">{link.label}</span>
            </Link>
          );
        })}

        {/* Botão MAIS */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all relative cursor-pointer min-h-[44px] ${
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
          <span className="text-[10px] font-label-bold mt-0.5">Mais</span>
        </button>
      </nav>

      {/* Modal / Drawer do Menu MAIS */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end flex-col md:hidden animate-in fade-in duration-200">
          {/* Overlay de fechar */}
          <div className="flex-1" onClick={() => setIsMoreOpen(false)} />

          {/* Conteúdo do Sheet */}
          <div
            ref={modalRef}
            className="bg-surface-container border-t border-hairline-border rounded-t-3xl p-5 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between border-b border-hairline-border pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">apps</span>
                <h3 className="font-bold text-base text-on-surface">Menu do Sistema</h3>
              </div>

              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Painel de Notificações Rápido */}
            <div className="bg-elevated-card border border-hairline-border p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center relative">
                  <span className="material-symbols-outlined text-lg">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">Notificações</h4>
                  <p className="text-[10px] text-on-surface-variant">
                    {unreadCount > 0 ? `${unreadCount} não lida(s)` : "Nenhum alerta pendente"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="text-xs font-bold text-primary hover:underline px-2 py-1 cursor-pointer"
              >
                {showNotifications ? "Ocultar" : "Ver todas"}
              </button>
            </div>

            {showNotifications && (
              <div className="bg-matte-canvas border border-hairline-border rounded-2xl p-3 max-h-48 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-3">Sem notificações no momento.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="text-xs p-2 rounded-xl bg-surface-container border border-hairline-border/40 space-y-0.5">
                      <p className="font-bold text-on-surface">{n.title}</p>
                      <p className="text-on-surface-variant text-[11px]">{n.body}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Grid de Atalhos de Ferramentas */}
            <div className="grid grid-cols-2 gap-3">
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMoreOpen(false)}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                    link.highlight
                      ? "bg-primary text-on-primary border-primary font-bold shadow-md"
                      : "bg-elevated-card border-hairline-border text-on-surface hover:border-primary/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{link.icon}</span>
                  <span className="text-xs font-label-bold">{link.label}</span>
                </Link>
              ))}
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
