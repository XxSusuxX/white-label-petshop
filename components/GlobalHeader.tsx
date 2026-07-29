"use client";

import Link from "next/link";

export default function GlobalHeader() {
  return (
    <nav className="bg-background/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-50">
      <div className="flex justify-between items-center h-20 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
        <Link href="/" className="font-headline-md text-headline-md font-bold text-primary">
          SaaS Portal
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-base text-body-base" href="/#features">
            Recursos
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-base text-body-base" href="/#services">
            Serviços
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-base text-body-base" href="/#pricing">
            Planos
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-base text-body-base" href="/#rewards">
            Recompensas
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-on-surface-variant hover:text-primary transition-colors font-label-bold text-label-bold px-4 py-2"
          >
            Entrar
          </Link>
          <Link
            href="/auth/register"
            className="bg-primary-container text-on-primary-container font-label-bold text-label-bold px-6 py-2.5 rounded-lg extruded-shadow active:opacity-80 active:scale-95 transition-all"
          >
            Cadastrar
          </Link>
        </div>
      </div>
    </nav>
  );
}
