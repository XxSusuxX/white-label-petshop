"use client";

import { useEffect, useState } from "react";

interface DayHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  slot_interval_minutes: number;
}

interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string;
}

const DAY_LABELS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export default function HorariosPage() {
  const [hours, setHours] = useState<DayHours[]>([]);
  const [isLoadingHours, setIsLoadingHours] = useState(true);
  const [savingDay, setSavingDay] = useState<number | null>(null);

  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(true);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");
  const [isAddingBlocked, setIsAddingBlocked] = useState(false);

  const loadHours = async () => {
    setIsLoadingHours(true);
    try {
      const res = await fetch("/api/admin/business-hours");
      const data = await res.json();
      if (res.ok) setHours((data.hours || []).sort((a: DayHours, b: DayHours) => a.day_of_week - b.day_of_week));
    } catch (err) {
      console.error("Erro ao carregar horário de funcionamento:", err);
    } finally {
      setIsLoadingHours(false);
    }
  };

  const loadBlockedDates = async () => {
    setIsLoadingBlocked(true);
    try {
      const res = await fetch("/api/admin/blocked-dates");
      const data = await res.json();
      if (res.ok) setBlockedDates(data.dates || []);
    } catch (err) {
      console.error("Erro ao carregar datas bloqueadas:", err);
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  useEffect(() => {
    loadHours();
    loadBlockedDates();
  }, []);

  const updateDay = async (day: DayHours) => {
    setSavingDay(day.day_of_week);
    setHours((prev) => prev.map((d) => (d.day_of_week === day.day_of_week ? day : d)));
    try {
      const res = await fetch("/api/admin/business-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(day),
      });
      if (!res.ok) throw new Error("Falha ao salvar.");
    } catch (err) {
      console.error("Erro ao salvar horário:", err);
      alert("Não foi possível salvar esse horário. Tente novamente.");
      await loadHours();
    } finally {
      setSavingDay(null);
    }
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate) {
      alert("Selecione uma data.");
      return;
    }
    setIsAddingBlocked(true);
    try {
      const res = await fetch("/api/admin/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked_date: newBlockedDate, reason: newBlockedReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao bloquear data.");
      setNewBlockedDate("");
      setNewBlockedReason("");
      await loadBlockedDates();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAddingBlocked(false);
    }
  };

  const handleRemoveBlockedDate = async (id: string) => {
    if (!confirm("Remover esse bloqueio de data?")) return;
    setBlockedDates((prev) => prev.filter((d) => d.id !== id));
    try {
      const res = await fetch(`/api/admin/blocked-dates?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      alert("Não foi possível remover. Tente novamente.");
      await loadBlockedDates();
    }
  };

  return (
    <main className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Horário de Funcionamento</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Define os horários que os tutores podem escolher ao agendar, e os dias em que o petshop está fechado.
        </p>
      </div>

      {/* Horário semanal */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-on-surface">Horário Semanal</h2>
        {isLoadingHours ? (
          <div className="flex items-center justify-center py-10">
            <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
          </div>
        ) : (
          <div className="space-y-2">
            {hours.map((day) => (
              <div
                key={day.day_of_week}
                className={`bg-elevated-card border rounded-xl p-4 flex flex-wrap items-center gap-3 transition-all ${
                  day.is_closed ? "border-hairline-border opacity-70" : "border-hairline-border"
                }`}
              >
                <button
                  type="button"
                  disabled={savingDay === day.day_of_week}
                  onClick={() => updateDay({ ...day, is_closed: !day.is_closed })}
                  className="flex items-center gap-2 w-40 flex-shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-lg ${day.is_closed ? "text-on-surface-variant" : "text-primary"}`}>
                    {day.is_closed ? "toggle_off" : "toggle_on"}
                  </span>
                  <span className="text-sm font-bold text-on-surface">{DAY_LABELS[day.day_of_week]}</span>
                </button>

                {day.is_closed ? (
                  <span className="text-xs text-on-surface-variant">Fechado</span>
                ) : (
                  <>
                    <input
                      type="time"
                      value={day.open_time}
                      disabled={savingDay === day.day_of_week}
                      onChange={(e) => updateDay({ ...day, open_time: e.target.value })}
                      className="bg-matte-canvas border border-hairline-border rounded-lg px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                    />
                    <span className="text-xs text-on-surface-variant">até</span>
                    <input
                      type="time"
                      value={day.close_time}
                      disabled={savingDay === day.day_of_week}
                      onChange={(e) => updateDay({ ...day, close_time: e.target.value })}
                      className="bg-matte-canvas border border-hairline-border rounded-lg px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                    />
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[11px] text-on-surface-variant">Intervalo</span>
                      <select
                        value={day.slot_interval_minutes}
                        disabled={savingDay === day.day_of_week}
                        onChange={(e) => updateDay({ ...day, slot_interval_minutes: Number(e.target.value) })}
                        className="bg-matte-canvas border border-hairline-border rounded-lg px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary cursor-pointer"
                      >
                        <option value={30}>30 min</option>
                        <option value={60}>1h</option>
                        <option value={90}>1h30</option>
                        <option value={120}>2h</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Datas bloqueadas */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-on-surface">Feriados & Fechamentos Pontuais</h2>
        <div className="bg-elevated-card border border-hairline-border rounded-xl p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Data</label>
            <input
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              className="bg-matte-canvas border border-hairline-border rounded-lg px-2.5 py-2 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Motivo (opcional)</label>
            <input
              type="text"
              value={newBlockedReason}
              onChange={(e) => setNewBlockedReason(e.target.value)}
              placeholder="Ex: Feriado de Natal"
              className="w-full bg-matte-canvas border border-hairline-border rounded-lg px-2.5 py-2 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={handleAddBlockedDate}
            disabled={isAddingBlocked}
            className="bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-lg extruded-shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Bloquear
          </button>
        </div>

        {isLoadingBlocked ? (
          <div className="flex items-center justify-center py-8">
            <span className="material-symbols-outlined text-2xl animate-spin text-primary">sync</span>
          </div>
        ) : blockedDates.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-6">Nenhuma data bloqueada.</p>
        ) : (
          <div className="space-y-2">
            {blockedDates.map((d) => (
              <div key={d.id} className="bg-elevated-card border border-hairline-border rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-on-surface">
                    {new Date(`${d.blocked_date}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                  {d.reason && <p className="text-[11px] text-on-surface-variant">{d.reason}</p>}
                </div>
                <button
                  onClick={() => handleRemoveBlockedDate(d.id)}
                  className="text-on-surface-variant hover:text-red-400 p-1.5 rounded-lg cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
