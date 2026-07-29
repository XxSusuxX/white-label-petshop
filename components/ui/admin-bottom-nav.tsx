"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe py-3 bg-surface-container-low dark:bg-surface-container-low border-t border-hairline-border shadow-lg rounded-t-xl md:hidden">
      <Link className="flex flex-col items-center justify-center bg-primary-container/20 text-primary rounded-xl px-3 py-1 scale-95 transition-transform" href="/admin/dashboard">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
        <span className="font-label-bold text-label-bold">Dashboard</span>
      </Link>
      <Link className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all" href="/admin/pets">
        <span className="material-symbols-outlined">pets</span>
        <span className="font-label-muted text-label-muted">Pets</span>
      </Link>
      <Link className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all" href="/admin/clientes">
        <span className="material-symbols-outlined">group</span>
        <span className="font-label-muted text-label-muted">Clients</span>
      </Link>
      <Link className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all" href="/admin/configuracoes">
        <span className="material-symbols-outlined">settings</span>
        <span className="font-label-muted text-label-muted">Settings</span>
      </Link>
    </nav>
  );
}
