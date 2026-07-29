"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ClientBottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/client", label: "Início", icon: "home" },
    { href: "/client/pets", label: "Pets", icon: "pets" },
    { href: "/client/agenda", label: "Agendar", icon: "calendar_today" },
    { href: "/client/historico", label: "Histórico", icon: "history" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-matte-canvas/95 backdrop-blur-lg border-t border-hairline-border px-4 py-2 flex items-center justify-around md:hidden shadow-lg">
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
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
    </nav>
  );
}
