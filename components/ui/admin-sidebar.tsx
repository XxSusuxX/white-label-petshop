"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminSidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Gestor Admin");
  const [userRole, setUserRole] = useState("Administrador");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function loadAdminProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

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
            setUserRole(profile.role === "admin" ? "Gestora Geral" : "Operadora Admin");
          }
          if (avatar) setUserAvatar(avatar);
        }
      } catch (err) {
        console.warn("Aviso ao carregar perfil em AdminSidebar:", err);
      }
    }
    loadAdminProfile();
  }, []);

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/operacao", label: "Operação Ao Vivo", icon: "bubble_chart" },
    { href: "/admin/agenda", label: "Agenda", icon: "calendar_today" },
    { href: "/admin/clientes", label: "Clientes / Tutores", icon: "group" },
    { href: "/admin/pets", label: "Pets & Prontuários", icon: "pets" },
    { href: "/admin/servicos", label: "Serviços & Preços", icon: "price_change" },
    { href: "/admin/pdv", label: "PDV & Caixa", icon: "point_of_sale" },
    { href: "/admin/prontuario", label: "Módulo Veterinário", icon: "stethoscope" },
    { href: "/admin/whatsapp", label: "Central WhatsApp", icon: "chat" },
  ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-matte-canvas border-r border-hairline-border flex-col z-50">
      <div className="p-6 border-b border-hairline-border flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center extruded-shadow">
          <span className="material-symbols-outlined text-on-primary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            pets
          </span>
        </div>
        <div>
          <span className="text-headline-md font-headline-md font-bold text-primary block leading-none">PetNexus</span>
          <span className="text-[10px] text-on-surface-variant font-label-bold uppercase tracking-widest">Gestão Admin</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-label-bold transition-all ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/30 shadow-[0_0_10px_rgba(78,222,163,0.15)]"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${isActive ? "text-primary" : "text-on-surface-variant"}`}>
                {link.icon}
              </span>
              <span className="text-body-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Profile Card no Canto Inferior Esquerdo (Conectado ao Supabase) */}
      <div className="p-4 border-t border-hairline-border">
        <div className="flex items-center gap-3 px-2.5 py-2 bg-surface-container-low rounded-xl border border-hairline-border">
          <div className="w-9 h-9 rounded-full border-2 border-primary/40 overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              userName.substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="font-label-bold text-on-surface text-xs leading-none truncate font-bold">
              {userName}
            </p>
            <p className="text-[10px] text-primary font-bold truncate mt-1">
              {userRole}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
