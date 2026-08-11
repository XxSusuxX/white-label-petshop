"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface PetItem {
  id: string;
  name: string;
  breed: string;
  image: string;
}

interface ServiceItem {
  id: string;
  title: string;
  desc: string;
  price: number;
  durationMinutes: number;
  duration: string;
}

interface OccupiedRange {
  start: string;
  end: string;
}

interface PackageOption {
  id: string;
  service_id: string | null;
  package_name: string;
  remaining: number;
  status: string;
}

const STEPS = [
  { n: 1, label: "Pet" },
  { n: 2, label: "Endereço" },
  { n: 3, label: "Serviço" },
  { n: 4, label: "Data" },
  { n: 5, label: "Resumo" },
];

// Horários possíveis para a data selecionada vêm de /api/appointments/availability
// (gerados a partir do horário de funcionamento configurado pelo admin em
// Horário de Funcionamento — não é mais uma lista fixa).

const formatDuration = (minutes: number) => {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export default function AgendarServicoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Pet
  const [petsList, setPetsList] = useState<PetItem[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState("");

  // Endereço
  const [address, setAddress] = useState("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);

  // Serviço
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState("");

  // Data e Horário
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [occupiedRanges, setOccupiedRanges] = useState<OccupiedRange[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [dayClosedReason, setDayClosedReason] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pacotes ativos do tutor (pagamento com crédito em vez de cobrar)
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [usePackageCredit, setUsePackageCredit] = useState(true);
  const [recurringDays, setRecurringDays] = useState("0");

  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingPets(true);
      setIsLoadingServices(true);
      setIsLoadingAddress(true);
      try {
        const [petsRes, servicesRes, pkgRes] = await Promise.all([
          fetch("/api/pets"),
          fetch("/api/services"),
          fetch("/api/client-packages"),
        ]);
        const petsData = await petsRes.json();
        const servicesData = await servicesRes.json();
        const pkgData = await pkgRes.json();

        if (pkgRes.ok && pkgData.packages) {
          const mappedPkgs: PackageOption[] = pkgData.packages
            .filter((p: any) => p.status === "ativo" && p.total_credits - p.used_credits > 0)
            .map((p: any) => ({
              id: p.id,
              service_id: p.service_id,
              package_name: p.package_name,
              remaining: p.total_credits - p.used_credits,
              status: p.status,
            }));
          setPackages(mappedPkgs);
        }

        if (petsRes.ok && petsData.pets) {
          const mappedPets: PetItem[] = petsData.pets.map((p: any) => ({
            id: p.id,
            name: p.name,
            breed: p.breed || "Vira-lata",
            image: p.photo_url || (p.species === "Gato"
              ? "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=80"
              : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80"),
          }));
          setPetsList(mappedPets);
          if (mappedPets.length > 0) setSelectedPetId(mappedPets[0].id);
        }

        if (servicesRes.ok && servicesData.services) {
          const mapped: ServiceItem[] = servicesData.services.map((s: any) => ({
            id: s.id,
            title: s.name,
            desc: s.description || "",
            price: Number(s.price),
            durationMinutes: s.duration_minutes || 60,
            duration: formatDuration(s.duration_minutes),
          }));
          setServicesList(mapped);
          if (mapped.length > 0) setSelectedServiceId(mapped[0].id);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do agendamento:", err);
      } finally {
        setIsLoadingPets(false);
        setIsLoadingServices(false);
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("address").eq("id", user.id).maybeSingle();
          if (profile?.address) setAddress(profile.address);
        }
      } catch (err) {
        console.warn("Aviso ao carregar endereço salvo:", err);
      } finally {
        setIsLoadingAddress(false);
      }
    }
    loadInitialData();
  }, []);

  // Sempre que o serviço selecionado mudar, volta a assumir "usar pacote" se houver um disponível
  useEffect(() => {
    setUsePackageCredit(true);
  }, [selectedServiceId]);

  const selectedPet = petsList.find((p) => p.id === selectedPetId);
  const selectedService = servicesList.find((s) => s.id === selectedServiceId);
  const matchingPackage = packages.find((p) => p.service_id === selectedServiceId);
  const willUsePackage = !!matchingPackage && usePackageCredit;
  const finalPrice = willUsePackage ? 0 : (selectedService?.price || 0);

  // Grade real do mês selecionado
  const monthGridCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const cells: { day: number; inCurrentMonth: boolean }[] = [];
    for (let i = firstWeekday - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, inCurrentMonth: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, inCurrentMonth: true });
    let nextDay = 1;
    while (cells.length % 7 !== 0) cells.push({ day: nextDay++, inCurrentMonth: false });
    return cells;
  }, [calendarMonth]);

  const monthLabel = calendarMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const selectedDateObj = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), selectedDate);
  const selectedDateLabel = selectedDateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const isPastDate = (day: number) => {
    const d = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  const handlePrevMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() - 1);
    setCalendarMonth(d);
  };
  const handleNextMonth = () => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() + 1);
    setCalendarMonth(d);
  };

  // Buscar horários disponíveis (a partir do horário de funcionamento) e ocupados sempre que a data ou o serviço mudarem
  useEffect(() => {
    if (step !== 4) return;
    async function loadAvailability() {
      setIsLoadingSlots(true);
      setSelectedTime("");
      try {
        const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
        const duration = selectedService?.durationMinutes || 60;
        const res = await fetch(`/api/appointments/availability?date=${dateStr}&duration_minutes=${duration}`);
        const data = await res.json();
        if (res.ok) {
          setOccupiedRanges(data.occupied || []);
          setAvailableSlots(data.slots || []);
          setDayClosedReason(data.closed ? data.closedReason || "Fechado nesta data." : null);
        }
      } catch (err) {
        console.error("Erro ao carregar disponibilidade:", err);
      } finally {
        setIsLoadingSlots(false);
      }
    }
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, calendarMonth, step, selectedServiceId]);

  const isSlotTaken = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const slotStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), selectedDate, h, m, 0, 0);
    const duration = selectedService?.durationMinutes || 60;
    const slotEnd = new Date(slotStart.getTime() + duration * 60000);
    return occupiedRanges.some((r) => {
      const rStart = new Date(r.start);
      const rEnd = new Date(r.end);
      return slotStart < rEnd && rStart < slotEnd;
    });
  };

  const canProceed = () => {
    if (step === 1) return !!selectedPetId;
    if (step === 2) return address.trim().length > 3;
    if (step === 3) return !!selectedServiceId;
    if (step === 4) return !!selectedTime && !isPastDate(selectedDate);
    return true;
  };

  const goNext = () => {
    if (!canProceed()) return;
    setStep((s) => Math.min(5, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleConfirmBooking = async () => {
    if (!selectedPet || !selectedService || !selectedTime) return;
    setIsSubmitting(true);
    try {
      const scheduledAt = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), selectedDate);
      const [h, m] = selectedTime.split(":").map(Number);
      scheduledAt.setHours(h, m, 0, 0);

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pet_id: selectedPet.id,
          service_id: selectedService.id,
          service_type: selectedService.title,
          service_date: scheduledAt.toISOString(),
          price: finalPrice,
          address,
          use_package_id: willUsePackage ? matchingPackage!.id : undefined,
          recurring_interval_days: Number(recurringDays) > 0 ? Number(recurringDays) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao criar agendamento.");

      router.push("/client?agendado=1");
    } catch (err: any) {
      console.error("Erro ao confirmar agendamento:", err);
      alert(err.message || "Não foi possível concluir o agendamento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-28 md:pb-8">
      {/* Indicador de Progresso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-primary">Passo {step} de 5 — {STEPS[step - 1].label}</span>
          {step < 5 && (
            <span className="text-[11px] text-on-surface-variant">{STEPS.length - step} restantes</span>
          )}
        </div>
        <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* ===================== STEP 1: PET ===================== */}
      {step === 1 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">pets</span>
              Selecione o Pet
            </h2>
            <Link href="/client/pets" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add</span> Novo Pet
            </Link>
          </div>

          {isLoadingPets ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-surface-container border border-hairline-border rounded-2xl p-4 h-28 animate-pulse"></div>
              ))}
            </div>
          ) : petsList.length === 0 ? (
            <div className="bg-surface-container border border-hairline-border rounded-2xl p-6 text-center space-y-3">
              <span className="material-symbols-outlined text-primary text-4xl">pets</span>
              <p className="font-bold text-on-surface text-sm">Nenhum pet cadastrado ainda</p>
              <p className="text-xs text-on-surface-variant">Cadastre seu pet para agendar um serviço.</p>
              <Link href="/client/pets" className="inline-flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2.5 rounded-xl text-xs font-bold">
                <span className="material-symbols-outlined text-sm">add</span> Cadastrar Meu Pet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {petsList.map((pet) => {
                const isSelected = selectedPetId === pet.id;
                return (
                  <button
                    key={pet.id}
                    onClick={() => setSelectedPetId(pet.id)}
                    className={`bg-surface-container border rounded-2xl p-4 flex flex-col items-center gap-2 transition-all cursor-pointer min-h-[112px] ${
                      isSelected ? "border-primary ring-2 ring-primary/40 bg-primary/5" : "border-hairline-border hover:border-primary/40"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/30">
                      <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-sm text-on-surface">{pet.name}</h3>
                      <p className="text-[11px] text-on-surface-variant">{pet.breed}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ===================== STEP 2: ENDEREÇO ===================== */}
      {step === 2 && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">location_on</span>
            Endereço de Coleta
          </h2>
          {isLoadingAddress ? (
            <div className="h-24 bg-surface-container border border-hairline-border rounded-2xl animate-pulse"></div>
          ) : (
            <div className="bg-surface-container border border-hairline-border rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-on-surface-variant block">Endereço completo</label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade..."
                autoFocus
                className="w-full bg-matte-canvas border border-hairline-border rounded-xl px-3 py-3 text-sm text-on-surface outline-none focus:border-primary placeholder:text-outline resize-none"
              />
              <p className="text-[11px] text-on-surface-variant">Esse endereço fica salvo no seu perfil para os próximos agendamentos.</p>
            </div>
          )}
        </section>
      )}

      {/* ===================== STEP 3: SERVIÇO ===================== */}
      {step === 3 && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">content_cut</span>
            Escolha o Serviço
          </h2>
          {isLoadingServices ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface-container border border-hairline-border rounded-2xl h-20 animate-pulse"></div>
              ))}
            </div>
          ) : servicesList.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">Nenhum serviço disponível no momento.</p>
          ) : (
            <div className="space-y-2.5">
              {servicesList.map((serv) => {
                const isSelected = selectedServiceId === serv.id;
                return (
                  <button
                    key={serv.id}
                    onClick={() => setSelectedServiceId(serv.id)}
                    className={`w-full text-left bg-surface-container border rounded-2xl p-4 flex items-center justify-between gap-3 transition-all cursor-pointer min-h-[64px] ${
                      isSelected ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-hairline-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined">water_drop</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-on-surface truncate">{serv.title}</h4>
                        <p className="text-[11px] text-on-surface-variant">{serv.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-sm text-primary">R$ {serv.price.toFixed(2)}</span>
                      {isSelected && <span className="material-symbols-outlined text-primary">check_circle</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ===================== STEP 4: DATA E HORÁRIO ===================== */}
      {step === 4 && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            Data e Horário
          </h2>

          <div className="bg-surface-container border border-hairline-border rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-surface-container-high cursor-pointer">
                <span className="material-symbols-outlined text-on-surface-variant">chevron_left</span>
              </button>
              <span className="text-sm font-bold text-on-surface capitalize">{monthLabel}</span>
              <button onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-surface-container-high cursor-pointer">
                <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-outline">
              <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {monthGridCells.map((cell, idx) =>
                !cell.inCurrentMonth ? (
                  <div key={`out-${idx}`} className="py-2 text-xs text-outline/30 font-bold">{cell.day}</div>
                ) : (
                  <button
                    key={`day-${cell.day}`}
                    disabled={isPastDate(cell.day)}
                    onClick={() => setSelectedDate(cell.day)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all min-h-[36px] ${
                      isPastDate(cell.day)
                        ? "text-outline/30 cursor-not-allowed"
                        : cell.day === selectedDate
                        ? "bg-primary text-on-primary shadow-md cursor-pointer"
                        : "text-on-surface hover:bg-surface-container-high cursor-pointer"
                    }`}
                  >
                    {cell.day}
                  </button>
                )
              )}
            </div>

            <div className="pt-3 border-t border-hairline-border/50 space-y-2">
              <span className="text-xs font-bold text-on-surface capitalize block">{selectedDateLabel}</span>
              {isLoadingSlots ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-10 bg-matte-canvas border border-hairline-border rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : dayClosedReason ? (
                <p className="text-[11px] text-amber-400 text-center py-3">{dayClosedReason} Escolha outra data.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((t) => {
                    const taken = isSlotTaken(t);
                    const isSel = selectedTime === t;
                    return (
                      <button
                        key={t}
                        disabled={taken}
                        onClick={() => setSelectedTime(t)}
                        className={`py-2.5 text-xs font-bold rounded-xl border transition-all min-h-[42px] ${
                          taken
                            ? "bg-matte-canvas border-hairline-border/50 text-outline/40 cursor-not-allowed line-through"
                            : isSel
                            ? "bg-primary text-on-primary border-primary shadow-md cursor-pointer"
                            : "bg-matte-canvas border-hairline-border text-on-surface hover:border-primary/50 cursor-pointer"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}
              {!isLoadingSlots && !dayClosedReason && availableSlots.length > 0 && availableSlots.every((t) => isSlotTaken(t)) && (
                <p className="text-[11px] text-amber-400 text-center pt-1">Não há horários livres neste dia. Escolha outra data.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ===================== STEP 5: RESUMO ===================== */}
      {step === 5 && (
        <section className="space-y-4">
          <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            Resumo do Agendamento
          </h2>

          <div className="bg-surface-container border border-hairline-border rounded-2xl divide-y divide-hairline-border/60 overflow-hidden">
            <SummaryRow icon="pets" label="Pet" value={selectedPet?.name || "—"} onEdit={() => setStep(1)} />
            <SummaryRow icon="location_on" label="Endereço" value={address || "—"} onEdit={() => setStep(2)} multiline />
            <SummaryRow icon="content_cut" label="Serviço" value={selectedService?.title || "—"} onEdit={() => setStep(3)} />
            <SummaryRow
              icon="calendar_today"
              label="Data e Horário"
              value={`${selectedDateLabel}, ${selectedTime}`}
              onEdit={() => setStep(4)}
            />
            <div className="flex items-center justify-between px-4 py-4 bg-primary/5">
              <span className="text-sm font-bold text-on-surface">Valor Total</span>
              <span className="text-lg font-extrabold text-primary">
                {willUsePackage ? "Coberto pelo pacote" : `R$ ${finalPrice.toFixed(2)}`}
              </span>
            </div>
          </div>

          {matchingPackage && (
            <button
              type="button"
              onClick={() => setUsePackageCredit((v) => !v)}
              className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                usePackageCredit ? "bg-primary/10 border-primary/40" : "bg-surface-container border-hairline-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">loyalty</span>
                <div>
                  <p className="text-sm font-bold text-on-surface">Usar crédito do pacote "{matchingPackage.package_name}"</p>
                  <p className="text-[11px] text-on-surface-variant">{matchingPackage.remaining} crédito(s) restante(s)</p>
                </div>
              </div>
              <span className={`material-symbols-outlined ${usePackageCredit ? "text-primary" : "text-on-surface-variant"}`}>
                {usePackageCredit ? "toggle_on" : "toggle_off"}
              </span>
            </button>
          )}

          <div className="p-4 rounded-2xl border border-hairline-border bg-surface-container">
            <label className="flex items-center gap-2 text-sm font-bold text-on-surface mb-2">
              <span className="material-symbols-outlined text-primary text-base">event_repeat</span>
              Repetir este agendamento
            </label>
            <select
              value={recurringDays}
              onChange={(e) => setRecurringDays(e.target.value)}
              className="w-full bg-matte-canvas border border-hairline-border rounded-xl p-3 text-sm text-on-surface focus:border-primary outline-none cursor-pointer"
            >
              <option value="0">Não repetir</option>
              <option value="7">A cada semana</option>
              <option value="14">A cada 2 semanas</option>
              <option value="30">A cada mês</option>
            </select>
            {Number(recurringDays) > 0 && (
              <p className="text-[11px] text-on-surface-variant mt-2">
                Assim que este atendimento for concluído pelo petshop, o próximo já será agendado automaticamente nessa recorrência.
              </p>
            )}
          </div>

          <p className="text-[11px] text-on-surface-variant text-center px-4">
            Ao confirmar, seu agendamento será enviado para a equipe e você receberá uma notificação de confirmação.
          </p>
        </section>
      )}

      {/* ===================== BARRA DE AÇÕES (fixa no mobile) ===================== */}
      <div className="fixed md:sticky bottom-16 md:bottom-0 left-0 right-0 md:mt-6 bg-matte-canvas/95 md:bg-transparent backdrop-blur-lg md:backdrop-blur-none border-t md:border-t-0 border-hairline-border p-4 md:p-0 flex gap-3 z-30">
        {step > 1 && (
          <button
            onClick={goBack}
            className="flex-1 md:flex-none md:px-8 py-3.5 bg-surface-container border border-hairline-border text-on-surface font-bold text-sm rounded-xl hover:bg-surface-container-high transition-all cursor-pointer"
          >
            Voltar
          </button>
        )}
        {step < 5 ? (
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className="flex-[2] md:flex-none md:px-10 py-3.5 bg-primary text-on-primary font-bold text-sm rounded-xl extruded-shadow hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Continuar
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={handleConfirmBooking}
            disabled={isSubmitting}
            className="flex-[2] md:flex-none md:px-10 py-3.5 bg-primary text-on-primary font-bold text-sm rounded-xl extruded-shadow hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Confirmando..." : "Confirmar Agendamento"}
            <span className="material-symbols-outlined text-base">check_circle</span>
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  onEdit,
  multiline,
}: {
  icon: string;
  label: string;
  value: string;
  onEdit: () => void;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3.5">
      <div className="flex items-start gap-3 min-w-0">
        <span className="material-symbols-outlined text-primary text-lg mt-0.5">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wide">{label}</p>
          <p className={`text-sm font-bold text-on-surface ${multiline ? "" : "truncate"}`}>{value}</p>
        </div>
      </div>
      <button onClick={onEdit} className="text-[11px] font-bold text-primary hover:underline shrink-0 cursor-pointer">
        Editar
      </button>
    </div>
  );
}
