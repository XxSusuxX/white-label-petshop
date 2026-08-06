"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Pet {
  id: string;
  name: string;
  breed?: string;
  species?: string;
  photo_url?: string | null;
}

interface AppointmentItem {
  id: string;
  pet_id: string;
  pet_name: string;
  pet_breed: string;
  pet_photo: string | null;
  service_type: string;
  status: string;
  price: number;
  scheduled_at: string;
  address: string;
}

const STATUS_LABEL: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em Atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const STATUS_STYLE: Record<string, string> = {
  agendado: "bg-primary/10 border-primary/30 text-primary",
  confirmado: "bg-primary/10 border-primary/30 text-primary",
  em_atendimento: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  concluido: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  cancelado: "bg-rose-500/10 border-rose-500/30 text-rose-400",
};

export default function ClientHomePage() {
  const [userName, setUserName] = useState("Tutor");
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        const name = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Tutor";
        setUserName(name);

        const [petsRes, apptRes] = await Promise.all([fetch("/api/pets"), fetch("/api/appointments")]);
        const petsData = await petsRes.json();
        const apptData = await apptRes.json();

        if (petsData.pets) setUserPets(petsData.pets);
        if (apptData.appointments) setAppointments(apptData.appointments);
      }
    } catch (err) {
      console.warn("Aviso ao carregar dashboard do cliente:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const now = new Date();
  const nextAppointment = appointments
    .filter((a) => (a.status === "agendado" || a.status === "confirmado" || a.status === "em_atendimento") && new Date(a.scheduled_at) >= now)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];

  const recentAppointments = appointments
    .filter((a) => a.id !== nextAppointment?.id)
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    .slice(0, 3);

  const handleCancelNext = async () => {
    if (!nextAppointment) return;
    if (!confirm("Cancelar este agendamento?")) return;
    setIsCancelling(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: nextAppointment.id, status: "cancelado" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Não foi possível cancelar.");
      }
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || "Não foi possível cancelar o agendamento.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">sync</span>
        <p className="font-bold">Carregando seu painel...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Boas-vindas */}
      <section>
        <h2 className="text-2xl font-bold text-on-surface">Olá, {userName}! 👋</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          {userPets.length > 0
            ? `Você tem ${userPets.length} pet${userPets.length > 1 ? "s" : ""} cadastrado${userPets.length > 1 ? "s" : ""}.`
            : "Cadastre seu pet para começar a agendar serviços."}
        </p>
      </section>

      {/* Próximo Agendamento */}
      <section>
        {nextAppointment ? (
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5 extruded-shadow space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">event_upcoming</span>
                Próximo Agendamento
              </span>
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${STATUS_STYLE[nextAppointment.status] || ""}`}>
                {STATUS_LABEL[nextAppointment.status] || nextAppointment.status}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={nextAppointment.pet_photo || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80"}
                alt={nextAppointment.pet_name}
                className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
              />
              <div className="min-w-0">
                <h3 className="font-bold text-on-surface truncate">{nextAppointment.pet_name}</h3>
                <p className="text-sm text-on-surface-variant truncate">{nextAppointment.service_type}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-surface-container-lowest border border-hairline-border rounded-xl p-3">
                <span className="text-[10px] font-bold text-outline uppercase block">Data e Hora</span>
                <span className="font-bold text-on-surface">
                  {new Date(nextAppointment.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              <div className="bg-surface-container-lowest border border-hairline-border rounded-xl p-3">
                <span className="text-[10px] font-bold text-outline uppercase block">Valor</span>
                <span className="font-bold text-primary">R$ {Number(nextAppointment.price).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCancelNext}
              disabled={isCancelling}
              className="w-full py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl hover:bg-rose-500/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {isCancelling ? "Cancelando..." : "Cancelar Agendamento"}
            </button>
          </div>
        ) : (
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 text-center space-y-3 extruded-shadow">
            <span className="material-symbols-outlined text-primary text-3xl">event_available</span>
            <p className="font-bold text-on-surface text-sm">Nenhum agendamento futuro</p>
            <Link
              href="/client/agenda"
              className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold text-xs px-5 py-3 rounded-xl hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Agendar Serviço
            </Link>
          </div>
        )}
      </section>

      {/* Ações Rápidas */}
      <section className="grid grid-cols-3 gap-3">
        <Link href="/client/agenda" className="bg-surface-container border border-hairline-border rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:border-primary/40 transition-all">
          <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
          <span className="text-xs font-bold text-on-surface">Agendar</span>
        </Link>
        <Link href="/client/pets" className="bg-surface-container border border-hairline-border rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:border-primary/40 transition-all">
          <span className="material-symbols-outlined text-primary text-2xl">pets</span>
          <span className="text-xs font-bold text-on-surface">Meus Pets</span>
        </Link>
        <Link href="/client/historico" className="bg-surface-container border border-hairline-border rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:border-primary/40 transition-all">
          <span className="material-symbols-outlined text-primary text-2xl">history</span>
          <span className="text-xs font-bold text-on-surface">Histórico</span>
        </Link>
      </section>

      {/* Agendamentos Recentes */}
      {recentAppointments.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface">Agendamentos Recentes</h3>
            <Link href="/client/historico" className="text-xs font-bold text-primary hover:underline">Ver tudo</Link>
          </div>
          <div className="space-y-2">
            {recentAppointments.map((a) => (
              <div key={a.id} className="bg-surface-container border border-hairline-border rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{a.pet_name} • {a.service_type}</p>
                  <p className="text-[11px] text-on-surface-variant">
                    {new Date(a.scheduled_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border shrink-0 ${STATUS_STYLE[a.status] || ""}`}>
                  {STATUS_LABEL[a.status] || a.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Meus Pets */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-on-surface">Meus Pets</h3>
          <Link href="/client/pets" className="text-xs font-bold text-primary hover:underline">Gerenciar</Link>
        </div>

        {userPets.length === 0 ? (
          <div className="bg-surface-container border border-hairline-border rounded-2xl p-6 text-center space-y-3">
            <span className="material-symbols-outlined text-primary text-3xl">pets</span>
            <p className="text-sm font-bold text-on-surface">Nenhum pet cadastrado</p>
            <Link
              href="/client/pets"
              className="inline-flex items-center gap-2 bg-primary text-on-primary font-bold text-xs px-5 py-3 rounded-xl hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Cadastrar Meu Pet
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {userPets.map((pet) => (
              <Link
                key={pet.id}
                href="/client/pets"
                className="min-w-[92px] bg-surface-container border border-hairline-border rounded-2xl p-3 flex flex-col items-center gap-2 hover:border-primary/40 transition-all"
              >
                <img
                  src={pet.photo_url || (pet.species === "Gato"
                    ? "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=80"
                    : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80")}
                  alt={pet.name}
                  className="w-12 h-12 rounded-full object-cover border border-primary/30"
                />
                <span className="text-xs font-bold text-on-surface truncate max-w-full">{pet.name}</span>
              </Link>
            ))}
            <Link
              href="/client/pets?add=true"
              className="min-w-[92px] bg-surface-container border border-dashed border-hairline-border rounded-2xl p-3 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:text-primary hover:border-primary transition-all"
            >
              <span className="material-symbols-outlined">add</span>
              <span className="text-[11px] font-bold">Adicionar</span>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
