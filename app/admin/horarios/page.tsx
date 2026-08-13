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
    <main className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline-border pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-on-surface">Horário de Funcionamento</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Configure a jornada de trabalho semanal e os dias em que o petshop está fechado.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 self-start sm:self-auto">
          <span className="material-symbols-outlined text-base">schedule</span>
          <span>Sincronização Automática</span>
        </div>
      </div>

      {/* Horário semanal */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">calendar_view_week</span>
          Jornada Semanal
        </h2>

        {isLoadingHours ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {hours.map((day) => {
              const isSavingThisDay = savingDay === day.day_of_week;
              return (
                <div
                  key={day.day_of_week}
                  className={`bg-surface-container border rounded-2xl p-4 space-y-3 transition-all extruded-shadow ${
                    day.is_closed
                      ? "border-hairline-border/60 bg-surface-container/50 opacity-70"
                      : "border-hairline-border hover:border-primary/40"
                  }`}
                >
                  {/* Top Bar: Dia e Switch Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${
                          day.is_closed
                            ? "bg-surface-container-high text-on-surface-variant"
                            : "bg-primary/20 text-primary border border-primary/30"
                        }`}
                      >
                        {DAY_LABELS[day.day_of_week].substring(0, 3)}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-on-surface">{DAY_LABELS[day.day_of_week]}</h3>
                        <span className="text-[11px] text-on-surface-variant font-medium">
                          {day.is_closed ? "Fechado neste dia" : `Aberto: ${day.open_time} às ${day.close_time}`}
                        </span>
                      </div>
                    </div>

                    {/* Button Switch */}
                    <button
                      type="button"
                      disabled={isSavingThisDay}
                      onClick={() => updateDay({ ...day, is_closed: !day.is_closed })}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                        day.is_closed
                          ? "bg-surface-container-high text-on-surface-variant border-hairline-border hover:bg-surface-container-highest"
                          : "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
                      }`}
                    >
                      {isSavingThisDay ? (
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      ) : (
                        <span className="material-symbols-outlined text-base">
                          {day.is_closed ? "toggle_off" : "toggle_on"}
                        </span>
                      )}
                      <span>{day.is_closed ? "Fechado" : "Aberto"}</span>
                    </button>
                  </div>

                  {/* Bottom Controls Grid (Quando Aberto) */}
                  {!day.is_closed && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-hairline-border/50 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                          Abertura
                        </label>
                        <input
                          type="time"
                          value={day.open_time}
                          disabled={isSavingThisDay}
                          onChange={(e) => updateDay({ ...day, open_time: e.target.value })}
                          className="w-full bg-surface-container-high border border-hairline-border rounded-xl px-3 py-2 text-on-surface font-mono font-bold outline-none focus:border-primary cursor-pointer text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                          Fechamento
                        </label>
                        <input
                          type="time"
                          value={day.close_time}
                          disabled={isSavingThisDay}
                          onChange={(e) => updateDay({ ...day, close_time: e.target.value })}
                          className="w-full bg-surface-container-high border border-hairline-border rounded-xl px-3 py-2 text-on-surface font-mono font-bold outline-none focus:border-primary cursor-pointer text-center"
                        />
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                          Intervalo
                        </label>
                        <select
                          value={day.slot_interval_minutes}
                          disabled={isSavingThisDay}
                          onChange={(e) => updateDay({ ...day, slot_interval_minutes: Number(e.target.value) })}
                          className="w-full bg-surface-container-high border border-hairline-border rounded-xl px-3 py-2 text-on-surface font-mono font-bold outline-none focus:border-primary cursor-pointer"
                        >
                          <option value={30}>30 min</option>
                          <option value={60}>1 hora</option>
                          <option value={90}>1h 30m</option>
                          <option value={120}>2 horas</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Datas bloqueadas */}
      <section className="space-y-4 pt-4 border-t border-hairline-border">
        <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-400 text-lg">event_busy</span>
          Feriados & Bloqueios Pontuais
        </h2>

        <div className="bg-surface-container border border-hairline-border rounded-2xl p-4 sm:p-5 space-y-3 extruded-shadow">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Data a Bloquear</label>
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                className="w-full bg-surface-container-high border border-hairline-border rounded-xl px-3 py-2.5 text-xs text-on-surface outline-none focus:border-primary cursor-pointer font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">Motivo (opcional)</label>
              <input
                type="text"
                value={newBlockedReason}
                onChange={(e) => setNewBlockedReason(e.target.value)}
                placeholder="Ex: Feriado de Natal, Manutenção..."
                className="w-full bg-surface-container-high border border-hairline-border rounded-xl px-3 py-2.5 text-xs text-on-surface placeholder:text-outline-variant outline-none focus:border-primary font-medium"
              />
            </div>
          </div>

          <button
            onClick={handleAddBlockedDate}
            disabled={isAddingBlocked}
            className="w-full sm:w-auto bg-primary text-on-primary font-bold text-xs px-5 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Bloquear Data
          </button>
        </div>

        {isLoadingBlocked ? (
          <div className="flex items-center justify-center py-8">
            <span className="material-symbols-outlined text-2xl animate-spin text-primary">sync</span>
          </div>
        ) : blockedDates.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-6 bg-surface-container/40 rounded-xl border border-hairline-border/40">
            Nenhum feriado ou bloqueio agendado.
          </p>
        ) : (
          <div className="space-y-2">
            {blockedDates.map((d) => (
              <div key={d.id} className="bg-surface-container border border-hairline-border rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center text-sm">
                    <span className="material-symbols-outlined text-base">block</span>
                  </span>
                  <div>
                    <p className="text-xs font-bold text-on-surface">
                      {new Date(`${d.blocked_date}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                    {d.reason && <p className="text-[11px] text-on-surface-variant mt-0.5">{d.reason}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveBlockedDate(d.id)}
                  className="text-on-surface-variant hover:text-rose-400 p-2 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
                  title="Remover bloqueio"
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
