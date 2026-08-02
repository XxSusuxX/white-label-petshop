"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PetItem {
  id: string;
  name: string;
  breed: string;
  image: string;
}

export default function AgendarServicoPage() {
  const router = useRouter();

  // Real pets state
  const [petsList, setPetsList] = useState<PetItem[]>([]);
  const [isLoadingPets, setIsLoadingPets] = useState(true);

  // Booking Flow States
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedPet, setSelectedPet] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("Banho & Tosa");
  const [servicePrice, setServicePrice] = useState<number>(110);
  const [serviceDuration, setServiceDuration] = useState<string>("1h 30m");

  const [selectedDate, setSelectedDate] = useState<number>(15);
  const [selectedMonth] = useState("Julho 2026");
  const [selectedTime, setSelectedTime] = useState<string>("11:00");

  const [address, setAddress] = useState<string>("");
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(false);

  useEffect(() => {
    async function fetchRealPets() {
      setIsLoadingPets(true);
      try {
        const res = await fetch("/api/pets");
        const data = await res.json();
        if (res.ok && data.pets) {
          const mappedPets: PetItem[] = data.pets.map((p: any) => ({
            id: p.id,
            name: p.name,
            breed: p.breed || "Vira-lata",
            image: p.photo_url || (p.species === "Gato"
              ? "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300&q=80"
              : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80"),
          }));
          setPetsList(mappedPets);
          if (mappedPets.length > 0) {
            setSelectedPet(mappedPets[0].name);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar pets para agendamento:", err);
      } finally {
        setIsLoadingPets(false);
      }
    }
    fetchRealPets();
  }, []);

  // Services list
  const servicesList = [
    {
      id: "banho_completo",
      title: "Banho Completo",
      desc: "Higienização, limpeza de ouvidos e corte de unhas.",
      price: 68,
      duration: "45 min",
      popular: false,
    },
    {
      id: "banho_tosa",
      title: "Banho & Tosa",
      desc: "Inclui tosa higiênica ou completa conforme a raça.",
      price: 110,
      duration: "1h 30m",
      popular: true,
    },
    {
      id: "spa_premium",
      title: "Spa Premium",
      desc: "Hidratação profunda, massagem e kit mimos.",
      price: 180,
      duration: "2h 15m",
      popular: false,
    },
  ];

  // Available Time Slots
  const timeSlots = ["08:00", "09:30", "11:00", "13:30", "15:00", "16:30"];

  const handleSelectService = (title: string, price: number, duration: string) => {
    setSelectedService(title);
    setServicePrice(price);
    setServiceDuration(duration);
  };

  const handleGetLocation = () => {
    setUseCurrentLocation(true);
    setAddress("Av. Paulista, 1000 - Bela Vista, São Paulo - SP");
  };

  const handleConfirmBooking = () => {
    alert(`🎉 Agendamento realizado com sucesso para o pet ${selectedPet}!\n\nServiço: ${selectedService}\nData/Hora: ${selectedDate} de Julho às ${selectedTime}\nValor Total: R$ ${servicePrice},00`);
    router.push("/client");
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 🖥️ DESKTOP VIEW (Visible on md screens and above: md:flex) */}
      {/* ========================================================================= */}
      <div className="hidden md:flex min-h-screen flex-1">
        {/* Desktop Main Workspace */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Top Header Bar */}
          <header className="h-16 w-full flex justify-between items-center px-8 sticky top-0 z-30 bg-[#0e1511]/90 backdrop-blur-md border-b border-[#334155]">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span>Portal do Cliente</span>
              <span>/</span>
              <span className="text-on-surface font-bold">Agendamento de Serviço</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3] font-bold text-xs rounded-full flex items-center gap-1.5 uppercase">
                <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
                Horários Disponíveis
              </span>
            </div>
          </header>

          {/* Stepper Progress Bar */}
          <div className="px-8 py-6 bg-[#161d19] border-b border-[#334155]">
            <div className="max-w-4xl mx-auto flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#334155] -translate-y-1/2 z-0"></div>

              {/* Step 1: Pet */}
              <div
                onClick={() => setActiveStep(1)}
                className="relative z-10 flex flex-col items-center gap-1 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-[#4edea3] text-[#003824] flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(78,222,163,0.5)]">
                  1
                </div>
                <span className="text-xs font-bold text-[#4edea3]">Pet</span>
              </div>

              {/* Step 2: Serviço */}
              <div
                onClick={() => setActiveStep(2)}
                className="relative z-10 flex flex-col items-center gap-1 cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border transition-all ${
                    activeStep >= 2
                      ? "bg-[#4edea3] text-[#003824] border-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.5)]"
                      : "bg-[#2f3632] text-on-surface-variant border-[#334155]"
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-xs font-bold ${
                    activeStep >= 2 ? "text-[#4edea3]" : "text-on-surface-variant"
                  }`}
                >
                  Serviço
                </span>
              </div>

              {/* Step 3: Horário */}
              <div
                onClick={() => setActiveStep(3)}
                className="relative z-10 flex flex-col items-center gap-1 cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border transition-all ${
                    activeStep >= 3
                      ? "bg-[#4edea3] text-[#003824] border-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.5)]"
                      : "bg-[#2f3632] text-on-surface-variant border-[#334155]"
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-xs font-bold ${
                    activeStep >= 3 ? "text-[#4edea3]" : "text-on-surface-variant"
                  }`}
                >
                  Horário
                </span>
              </div>

              {/* Step 4: Confirmação */}
              <div
                onClick={() => setActiveStep(4)}
                className="relative z-10 flex flex-col items-center gap-1 cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border transition-all ${
                    activeStep >= 4
                      ? "bg-[#4edea3] text-[#003824] border-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.5)]"
                      : "bg-[#2f3632] text-on-surface-variant border-[#334155]"
                  }`}
                >
                  4
                </div>
                <span
                  className={`text-xs font-bold ${
                    activeStep >= 4 ? "text-[#4edea3]" : "text-on-surface-variant"
                  }`}
                >
                  Confirmação
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Content View */}
          <main className="flex-1 p-8 space-y-8 max-w-4xl w-full mx-auto">
            {/* Section 1: Selecione o Pet */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4edea3]">pets</span>
                  Selecione o Pet
                </h2>
                <Link
                  href="/client/pets"
                  className="text-xs font-bold text-[#4edea3] hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span> + Novo Pet
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {petsList.map((pet) => {
                  const isSelected = selectedPet === pet.name;
                  return (
                    <div
                      key={pet.id}
                      onClick={() => setSelectedPet(pet.name)}
                      className={`bg-[#1e293b] border rounded-2xl p-5 flex flex-col items-center gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#4edea3] ring-2 ring-[#4edea3]/50 shadow-[0_0_15px_rgba(78,222,163,0.2)]"
                          : "border-[#334155] opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#4edea3]/40">
                        <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-sm text-on-surface">{pet.name}</h3>
                        <p className="text-xs text-on-surface-variant">{pet.breed}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 2: Escolha o Serviço */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4edea3]">content_cut</span>
                Escolha o Serviço
              </h2>

              <div className="grid grid-cols-3 gap-4">
                {servicesList.map((serv) => {
                  const isSelected = selectedService === serv.title;
                  return (
                    <div
                      key={serv.id}
                      onClick={() => handleSelectService(serv.title, serv.price, serv.duration)}
                      className={`bg-[#1e293b] border rounded-2xl p-5 flex flex-col justify-between space-y-3 relative transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#4edea3] ring-2 ring-[#4edea3]/50 shadow-[0_0_15px_rgba(78,222,163,0.2)]"
                          : "border-[#334155] hover:border-[#4edea3]/50"
                      }`}
                    >
                      {serv.popular && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#4edea3]/20 border border-[#4edea3]/40 text-[#4edea3] text-[9px] font-black uppercase rounded">
                          POPULAR
                        </span>
                      )}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="material-symbols-outlined text-[#4edea3]">water_drop</span>
                          <span className="font-extrabold text-sm text-[#4edea3]">R$ {serv.price}</span>
                        </div>
                        <h3 className="font-bold text-sm text-on-surface">{serv.title}</h3>
                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{serv.desc}</p>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-outline pt-2 border-t border-[#334155]/40 font-mono">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        <span>{serv.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 3: Data e Horário */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4edea3]">calendar_today</span>
                Data e Horário
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#1e293b] border border-[#334155] p-6 rounded-2xl">
                {/* Full Calendar Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">{selectedMonth}</span>
                    <div className="flex gap-1">
                      <span className="material-symbols-outlined text-sm text-outline cursor-pointer">chevron_left</span>
                      <span className="material-symbols-outlined text-sm text-outline cursor-pointer">chevron_right</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 text-center text-[10px] font-bold text-outline">
                    <div>DOM</div><div>SEG</div><div>TER</div><div>QUA</div><div>QUI</div><div>SEX</div><div>SÁB</div>
                  </div>

                  <div className="grid grid-cols-7 text-center gap-1">
                    <div className="py-1.5 text-xs text-outline/30 font-bold">27</div>
                    <div className="py-1.5 text-xs text-outline/30 font-bold">28</div>
                    <div className="py-1.5 text-xs text-outline/30 font-bold">29</div>
                    <div className="py-1.5 text-xs text-outline/30 font-bold">30</div>
                    <div className="py-1.5 text-xs text-outline/30 font-bold">31</div>

                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                      const isSel = d === selectedDate;
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setSelectedDate(d)}
                          className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            isSel
                              ? "bg-[#4edea3] text-[#003824] shadow-[0_0_10px_rgba(78,222,163,0.6)] font-extrabold"
                              : "text-on-surface hover:bg-[#242c27]"
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface">Terça-feira, {selectedDate} de Jul</span>
                    <span className="text-[10px] font-mono text-[#4edea3]">6 horários disponíveis</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((t) => {
                      const isSel = selectedTime === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                            isSel
                              ? "bg-[#4edea3] text-[#003824] border-[#4edea3] shadow-[0_0_10px_rgba(78,222,163,0.4)]"
                              : "bg-[#161d19] border-[#334155] text-on-surface hover:border-[#4edea3]/50"
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-warning-amber mt-3 flex items-center gap-1 leading-tight">
                    <span className="material-symbols-outlined text-xs">info</span>
                    Serviços de tosa no período da manhã podem demorar um pouco mais...
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Endereço de Coleta (Pet Táxi) */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4edea3]">local_shipping</span>
                Endereço de Coleta (Pet Táxi)
              </h2>

              <div className="bg-[#1e293b] border border-[#334155] p-5 rounded-2xl space-y-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
                    location_on
                  </span>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Digite o endereço para coleta do seu pet..."
                    className="w-full bg-[#161d19] border border-[#334155] rounded-xl pl-9 pr-4 py-2.5 text-xs text-on-surface outline-none placeholder:text-outline"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="w-full py-2.5 bg-[#161d19] border border-[#4edea3]/30 text-[#4edea3] font-bold text-xs rounded-xl hover:bg-[#4edea3]/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">my_location</span>
                  <span>Usar minha localização atual</span>
                </button>
              </div>
            </section>

            {/* Section 5: Resumo do Agendamento & Checkout */}
            <section className="bg-[#1e293b] border border-[#334155] p-6 rounded-2xl space-y-4 shadow-xl">
              <h3 className="font-bold text-base text-on-surface border-b border-[#334155]/50 pb-3">
                Resumo do Agendamento
              </h3>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4edea3]/20 flex items-center justify-center text-[#4edea3] font-bold">
                    {selectedPet.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">{selectedPet}</h4>
                    <p className="text-on-surface-variant text-[11px]">{selectedService}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-on-surface font-bold">{selectedDate} de Julho, 2026</span>
                  <p className="text-on-surface-variant text-[11px]">{selectedTime} às 13:30</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#334155]/40 space-y-1.5 text-xs">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal</span>
                  <span className="font-bold text-on-surface">R$ {servicePrice},00</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Taxa de Agendamento</span>
                  <span className="font-bold text-on-surface">R$ 0,00</span>
                </div>
                <div className="flex justify-between text-base font-bold text-on-surface pt-2 border-t border-[#334155]/40">
                  <span>Total Estimado</span>
                  <span className="text-[#4edea3]">R$ {servicePrice},00</span>
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                className="w-full py-4 bg-[#4edea3] text-[#003824] font-extrabold text-sm rounded-xl shadow-[0_0_15px_rgba(78,222,163,0.4)] hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Confirmar Agendamento</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </section>
          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📱 MOBILE VIEW (Visible on mobile screens below md: block md:hidden) */}
      {/* ========================================================================= */}
      <div className="block md:hidden min-h-screen flex-1 flex flex-col">
        {/* Mobile Top Bar */}
        <header className="h-16 w-full flex justify-between items-center px-5 sticky top-0 z-40 bg-[#0e1511]/90 backdrop-blur-md border-b border-[#334155]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3]">pets</span>
            <span className="text-xl font-extrabold text-[#4edea3] tracking-tight">PetNexus</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-surface-container border border-hairline-border overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
              alt="User Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </header>

        {/* Mobile Stepper (1 Pet, 2 Serviço, 3 Agenda, 4 Ok) */}
        <nav className="px-5 py-3 bg-[#161d19] border-b border-[#334155]">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#334155] -translate-y-1/2 z-0"></div>

            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-[#4edea3] text-[#003824] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <span className="text-[10px] font-bold text-[#4edea3]">Pet</span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-[#2f3632] text-on-surface-variant flex items-center justify-center font-bold text-xs border border-[#334155]">
                2
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant">Serviço</span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-[#2f3632] text-on-surface-variant flex items-center justify-center font-bold text-xs border border-[#334155]">
                3
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant">Agenda</span>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-0.5">
              <div className="w-7 h-7 rounded-full bg-[#2f3632] text-on-surface-variant flex items-center justify-center font-bold text-xs border border-[#334155]">
                4
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant">Ok</span>
            </div>
          </div>
        </nav>

        {/* Mobile Main Body with plenty of bottom padding (pb-64) so scrolling is completely clear of bottom bars */}
        <main className="flex-1 p-4 max-w-xl w-full mx-auto space-y-6 pb-64">
          {/* Seleção de Pet */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4edea3] text-base">pets</span>
                Selecione o Pet
              </h2>
              <Link href="/client/pets" className="text-xs font-bold text-[#4edea3] flex items-center gap-1">
                + Adicionar
              </Link>
            </div>

            {/* Horizontal Pets Cards */}
            <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-1">
              {petsList.map((pet) => {
                const isSelected = selectedPet === pet.name;
                return (
                  <div
                    key={pet.id}
                    onClick={() => setSelectedPet(pet.name)}
                    className={`min-w-[100px] bg-[#1e293b] border rounded-2xl p-3 flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#4edea3] ring-2 ring-[#4edea3]/50"
                        : "border-[#334155] opacity-60"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[#4edea3]/40">
                      <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs font-bold text-on-surface">{pet.name}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Endereço de Coleta (Pet Táxi) */}
          <section className="space-y-3">
            <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4edea3]">
                <span className="material-symbols-outlined text-base">location_on</span>
                <span>Endereço de Coleta</span>
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Buscar endereço..."
                className="w-full bg-[#161d19] border border-[#334155] rounded-xl px-3 py-2 text-xs text-on-surface outline-none"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full py-2 bg-[#161d19] border border-[#4edea3]/30 text-[#4edea3] font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">my_location</span>
                <span>Usar minha localização atual</span>
              </button>
            </div>
          </section>

          {/* Escolha o Serviço */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#4edea3] text-base">content_cut</span>
              Escolha o Serviço
            </h2>

            <div className="space-y-2.5">
              {servicesList.map((serv) => {
                const isSelected = selectedService === serv.title;
                return (
                  <div
                    key={serv.id}
                    onClick={() => handleSelectService(serv.title, serv.price, serv.duration)}
                    className={`bg-[#1e293b] border rounded-2xl p-4 flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#4edea3] ring-1 ring-[#4edea3]"
                        : "border-[#334155]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3]">
                        <span className="material-symbols-outlined">water_drop</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-on-surface">{serv.title}</h4>
                        <p className="text-[10px] text-outline">{serv.duration} • Táxi incluído</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#4edea3]">R$ {serv.price},00</span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-[#4edea3] text-lg">check_circle</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Data e Horário (Mobile Full Calendar Grid + Time Slots) */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#4edea3] text-base">calendar_today</span>
              Data e Horário
            </h2>

            <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-2xl space-y-4">
              {/* Full Month Mobile Calendar Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-on-surface">
                  <span>{selectedMonth}</span>
                  <span className="text-[10px] text-[#4edea3]">Dia {selectedDate} selecionado</span>
                </div>

                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-outline">
                  <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                </div>

                <div className="grid grid-cols-7 text-center gap-1">
                  <div className="py-1 text-xs text-outline/30 font-bold">27</div>
                  <div className="py-1 text-xs text-outline/30 font-bold">28</div>
                  <div className="py-1 text-xs text-outline/30 font-bold">29</div>
                  <div className="py-1 text-xs text-outline/30 font-bold">30</div>
                  <div className="py-1 text-xs text-outline/30 font-bold">31</div>

                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                    const isSel = d === selectedDate;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDate(d)}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          isSel
                            ? "bg-[#4edea3] text-[#003824] shadow-[0_0_8px_rgba(78,222,163,0.6)] font-extrabold"
                            : "text-on-surface hover:bg-[#242c27]"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Options */}
              <div className="pt-3 border-t border-[#334155]/40 space-y-2">
                <span className="text-xs font-bold text-on-surface block">Horários Disponíveis</span>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((t) => {
                    const isSel = selectedTime === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTime(t)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isSel
                            ? "bg-[#4edea3] text-[#003824] border-[#4edea3] font-extrabold shadow-[0_0_8px_rgba(78,222,163,0.4)]"
                            : "bg-[#161d19] border-[#334155] text-on-surface"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Mobile Sticky Bottom Summary Bar */}
        <div className="fixed bottom-14 left-0 right-0 z-40 bg-[#1e293b] border-t border-[#334155] p-4 flex flex-col gap-2 shadow-2xl">
          <div className="flex items-center justify-between text-xs">
            <span className="text-on-surface-variant font-medium">
              {selectedPet} • {selectedService} ({selectedDate} de Jul, {selectedTime})
            </span>
            <span className="font-extrabold text-[#4edea3] text-sm">R$ {servicePrice},00</span>
          </div>

          <button
            onClick={handleConfirmBooking}
            className="w-full py-3.5 bg-[#4edea3] text-[#003824] font-extrabold text-sm rounded-xl shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Confirmar Agendamento</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </>
  );
}
