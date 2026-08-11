"use client";

import { useEffect, useState } from "react";

interface DaySchedule {
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  role_label: string;
  label: string;
  schedule: Record<number, DaySchedule>;
}

const DAYS = [
  { index: 0, short: "Dom" },
  { index: 1, short: "Seg" },
  { index: 2, short: "Ter" },
  { index: 3, short: "Qua" },
  { index: 4, short: "Qui" },
  { index: 5, short: "Sex" },
  { index: 6, short: "Sáb" },
];

const DEFAULT_DAY: DaySchedule = { start_time: "09:00", end_time: "18:00", is_active: false };

export default function EquipePage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const loadStaff = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível carregar a equipe.");
      setStaff(data.staff || []);
    } catch (err: any) {
      console.error("Erro ao carregar equipe:", err);
      setLoadError(err.message || "Erro ao carregar equipe.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const getDay = (member: StaffMember, dayIndex: number): DaySchedule => member.schedule[dayIndex] || DEFAULT_DAY;

  const saveDay = async (staffId: string, dayIndex: number, next: DaySchedule) => {
    const key = `${staffId}-${dayIndex}`;
    setSavingKey(key);
    // Atualização otimista
    setStaff((prev) =>
      prev.map((m) => (m.id === staffId ? { ...m, schedule: { ...m.schedule, [dayIndex]: next } } : m))
    );
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: staffId,
          day_of_week: dayIndex,
          start_time: next.start_time,
          end_time: next.end_time,
          is_active: next.is_active,
        }),
      });
      if (!res.ok) throw new Error("Falha ao salvar escala.");
    } catch (err) {
      console.error("Erro ao salvar escala:", err);
      alert("Não foi possível salvar essa alteração. Tente novamente.");
      await loadStaff();
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Escala da Equipe</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Defina os dias e horários em que cada profissional atende. Isso é usado para avisar quando um agendamento
          for marcado fora do turno de alguém.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
        </div>
      )}

      {!isLoading && loadError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold px-4 py-3 rounded-xl">
          {loadError}
        </div>
      )}

      {!isLoading && !loadError && staff.length === 0 && (
        <div className="bg-surface-container border border-hairline-border text-on-surface-variant text-sm px-4 py-8 rounded-2xl text-center">
          Nenhum colaborador cadastrado ainda. Crie contas de equipe em{" "}
          <span className="text-primary font-bold">Registrar Admin</span> para elas aparecerem aqui.
        </div>
      )}

      <div className="space-y-4">
        {staff.map((member) => (
          <div key={member.id} className="bg-elevated-card border border-hairline-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                {member.full_name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">{member.full_name}</p>
                <p className="text-[11px] text-on-surface-variant">{member.role_label}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {DAYS.map((day) => {
                const sched = getDay(member, day.index);
                const key = `${member.id}-${day.index}`;
                const isSaving = savingKey === key;
                return (
                  <div
                    key={day.index}
                    className={`rounded-xl border p-3 space-y-2 transition-all ${
                      sched.is_active ? "bg-primary/5 border-primary/30" : "bg-surface-container border-hairline-border"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => saveDay(member.id, day.index, { ...sched, is_active: !sched.is_active })}
                      className="w-full flex items-center justify-between cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-xs font-bold text-on-surface">{day.short}</span>
                      <span className={`material-symbols-outlined text-base ${sched.is_active ? "text-primary" : "text-on-surface-variant"}`}>
                        {sched.is_active ? "toggle_on" : "toggle_off"}
                      </span>
                    </button>
                    {sched.is_active && (
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={sched.start_time}
                          disabled={isSaving}
                          onChange={(e) => saveDay(member.id, day.index, { ...sched, start_time: e.target.value })}
                          className="w-full bg-matte-canvas border border-hairline-border rounded-lg px-1.5 py-1 text-[11px] text-on-surface outline-none focus:border-primary"
                        />
                        <span className="text-[10px] text-on-surface-variant">–</span>
                        <input
                          type="time"
                          value={sched.end_time}
                          disabled={isSaving}
                          onChange={(e) => saveDay(member.id, day.index, { ...sched, end_time: e.target.value })}
                          className="w-full bg-matte-canvas border border-hairline-border rounded-lg px-1.5 py-1 text-[11px] text-on-surface outline-none focus:border-primary"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
