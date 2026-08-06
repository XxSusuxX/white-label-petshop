"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminHeader() {
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
            setUserRole(profile.role === "admin" ? "Administrador" : profile.role);
          }
          if (avatar) setUserAvatar(avatar);
        }
      } catch (err) {
        console.warn("Aviso ao carregar perfil em AdminHeader:", err);
      }
    }
    loadAdminProfile();
  }, []);

  const getPageDetails = () => {
    switch (pathname) {
      case "/admin/operacao":
        return {
          title: "Operação Ao Vivo",
          subtitle: "Acompanhe os pets em atendimento no Kanban em tempo real",
        };
      case "/admin/agenda":
        return {
          title: "Agenda de Agendamentos",
          subtitle: "Gerencie horários, profissionais e agendamentos gerais",
        };
      case "/admin/clientes":
        return {
          title: "Clientes / Tutores",
          subtitle: "Base de clientes ativos e contatos do WhatsApp",
        };
      case "/admin/pets":
        return {
          title: "Pets & Prontuários",
          subtitle: "Fichas médicas, histórico de vacinas e raças dos pets",
        };
      case "/admin/servicos":
        return {
          title: "Serviços & Preços",
          subtitle: "Tabela de preços, duração e catálogo de serviços",
        };
      case "/admin/pdv":
        return {
          title: "Frente de Caixa (PDV)",
          subtitle: "Vendas no balcão, lançamento de pacotes e recebimentos",
        };
      case "/admin/prontuario":
        return {
          title: "Módulo Veterinário",
          subtitle: "Fichas clínicas completas, prescrições e vacinas",
        };
      case "/admin/whatsapp":
      case "/admin/automacoes":
        return {
          title: "Zap Notifica / Central do WhatsApp",
          subtitle: "Gerenciamento da conexão, automações de mensagens e lembretes",
        };
      case "/admin/dashboard":
      default:
        return {
          title: "Painel de Gestão SaaS",
          subtitle: "Visão geral da operação, faturamento e agendamentos do petshop",
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
      {/* Título e Subtítulo da Página Admin */}
      <div>
        <h1 className="font-headline-lg text-xl md:text-2xl font-extrabold text-on-surface flex items-center gap-2">
          {details.title}
        </h1>
        <p className="font-body-base text-xs text-on-surface-variant mt-0.5">
          {details.subtitle}
        </p>
      </div>

      {/* Ações e Badge do Usuário Admin */}
      <div className="flex items-center gap-3">
        {/* Ícone de Notificações */}
        <button
          title="Notificações do Sistema"
          className="p-2.5 rounded-xl bg-surface-container border border-hairline-border hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors relative cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        </button>

        {/* CTA Rápido: Abrir PDV */}
        <Link
          href="/admin/pdv"
          className="px-4 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl extruded-shadow hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">point_of_sale</span>
          <span className="hidden sm:inline">Abrir PDV</span>
        </Link>

        {/* User Badge Admin com Dropdown/Logout */}
        <div className="flex items-center gap-2 pl-3 border-l border-hairline-border">
          <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 overflow-hidden flex items-center justify-center">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-bold text-xs">
                {userName.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden lg:block text-left">
            <div className="font-label-bold text-xs text-on-surface line-clamp-1">
              {userName}
            </div>
            <div className="text-[10px] text-primary font-bold">
              {userRole}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sair da Conta Admin"
            className="p-2 text-on-surface-variant hover:text-rose-400 hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer ml-1"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
