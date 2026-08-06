"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ClientHeader() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("Tutor");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

          const name = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Tutor";
          const avatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

          setUserName(name);
          if (avatar) setUserAvatar(avatar);
        }
      } catch (err) {
        console.warn("Aviso ao carregar perfil em ClientHeader:", err);
      }
    }
    loadUserProfile();
  }, []);

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
    <header className="sticky top-0 z-40 bg-matte-canvas/90 backdrop-blur-md border-b border-hairline-border px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="font-headline-lg text-xl md:text-2xl font-extrabold text-on-surface">
          {details.title}
        </h1>
        <p className="font-body-base text-xs text-on-surface-variant mt-0.5">
          {details.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Icon */}
        <button className="p-2.5 rounded-xl bg-surface-container border border-hairline-border hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors relative cursor-pointer">
          <span className="material-symbols-outlined text-lg">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        </button>

        {/* Quick CTA */}
        <Link
          href="/client/agenda"
          className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl extruded-shadow hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">calendar_month</span>
          <span className="hidden sm:inline">Agendar Serviço</span>
        </Link>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-hairline-border">
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
          className="p-2.5 rounded-xl bg-surface-container border border-hairline-border hover:bg-red-500/10 hover:border-red-500/30 text-on-surface-variant hover:text-red-400 transition-colors flex items-center justify-center cursor-pointer ml-1"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
        </button>
      </div>
    </header>
  );
}
