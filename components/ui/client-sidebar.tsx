"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ClientSidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Tutor");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("client");

  useEffect(() => {
    async function loadUserProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone, role")
          .eq("id", user.id)
          .single();

        const name = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Tutor";
        const emailOrPhone = user.email || profile?.phone || "";
        const role = profile?.role || "client";

        setUserName(name);
        setUserEmail(emailOrPhone);
        setUserRole(role);
      }
    }
    loadUserProfile();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const links = [
    { href: "/client", label: "Início", icon: "dashboard" },
    { href: "/client/pets", label: "Meus Pets", icon: "pets" },
    { href: "/client/agenda", label: "Agendar Serviço", icon: "calendar_today" },
    { href: "/client/historico", label: "Histórico", icon: "history" },
    { href: "/client/notificacoes", label: "Notificações", icon: "notifications" },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-matte-canvas border-r border-hairline-border flex-col z-50">
      {/* Brand Header */}
      <div className="p-6 border-b border-hairline-border flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center extruded-shadow">
          <span
            className="material-symbols-outlined text-on-primary-container text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            pets
          </span>
        </div>
        <div>
          <span className="text-headline-md font-headline-md font-bold text-primary block leading-none">PetNexus</span>
          <span className="text-[10px] text-on-surface-variant font-label-bold uppercase tracking-widest">Portal do Tutor</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-label-bold transition-all ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_10px_rgba(78,222,163,0.15)]"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-primary"
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl ${
                  isActive ? "text-primary" : "text-on-surface-variant"
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {link.icon}
              </span>
              <span className="text-body-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Admin Switch */}
      <div className="p-4 border-t border-hairline-border space-y-3">
        {(userRole === "admin" || userRole === "employee") && (
          <Link
            href="/admin/dashboard"
            className="w-full bg-surface-container-high border border-hairline-border text-on-surface py-2.5 rounded-xl font-label-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
            <span>Painel Admin</span>
          </Link>
        )}

        <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-hairline-border">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30 flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">{userName}</p>
            <p className="text-xs text-on-surface-variant truncate">{userEmail || "Tutor Verificado"}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair da Conta"
            className="p-1.5 text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
