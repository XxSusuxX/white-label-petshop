"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import GoogleButton from "@/components/ui/GoogleButton";
import { createClient } from "@/lib/supabase/client";

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: string;
  icon: string;
}

export default function AgendarPublicPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dynamic services from DB
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Form selections
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState("Qualquer Profissional Disponível");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState("09:00");

  const [tutorName, setTutorName] = useState("");
  const [tutorPhone, setTutorPhone] = useState("");
  const [petName, setPetName] = useState("");
  const [petAge, setPetAge] = useState("1 ano");
  const [petBreed, setPetBreed] = useState("");

  // Endereço e Leva e Traz (Coleta / Entrega) para o Entregador
  const [needsDelivery, setNeedsDelivery] = useState(false);
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [gpsLink, setGpsLink] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta GPS. Por favor, digite o endereço manualmente abaixo.");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        setGpsLink(mapsUrl);

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.address) {
            if (data.address.road) setAddressStreet(data.address.road);
            if (data.address.suburb || data.address.neighbourhood) setAddressNeighborhood(data.address.suburb || data.address.neighbourhood);
          }
        } catch {
          // ignore error
        } finally {
          setIsGettingLocation(false);
          alert("📍 Localização GPS capturada com sucesso!");
        }
      },
      (err) => {
        setIsGettingLocation(false);
        alert("Não foi possível obter a localização GPS. Por favor, preencha os campos de endereço por escrito.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const timeSlots = ["08:00", "09:00", "10:30", "13:00", "14:30", "16:00", "17:15"];

  // 1. Verificar Autenticação Obrigatória no Início
  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(user);
          const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";
          setTutorName(name);
        }
      } catch (err) {
        console.error("Erro ao checar auth:", err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Carregar Serviços Dinâmicos do Banco de Dados
  useEffect(() => {
    async function loadServices() {
      setIsLoadingServices(true);
      try {
        const res = await fetch("/api/admin/services");
        const data = await res.json();
        if (data.services && Array.isArray(data.services) && data.services.length > 0) {
          const formatted: ServiceItem[] = data.services
            .filter((s: any) => s.is_active !== false)
            .map((s: any) => ({
              id: s.id,
              name: s.name,
              price: Number(s.price) || 0,
              duration: `${s.duration_minutes || 30} min`,
              icon: s.category === "product" ? "inventory_2" : s.category === "package" ? "card_membership" : "content_cut",
            }));
          setServices(formatted);
          if (formatted.length > 0) {
            setSelectedService(formatted[0]);
          }
        } else {
          // Fallback caso não haja serviços cadastrados
          const defaults: ServiceItem[] = [
            { id: "s1", name: "Banho & Tosa Completo", price: 85.0, duration: "60 min", icon: "content_cut" },
            { id: "s2", name: "Banho Simples + Higienização", price: 55.0, duration: "45 min", icon: "shower" },
            { id: "s3", name: "Hidratação Profunda de Pelagem", price: 40.0, duration: "30 min", icon: "water_drop" },
            { id: "s4", name: "Consulta Veterinária Geral", price: 150.0, duration: "40 min", icon: "stethoscope" },
          ];
          setServices(defaults);
          setSelectedService(defaults[0]);
        }
      } catch (err) {
        console.error("Erro ao carregar serviços do banco:", err);
      } finally {
        setIsLoadingServices(false);
      }
    }
    loadServices();
  }, []);

  const handleFinishBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) {
      alert("Por favor, selecione um serviço.");
      return;
    }
    if (!tutorName || !tutorPhone || !petName) {
      alert("Por favor, preencha seus dados e o nome do seu pet.");
      return;
    }

    const fullAddressString = needsDelivery
      ? `Rua ${addressStreet}, Nº ${addressNumber}, Bairro ${addressNeighborhood}${addressComplement ? `, Comp: ${addressComplement}` : ""}${gpsLink ? ` | GPS: ${gpsLink}` : ""}`
      : "";

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_name: tutorName,
          tutor_phone: tutorPhone,
          pet_name: petName,
          pet_age: petAge,
          pet_breed: petBreed,
          service_name: selectedService.name,
          service_price: selectedService.price,
          date: selectedDate,
          time: selectedTime,
          professional: selectedProfessional,
          address: fullAddressString,
          user_id: currentUser?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível concluir seu agendamento.");
      }

      setStep(4);
    } catch (err: any) {
      console.error("Erro ao agendar:", err);
      setSubmitError(err.message || "Ocorreu um erro ao processar seu agendamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsAppConfirmation = () => {
    if (!selectedService) return;
    const formattedPhone = tutorPhone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá! Gostaria de confirmar meu agendamento online no SaaS Petshop:\n\n` +
        `Tutor: ${tutorName}\n` +
        `Pet: ${petName} (${petAge}) ${petBreed ? `- ${petBreed}` : ""}\n` +
        `Serviço: ${selectedService.name} (R$ ${selectedService.price.toFixed(2)})\n` +
        `Data/Hora: ${selectedDate} às ${selectedTime}`
    );
    window.open(`https://wa.me/55${formattedPhone}?text=${msg}`, "_blank");
  };

  // 3. TELA DE CARREGAMENTO INICIAL
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-matte-canvas text-on-surface flex items-center justify-center">
        <div className="flex items-center gap-3 text-primary font-bold text-sm">
          <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
          <span>Verificando acesso...</span>
        </div>
      </div>
    );
  }

  // 4. BLOQUEIO OBRIGATÓRIO DE AUTENTICAÇÃO ANTES DA TELA DE SERVIÇOS
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-matte-canvas text-on-surface font-body-base antialiased flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md bg-surface-container border border-hairline-border rounded-3xl p-8 extruded-shadow text-center space-y-6">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl mx-auto flex items-center justify-center border border-primary/30">
            <span className="material-symbols-outlined text-3xl">pets</span>
          </div>

          <div>
            <span className="text-caption font-bold text-primary uppercase tracking-widest block mb-1">Agendamento Expresso</span>
            <h1 className="text-xl font-bold text-on-surface">Entre com o Google para Agendar</h1>
            <p className="text-xs text-on-surface-variant mt-2">
              Para sua segurança e sincronização do seu pet com o petshop, o cadastro ou login via Google é <strong className="text-primary">obrigatório antes de ver os serviços</strong>.
            </p>
          </div>

          <div className="pt-2 space-y-4">
            <GoogleButton
              text="Continuar com o Google"
              redirectTo="/auth/callback?next=/agendar"
              className="py-3.5 text-black font-bold shadow-lg"
            />

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-hairline-border"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-on-surface-variant"><span className="bg-surface-container px-2">Ou</span></div>
            </div>

            <Link
              href="/auth/login?next=/agendar"
              className="block w-full py-3 bg-surface-container-high border border-hairline-border text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-highest transition-colors text-center"
            >
              Entrar com E-mail e Senha
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. FLUXO DE AGENDAMENTO (USUÁRIO AUTENTICADO)
  return (
    <div className="min-h-screen bg-matte-canvas text-on-surface font-body-base antialiased flex flex-col items-center justify-between p-4 md:p-8">
      {/* Top Header */}
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between gap-4 py-4 border-b border-hairline-border mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary-container rounded-xl flex items-center justify-center extruded-shadow">
            <span className="material-symbols-outlined text-on-primary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              pets
            </span>
          </div>
          <div>
            <h1 className="text-headline-md font-bold text-primary leading-none">Petshop Patinhas Felizes</h1>
            <span className="text-caption text-on-surface-variant">Link Direto de Agendamento Rápido</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface font-bold hidden sm:inline">
            Olá, {tutorName || "Cliente"}
          </span>
          <Link href="/" className="text-xs font-label-bold text-on-surface-variant hover:text-primary transition-colors">
            Sair
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="w-full max-w-3xl mx-auto bg-surface-container border border-hairline-border rounded-3xl p-6 md:p-10 extruded-shadow flex-1 flex flex-col gap-8">
        {/* Progress Bar */}
        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-500 shadow-[0_0_10px_rgba(78,222,163,0.5)]"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {/* STEP 1: Select Service (Carregado Dinamicamente do Banco de Dados) */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-caption font-label-bold text-primary uppercase tracking-widest block mb-1">Passo 1 de 4</span>
              <h2 className="text-headline-md font-bold text-on-surface">Selecione o Serviço para seu Pet</h2>
            </div>

            {isLoadingServices ? (
              <div className="py-12 text-center text-on-surface-variant space-y-2">
                <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
                <p className="text-xs font-bold">Carregando serviços do catálogo...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedService(s)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                      selectedService?.id === s.id
                        ? "bg-primary/15 border-primary ring-1 ring-primary"
                        : "bg-elevated-card border-hairline-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-label-bold text-on-surface text-body-sm">{s.name}</h3>
                        <span className="text-caption text-on-surface-variant">{s.duration}</span>
                      </div>
                    </div>
                    <strong className="text-primary text-headline-sm font-bold shrink-0">
                      R$ {s.price.toFixed(2).replace(".", ",")}
                    </strong>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                if (!selectedService) {
                  alert("Por favor, selecione um serviço.");
                  return;
                }
                setStep(2);
              }}
              disabled={isLoadingServices || !selectedService}
              className="w-full bg-primary text-on-primary font-label-bold py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50"
            >
              Continuar para Data e Horário
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}

        {/* STEP 2: Select Date & Time */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-caption font-label-bold text-primary uppercase tracking-widest block mb-1">Passo 2 de 4</span>
              <h2 className="text-headline-md font-bold text-on-surface">Escolha o Melhor Horário</h2>
            </div>

            <div>
              <label className="block text-caption font-label-bold text-on-surface-variant mb-2">Data do Atendimento</label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-elevated-card border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-caption font-label-bold text-on-surface-variant mb-2">Horários Disponíveis</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {timeSlots.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    className={`py-3 rounded-xl border text-center text-body-sm font-label-bold transition-all cursor-pointer ${
                      selectedTime === t
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-elevated-card border-hairline-border text-on-surface hover:border-primary/50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-surface-container-high border border-hairline-border text-on-surface font-label-bold py-4 rounded-xl hover:bg-surface-container transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-2/3 bg-primary text-on-primary font-label-bold py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Continuar para Seus Dados
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Customer & Pet Data (Simplificado) */}
        {step === 3 && (
          <form onSubmit={handleFinishBooking} className="space-y-6">
            <div>
              <span className="text-caption font-label-bold text-primary uppercase tracking-widest block mb-1">Passo 3 de 4</span>
              <h2 className="text-headline-md font-bold text-on-surface">Dados do Tutor e do Pet</h2>
            </div>

            {submitError && (
              <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Seu Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Eduardo"
                  value={tutorName}
                  onChange={(e) => setTutorName(e.target.value)}
                  required
                  className="w-full bg-elevated-card border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">WhatsApp / Celular *</label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={tutorPhone}
                  onChange={(e) => setTutorPhone(e.target.value)}
                  required
                  className="w-full bg-elevated-card border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary"
                />
                <span className="text-[11px] text-on-surface-variant mt-1 block">Utilizado para mensagens e confirmação do atendimento</span>
              </div>

              <div>
                <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Nome do Pet *</label>
                <input
                  type="text"
                  placeholder="Ex: Thor, Bob, Mel..."
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  required
                  className="w-full bg-elevated-card border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Idade Aproximada do Pet *</label>
                <select
                  value={petAge}
                  onChange={(e) => setPetAge(e.target.value)}
                  required
                  className="w-full bg-elevated-card border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary cursor-pointer font-medium"
                >
                  <option value="Filhote (< 1 ano)">Filhote (&lt; 1 ano)</option>
                  <option value="1 ano">1 ano</option>
                  <option value="2 anos">2 anos</option>
                  <option value="3 anos">3 anos</option>
                  <option value="4 anos">4 anos</option>
                  <option value="5+ anos">5+ anos</option>
                  <option value="Idoso (8+ anos)">Idoso (8+ anos)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Raça do Pet (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Golden, Poodle, SRD (opcional)"
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                  className="w-full bg-elevated-card border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary"
                />
                <span className="text-[11px] text-on-surface-variant mt-1.5 block">
                  💡 Demais informações (peso, pelagem, cor) não são obrigatórias agora e podem ser preenchidas depois no perfil do pet!
                </span>
              </div>

              {/* Seção de Transporte (Leva e Traz / Coleta & Entrega) */}
              <div className="sm:col-span-2 bg-surface-container-high/40 border border-hairline-border p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center border border-primary/30 shrink-0">
                      <span className="material-symbols-outlined text-xl">local_shipping</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-body-sm text-on-surface">Serviço de Coleta e Entrega (Leva e Traz)?</h4>
                      <p className="text-[11px] text-on-surface-variant">Buscamos e levamos seu pet com conforto na sua residência</p>
                    </div>
                  </div>

                  <div className="flex bg-surface-container p-1 rounded-xl border border-hairline-border shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setNeedsDelivery(false)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !needsDelivery ? "bg-surface-container-highest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setNeedsDelivery(true)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        needsDelivery ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Sim (Coleta)
                    </button>
                  </div>
                </div>

                {needsDelivery && (
                  <div className="space-y-4 pt-3 border-t border-hairline-border/60">
                    {/* Botão de Localização Automática via GPS / Google Maps */}
                    <button
                      type="button"
                      onClick={handleGetGpsLocation}
                      disabled={isGettingLocation}
                      className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-emerald-500/20 active:scale-98 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">my_location</span>
                      {isGettingLocation ? "Capturando GPS..." : "📍 Usar Minha Localização Atual (Google Maps / GPS)"}
                    </button>

                    {gpsLink && (
                      <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          Localização GPS capturada para o entregador!
                        </span>
                        <a href={gpsLink} target="_blank" rel="noreferrer" className="underline text-primary hover:text-emerald-200">
                          Ver no Mapa 🗺️
                        </a>
                      </div>
                    )}

                    {/* Campos Estruturados Separados (Rua, Número, Bairro, Ponto de Referência) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Rua / Logradouro *</label>
                        <input
                          type="text"
                          required={needsDelivery}
                          value={addressStreet}
                          onChange={(e) => setAddressStreet(e.target.value)}
                          placeholder="Ex: Rua das Flores"
                          className="w-full bg-elevated-card border border-hairline-border rounded-xl px-3.5 py-2.5 text-on-surface text-xs outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Número *</label>
                        <input
                          type="text"
                          required={needsDelivery}
                          value={addressNumber}
                          onChange={(e) => setAddressNumber(e.target.value)}
                          placeholder="Ex: 123"
                          className="w-full bg-elevated-card border border-hairline-border rounded-xl px-3.5 py-2.5 text-on-surface text-xs outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Bairro *</label>
                        <input
                          type="text"
                          required={needsDelivery}
                          value={addressNeighborhood}
                          onChange={(e) => setAddressNeighborhood(e.target.value)}
                          placeholder="Ex: Jardim América"
                          className="w-full bg-elevated-card border border-hairline-border rounded-xl px-3.5 py-2.5 text-on-surface text-xs outline-none focus:border-primary"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Complemento / Ponto de Referência</label>
                        <input
                          type="text"
                          value={addressComplement}
                          onChange={(e) => setAddressComplement(e.target.value)}
                          placeholder="Ex: Apto 42, em frente à praça"
                          className="w-full bg-elevated-card border border-hairline-border rounded-xl px-3.5 py-2.5 text-on-surface text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="w-1/3 bg-surface-container-high border border-hairline-border text-on-surface font-label-bold py-4 rounded-xl hover:bg-surface-container transition-all cursor-pointer disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 bg-primary text-on-primary font-label-bold py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">sync</span>
                    Agendando...
                  </>
                ) : (
                  <>
                    Concluir Agendamento
                    <span className="material-symbols-outlined">check_circle</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Success Confirmation */}
        {step === 4 && (
          <div className="text-center py-6 space-y-6 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center border-2 border-primary/40">
              <span className="material-symbols-outlined text-5xl">task_alt</span>
            </div>

            <div>
              <h2 className="text-headline-md font-bold text-on-surface">Agendamento Realizado com Sucesso!</h2>
              <p className="text-body-base text-on-surface-variant max-w-md mx-auto mt-2">
                Seu horário para <strong className="text-primary">{selectedService?.name}</strong> do pet <strong>{petName}</strong> foi reservado para o dia <strong>{selectedDate} às {selectedTime}</strong>.
              </p>
            </div>

            <div className="bg-elevated-card border border-hairline-border p-5 rounded-2xl w-full text-left space-y-2 text-body-sm text-on-surface-variant max-w-md">
              <p className="flex justify-between"><span>Serviço:</span> <strong className="text-on-surface">{selectedService?.name}</strong></p>
              <p className="flex justify-between"><span>Valor:</span> <strong className="text-primary font-bold">R$ {selectedService?.price.toFixed(2).replace(".", ",")}</strong></p>
              <p className="flex justify-between"><span>Tutor:</span> <strong className="text-on-surface">{tutorName}</strong></p>
              <p className="flex justify-between"><span>Data/Hora:</span> <strong className="text-on-surface">{selectedDate} às {selectedTime}</strong></p>
            </div>

            <button
              onClick={openWhatsAppConfirmation}
              className="w-full max-w-md bg-emerald-500 text-black font-label-bold py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer text-body-base"
            >
              <span className="material-symbols-outlined">chat</span>
              Enviar Confirmação por WhatsApp
            </button>

            <div className="pt-4 border-t border-hairline-border/60 max-w-md w-full text-center space-y-2">
              <p className="text-xs text-on-surface-variant">
                Seu cadastro foi salvo com sucesso no SaaS Petshop!
              </p>
              <Link
                href="/client/pets"
                className="text-xs font-bold text-primary hover:underline inline-block"
              >
                Acessar Meus Pets e Perfil →
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full text-center text-caption text-outline py-4">
        © 2026 SaaS Petshop. Todos os direitos reservados.
      </footer>
    </div>
  );
}
