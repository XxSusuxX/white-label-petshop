"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/operacao", label: "Operação Ao Vivo", icon: "bubble_chart" },
    { href: "/admin/agenda", label: "Agenda", icon: "calendar_today" },
    { href: "/admin/clientes", label: "Clientes / Tutores", icon: "group" },
    { href: "/admin/pets", label: "Pets & Prontuários", icon: "pets" },
    { href: "/admin/servicos", label: "Serviços & Preços", icon: "price_change" },
    { href: "/admin/pdv", label: "PDV & Caixa", icon: "point_of_sale" },
    { href: "/admin/prontuario", label: "Módulo Veterinário", icon: "stethoscope" },
    { href: "/admin/automacoes", label: "Zap Notifica", icon: "chat" },
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
          <span className="text-headline-md font-headline-md font-bold text-primary block leading-none">SaaS Portal</span>
          <span className="text-[10px] text-on-surface-variant font-label-bold uppercase tracking-widest">Painel Admin</span>
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

      <div className="p-4 border-t border-hairline-border">
        <div className="flex items-center gap-3 px-2 py-2 bg-surface-container-low rounded-xl border border-hairline-border">
          <div className="w-9 h-9 rounded-full border-2 border-primary/40 overflow-hidden bg-primary/20 flex items-center justify-center text-primary font-bold">
            A
          </div>
          <div className="overflow-hidden flex-1">
            <p className="font-label-bold text-on-surface text-sm leading-none truncate">Ana Silva</p>
            <p className="text-[10px] text-on-surface-variant truncate mt-0.5">Gestora Geral</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
