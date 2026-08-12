"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Pet {
  id: string;
  name: string;
  breed?: string;
  species?: string;
  photo_url?: string | null;
  weight?: number | null;
  observations?: string | null;
}

interface AppointmentItem {
  id: string;
  pet_id: string;
  pet_name: string;
  pet_breed: string;
  pet_photo: string | null;
  service_type: string;
  status: "agendado" | "confirmado" | "em_atendimento" | "pronto" | "em_rota" | "concluido" | "cancelado";
  professional?: string;
  price: number;
  scheduled_at: string;
  notes?: string;
  address?: string;
}

interface ClientPackage {
  id: string;
  package_name: string;
  total_credits: number;
  used_credits: number;
  expires_at: string | null;
  status: string;
}

interface TimelineStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  status: "completed" | "current" | "pending";
}

const STATUS_LABEL: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "EM ANDAMENTO",
  pronto: "PRONTO PARA BUSCA",
  em_rota: "SAINDO PARA ENTREGA",
  concluido: "CONCLUÍDO",
  cancelado: "CANCELADO",
};

const STATUS_STYLE: Record<string, string> = {
  agendado: "bg-primary/10 border-primary/30 text-primary",
  confirmado: "bg-primary/10 border-primary/30 text-primary",
  em_atendimento: "bg-amber-500/15 border-amber-500/40 text-amber-400 animate-pulse",
  pronto: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
  em_rota: "bg-sky-500/15 border-sky-500/40 text-sky-400",
  concluido: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  cancelado: "bg-rose-500/10 border-rose-500/30 text-rose-400",
};

// Divisão de serviços compostos (ex: Banho + Tosa)
const parseServiceSteps = (serviceName: string): string[] => {
  if (!serviceName) return ["Atendimento"];
  let parts: string[] = [];
  if (serviceName.includes("+")) {
    parts = serviceName.split("+").map((s) => s.trim());
  } else if (serviceName.includes("&")) {
    parts = serviceName.split("&").map((s) => s.trim());
  } else if (/\b e \b/i.test(serviceName)) {
    parts = serviceName.split(/\b e \b/i).map((s) => s.trim());
  } else {
    parts = [serviceName.trim()];
  }
  const filtered = parts.filter(Boolean);
  return filtered.length > 0 ? filtered : [serviceName];
};

export default function ClientHomePage() {
  const [userName, setUserName] = useState("Tutor");
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedCam, setSelectedCam] = useState("Câmera 01 - Estética & Tosa");
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  const loadDashboard = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        const name =
          profile?.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Tutor";
        setUserName(name);

        const [petsRes, apptRes, pkgRes] = await Promise.all([
          fetch("/api/pets"),
          fetch("/api/appointments"),
          fetch("/api/client-packages"),
        ]);

        const petsData = await petsRes.json();
        const apptData = await apptRes.json();
        const pkgData = await pkgRes.json();

        if (petsData.pets) setUserPets(petsData.pets);
        if (apptData.appointments) setAppointments(apptData.appointments);
        if (pkgData.packages)
          setPackages(pkgData.packages.filter((p: ClientPackage) => p.status === "ativo"));
      }
    } catch (err) {
      console.warn("Aviso ao carregar dashboard do cliente:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    // Supabase Realtime Subscription para atualizações instantâneas
    const supabase = createClient();
    const channel = supabase
      .channel("realtime-client-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          loadDashboard();
        }
      )
      .subscribe();

    // Polling a cada 5s de fallback
    const interval = setInterval(() => {
      loadDashboard();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Relógio do Modal da Câmera
  useEffect(() => {
    const clockInterval = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString("pt-BR"));
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Identificar o atendimento ativo ou mais próximo
  const activeAppointment = useMemo(() => {
    if (!appointments || appointments.length === 0) return null;

    // Prioridade 1: Atendimento em andamento, pronto ou em rota
    const inProgress = appointments.find((a) =>
      ["em_atendimento", "pronto", "em_rota"].includes(a.status)
    );
    if (inProgress) return inProgress;

    // Prioridade 2: Próximo agendado/confirmado no futuro
    const upcoming = appointments
      .filter((a) => ["agendado", "confirmado"].includes(a.status))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];

    return upcoming || appointments[0];
  }, [appointments]);

  // Pet associado ao atendimento ativo
  const activePet = useMemo(() => {
    if (!activeAppointment) return userPets[0] || null;
    return userPets.find((p) => p.id === activeAppointment.pet_id) || null;
  }, [activeAppointment, userPets]);

  // Extrair o índice da sub-etapa atual a partir das notas da esteira do admin [STEP:X]
  const currentStepIndex = useMemo(() => {
    if (!activeAppointment?.notes) return 0;
    const match = activeAppointment.notes.match(/\[STEP:(\d+)\]/);
    return match ? parseInt(match[1], 10) : 0;
  }, [activeAppointment]);

  // Construir as etapas dinâmicas da Timeline baseadas no status e no serviço
  const timelineSteps = useMemo<TimelineStep[]>(() => {
    if (!activeAppointment) return [];

    const serviceSubSteps = parseServiceSteps(activeAppointment.service_type);
    const apptStatus = activeAppointment.status;
    const scheduledDate = new Date(activeAppointment.scheduled_at);
    const timeStr = scheduledDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const steps: TimelineStep[] = [];

    // Etapa 1: Coletado / Check-in
    const isCheckinDone = ["em_atendimento", "pronto", "em_rota", "concluido"].includes(apptStatus);
    steps.push({
      id: "checkin",
      title: "Coletado",
      subtitle: isCheckinDone
        ? `Check-in realizado às ${timeStr}`
        : `Horário agendado para às ${timeStr}`,
      icon: "check_circle",
      status: isCheckinDone ? "completed" : apptStatus === "confirmado" ? "current" : "pending",
    });

    // Etapas do Serviço (ex: Banho, Tosa)
    serviceSubSteps.forEach((stepName, idx) => {
      let stepStatus: "completed" | "current" | "pending" = "pending";
      let stepSubtitle = "Aguardando etapa anterior";

      if (["pronto", "em_rota", "concluido"].includes(apptStatus)) {
        stepStatus = "completed";
        stepSubtitle = "Etapa concluída com sucesso";
      } else if (apptStatus === "em_atendimento") {
        if (idx < currentStepIndex) {
          stepStatus = "completed";
          stepSubtitle = "Finalizado com sucesso";
        } else if (idx === currentStepIndex) {
          stepStatus = "current";
          stepSubtitle = `Iniciado às ${timeStr} (${stepName})`;
        } else {
          stepStatus = "pending";
          stepSubtitle = "Aguardando início";
        }
      }

      steps.push({
        id: `service_${idx}`,
        title: `${stepName} ${stepStatus === "completed" ? "Finalizado" : ""}`.trim(),
        subtitle: stepSubtitle,
        icon: stepName.toLowerCase().includes("tosa") ? "content_cut" : "water_drop",
        status: stepStatus,
      });
    });

    // Etapa 4: Finalizado / Pronto para busca
    const isFinishedDone = ["em_rota", "concluido"].includes(apptStatus);
    const isFinishedCurrent = apptStatus === "pronto";
    steps.push({
      id: "finalizado",
      title: "Finalizado",
      subtitle: isFinishedDone
        ? "Inspeção final concluída"
        : isFinishedCurrent
        ? "Aguardando retirada ou início de entrega"
        : "Aguardando inspeção final",
      icon: "verified",
      status: isFinishedDone ? "completed" : isFinishedCurrent ? "current" : "pending",
    });

    // Etapa 5: Saindo para entrega / Concluído
    const isDeliveryDone = apptStatus === "concluido";
    const isDeliveryCurrent = apptStatus === "em_rota";
    steps.push({
      id: "entrega",
      title: apptStatus === "concluido" ? "Entregue ao Tutor" : "Saindo para entrega",
      subtitle: isDeliveryDone
        ? "Entregue com sucesso"
        : isDeliveryCurrent
        ? "Motorista a caminho"
        : "Motorista a atribuir",
      icon: "local_shipping",
      status: isDeliveryDone ? "completed" : isDeliveryCurrent ? "current" : "pending",
    });

    return steps;
  }, [activeAppointment, currentStepIndex]);

  // Cálculo da barra de progresso do serviço
  const { completedCount, totalStepsCount, progressPercentage } = useMemo(() => {
    if (!timelineSteps.length)
      return { completedCount: 0, totalStepsCount: 0, progressPercentage: 0 };
    const total = timelineSteps.length;
    const completed = timelineSteps.filter((s) => s.status === "completed").length;
    const hasCurrent = timelineSteps.some((s) => s.status === "current");
    const currentFraction = hasCurrent ? 0.5 : 0;
    const effectiveCompleted = completed + currentFraction;
    const percentage = Math.min(100, Math.round((effectiveCompleted / total) * 100));

    return {
      completedCount: completed + (hasCurrent ? 1 : 0),
      totalStepsCount: total,
      progressPercentage: percentage,
    };
  }, [timelineSteps]);

  // Formatação do tempo estimado de término
  const estimatedEndTimeStr = useMemo(() => {
    if (!activeAppointment) return "17:00";
    const date = new Date(activeAppointment.scheduled_at);
    date.setMinutes(date.getMinutes() + 90); // +1h30m estimado
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }, [activeAppointment]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-on-surface-variant flex flex-col items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-3">sync</span>
        <p className="font-bold text-sm">Carregando status em tempo real...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* GRID PRINCIPAL: 2 COLUNAS NO DESKTOP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUNA ESQUERDA (PRINCIPAL - 2 COLUNAS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* CARD 1: BOAS-VINDAS + BOTÕES DE AÇÃO (OCULTO NO MOBILE) */}
          <div className="hidden sm:flex bg-surface-container border border-hairline-border rounded-2xl p-6 extruded-shadow relative overflow-hidden flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-4 max-w-md">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                Olá, {userName}! 👋
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {activePet
                  ? `O ${activePet.name} está se sentindo incrível hoje. Confira o status do atendimento dele em tempo real abaixo.`
                  : "Acompanhe seus pets e agendamentos em tempo real."}
              </p>

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="https://wa.me/5511999999999?text=Ol%C3%A1,%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20o%20meu%20atendimento"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary text-on-primary font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">chat</span>
                  WhatsApp
                </a>
                <a
                  href="tel:11999999999"
                  className="border border-hairline-border hover:bg-surface-container-high text-on-surface font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">call</span>
                  Ligar para Unidade
                </a>
              </div>
            </div>

            {/* Imagem / Avatar em Destaque no Card */}
            <div className="shrink-0 relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg relative bg-matte-canvas">
                <img
                  src={
                    activePet?.photo_url ||
                    activeAppointment?.pet_photo ||
                    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80"
                  }
                  alt={activePet?.name || "Pet"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* CARD 2: DETALHES DO ATENDIMENTO EM ANDAMENTO */}
          {activeAppointment ? (
            <div className="bg-surface-container border border-hairline-border rounded-2xl p-6 extruded-shadow space-y-6">
              {/* Topo: Foto do Pet, Nome, Serviço e Badge de Status */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-hairline-border pb-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={
                        activeAppointment.pet_photo ||
                        activePet?.photo_url ||
                        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80"
                      }
                      alt={activeAppointment.pet_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-md"
                    />
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-surface-container rounded-full"></span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                      {activeAppointment.pet_name}
                    </h2>
                    <p className="text-xs font-semibold text-on-surface-variant">
                      {activeAppointment.pet_breed} • {activeAppointment.service_type}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase px-3 py-1.5 rounded-full border shadow-sm ${
                      STATUS_STYLE[activeAppointment.status] || "bg-primary/10 border-primary/30 text-primary"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-ping"></span>
                    {STATUS_LABEL[activeAppointment.status] || activeAppointment.status}
                  </span>
                  <p className="text-[11px] text-outline mt-1 font-mono">
                    Término previsto: <span className="text-on-surface font-bold">{estimatedEndTimeStr}</span>
                  </p>
                </div>
              </div>

              {/* Barra de Progresso do Serviço */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-on-surface-variant uppercase tracking-wider text-[11px]">
                    Progresso do Serviço
                  </span>
                  <span className="text-primary font-mono">
                    {completedCount} / {totalStepsCount} Etapas
                  </span>
                </div>
                <div className="w-full bg-matte-canvas h-2.5 rounded-full overflow-hidden border border-hairline-border p-0.5">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(78,222,163,0.6)]"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Grid de 4 Métricas / Informações na Base */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-surface-container-high border border-hairline-border rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-outline block">
                    Unidade
                  </span>
                  <span className="text-xs font-bold text-on-surface truncate block">
                    Jardins SP
                  </span>
                </div>

                <div className="bg-surface-container-high border border-hairline-border rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-outline block">
                    Profissional
                  </span>
                  <span className="text-xs font-bold text-on-surface truncate block">
                    {activeAppointment.professional || "Ricardo M."}
                  </span>
                </div>

                <div className="bg-surface-container-high border border-hairline-border rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-outline block">
                    Peso
                  </span>
                  <span className="text-xs font-bold text-on-surface truncate block">
                    {activePet?.weight ? `${activePet.weight} kg` : "32.4 kg"}
                  </span>
                </div>

                <div className="bg-surface-container-high border border-hairline-border rounded-xl p-3.5 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-outline block">
                    Saúde
                  </span>
                  <span className="text-xs font-bold text-primary truncate block flex items-center gap-1">
                    <span className="text-xs">💚</span> Excelente
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container border border-hairline-border rounded-2xl p-8 text-center space-y-4 extruded-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-3xl">event_available</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-base">Nenhum atendimento em andamento</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  Agende um banho ou tosa para o seu pet e acompanhe a esteira ao vivo.
                </p>
              </div>
              <Link
                href="/client/agenda"
                className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold text-xs px-6 py-3 rounded-xl hover:brightness-110 transition-all shadow-md"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Agendar Novo Serviço
              </Link>
            </div>
          )}

          {/* MEUS PACOTES (SE HOUVER) */}
          {packages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">loyalty</span>
                Meus Pacotes Ativos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {packages.map((pkg) => {
                  const remaining = pkg.total_credits - pkg.used_credits;
                  return (
                    <div
                      key={pkg.id}
                      className="bg-surface-container border border-primary/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-primary/60 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined">loyalty</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-on-surface truncate">{pkg.package_name}</p>
                          <p className="text-[11px] text-on-surface-variant">
                            {remaining} de {pkg.total_credits} restantes
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-extrabold text-primary shrink-0 font-mono">
                        {remaining}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AÇÕES RÁPIDAS & NAVEGAÇÃO */}
          <div className="grid grid-cols-3 gap-3">
            <Link
              href="/client/agenda"
              className="bg-surface-container border border-hairline-border rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:border-primary/50 hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
              <span className="text-xs font-bold text-on-surface">Agendar</span>
            </Link>
            <Link
              href="/client/pets"
              className="bg-surface-container border border-hairline-border rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:border-primary/50 hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-primary text-2xl">pets</span>
              <span className="text-xs font-bold text-on-surface">Meus Pets</span>
            </Link>
            <Link
              href="/client/historico"
              className="bg-surface-container border border-hairline-border rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:border-primary/50 hover:bg-surface-container-high transition-all"
            >
              <span className="material-symbols-outlined text-primary text-2xl">history</span>
              <span className="text-xs font-bold text-on-surface">Histórico</span>
            </Link>
          </div>
        </div>

        {/* COLUNA DIREITA (TIMELINE E CÂMERA - 1 COLUNA) */}
        <div className="lg:col-span-1 space-y-6">
          {/* CARD DA TIMELINE EM TEMPO REAL */}
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-6 extruded-shadow space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface tracking-tight">Timeline</h2>
              <Link
                href="/client/historico"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                Ver Histórico
              </Link>
            </div>

            {/* LISTA VERTICAL DA TIMELINE */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-hairline-border">
              {timelineSteps.length > 0 ? (
                timelineSteps.map((step) => {
                  const isCompleted = step.status === "completed";
                  const isCurrent = step.status === "current";

                  return (
                    <div key={step.id} className="relative flex items-start justify-between gap-3 group">
                      {/* Ícone Indicador do Nó da Linha do Tempo */}
                      <span
                        className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                          isCompleted
                            ? "bg-emerald-500 text-on-primary border border-emerald-400"
                            : isCurrent
                            ? "bg-amber-500 text-on-primary border-2 border-amber-400 animate-pulse ring-4 ring-amber-500/20"
                            : "bg-surface-container-high text-on-surface-variant/50 border border-hairline-border"
                        }`}
                      >
                        {isCompleted ? (
                          <span className="material-symbols-outlined text-xs">check</span>
                        ) : isCurrent ? (
                          <span className="material-symbols-outlined text-xs">{step.icon}</span>
                        ) : (
                          <span className="material-symbols-outlined text-xs">{step.icon}</span>
                        )}
                      </span>

                      {/* Textos da Etapa */}
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <h4
                          className={`text-xs font-bold transition-colors ${
                            isCompleted || isCurrent ? "text-on-surface" : "text-on-surface-variant/60"
                          }`}
                        >
                          {step.title}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant/80 truncate">
                          {step.subtitle}
                        </p>
                      </div>

                      {/* Badge Lateral (OK / ATUAL) */}
                      {isCompleted && (
                        <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded shrink-0">
                          OK
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded shrink-0 animate-pulse">
                          ATUAL
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-on-surface-variant text-center py-4">
                  Nenhuma etapa em andamento no momento.
                </p>
              )}
            </div>

            {/* BOTÃO DA CÂMERA AO VIVO */}
            <button
              onClick={() => setIsCameraOpen(true)}
              className="w-full py-3.5 bg-surface-container-high border border-primary/30 hover:border-primary text-primary font-bold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-md hover:brightness-110 active:scale-95 group"
            >
              <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                videocam
              </span>
              Ver Câmera ao Vivo
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CÂMERA AO VIVO (SIMULAÇÃO DE TRANSMISSÃO) */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container border border-hairline-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-4 p-5">
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b border-hairline-border pb-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                <div>
                  <h3 className="font-bold text-on-surface text-base flex items-center gap-2">
                    Transmissão Ao Vivo
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 font-extrabold uppercase px-2 py-0.5 rounded border border-rose-500/30">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    {activePet?.name ? `Acompanhando ${activePet.name}` : "Estética & Banho"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCameraOpen(false)}
                className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Container do Player da Câmera */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-hairline-border group">
              {/* Overlay de Água da Câmera */}
              <img
                src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1000&q=80"
                alt="Transmissão Pet"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>

              {/* Informações da Transmissão (Overlay) */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-white">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                REC • {currentTimeStr}
              </div>

              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-primary font-bold">
                {selectedCam}
              </div>

              <div className="absolute bottom-3 left-3 text-white text-xs font-bold drop-shadow-md">
                Unidade Jardins SP — Baia 02
              </div>
            </div>

            {/* Seletor de Câmeras */}
            <div className="flex items-center gap-2 overflow-x-auto pt-2">
              {["Câmera 01 - Estética & Tosa", "Câmera 02 - Banho", "Câmera 03 - Recreação"].map((cam) => (
                <button
                  key={cam}
                  onClick={() => setSelectedCam(cam)}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
                    selectedCam === cam
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container-high border-hairline-border text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {cam}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
