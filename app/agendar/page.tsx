"use client";

import { useState } from "react";
import Link from "next/link";

export default function AgendarPublicPage() {
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form selections
  const [selectedService, setSelectedService] = useState({
    id: "s1",
    name: "Banho & Tosa Completo",
    price: 85.0,
    duration: "60 min",
  });
  const [selectedProfessional, setSelectedProfessional] = useState("Qualquer Profissional Disponível");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState("09:00");

  const [tutorName, setTutorName] = useState("");
  const [tutorPhone, setTutorPhone] = useState("");
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");

  const services = [
    { id: "s1", name: "Banho & Tosa Completo", price: 85.0, duration: "60 min", icon: "content_cut" },
    { id: "s2", name: "Banho Simples + Higienização", price: 55.0, duration: "45 min", icon: "shower" },
    { id: "s3", name: "Hidratação Profunda de Pelagem", price: 40.0, duration: "30 min", icon: "water_drop" },
    { id: "s4", name: "Consulta Veterinária Geral", price: 150.0, duration: "40 min", icon: "stethoscope" },
  ];

  const timeSlots = ["08:00", "09:00", "10:30", "13:00", "14:30", "16:00", "17:15"];

  const handleFinishBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorName || !tutorPhone || !petName) {
      alert("Por favor, preencha os dados de contato e do seu pet.");
      return;
    }

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
          pet_breed: petBreed,
          service_name: selectedService.name,
          service_price: selectedService.price,
          date: selectedDate,
          time: selectedTime,
          professional: selectedProfessional,
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
    const formattedPhone = tutorPhone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Olá! Gostaria de confirmar meu agendamento online no SaaS Petshop:\n\n` +
        `Tutor: ${tutorName}\n` +
        `Pet: ${petName} (${petBreed || "Sem raça"})\n` +
        `Serviço: ${selectedService.name} (R$ ${selectedService.price.toFixed(2)})\n` +
        `Data/Hora: ${selectedDate} às ${selectedTime}\n` +
        `Profissional: ${selectedProfessional}`
    );
    window.open(`https://wa.me/55${formattedPhone}?text=${msg}`, "_blank");
  };

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
            <span className="text-caption text-on-surface-variant">Agendamento Online 24/7</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-xs font-label-bold text-on-surface-variant hover:text-primary transition-colors hidden sm:block">
            Já tenho conta
          </Link>
          <Link href="/" className="text-xs font-label-bold text-on-surface-variant hover:text-primary transition-colors">
            Voltar
          </Link>
        </div>
      </header>

      {/* Banner de Incentivo ao Cadastro do Cliente (Item 7) */}
      <section className="w-full max-w-3xl mx-auto mb-6 bg-gradient-to-r from-primary/15 via-surface-container to-surface-container border border-primary/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg">person_add</span>
          </div>
          <div>
            <h3 className="font-bold text-xs text-on-surface">Quer acompanhar seus agendamentos em tempo real?</h3>
            <p className="text-[11px] text-on-surface-variant">
              Crie sua conta para historicos e prontuário. O cadastro é opcional e você pode agendar abaixo normalmente!
            </p>
          </div>
        </div>

        <Link
          href="/auth/register"
          className="px-3.5 py-2 bg-primary text-on-primary font-bold text-xs rounded-xl hover:brightness-110 transition-all shrink-0 w-full sm:w-auto text-center"
        >
          Criar Conta Grátis
        </Link>
      </section>

      {/* Main Form Container */}
      <main className="w-full max-w-3xl mx-auto bg-surface-container border border-hairline-border rounded-3xl p-6 md:p-10 extruded-shadow flex-1 flex flex-col gap-8">
        {/* Progress Bar */}
        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-500 shadow-[0_0_10px_rgba(78,222,163,0.5)]"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {/* STEP 1: Select Service */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-caption font-label-bold text-primary uppercase tracking-widest block mb-1">Passo 1 de 4</span>
              <h2 className="text-headline-md font-bold text-on-surface">Selecione o Serviço para seu Pet</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    selectedService.id === s.id
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

            <button
              onClick={() => setStep(2)}
              className="w-full bg-primary text-on-primary font-label-bold py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
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

            <div>
              <label className="block text-caption font-label-bold text-on-surface-variant mb-2">Profissional Preferencial</label>
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className="w-full bg-elevated-card border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none cursor-pointer"
              >
                <option value="Qualquer Profissional Disponível">Qualquer Profissional Disponível</option>
                <option value="Ana Silva (Tosadora Sênior)">Ana Silva (Tosadora Sênior)</option>
                <option value="Dr. Carlos Eduardo (Veterinário)">Dr. Carlos Eduardo (Veterinário)</option>
              </select>
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

        {/* STEP 3: Customer & Pet Data */}
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
                  placeholder="Ex: Thor"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  required
                  className="w-full bg-elevated-card border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-caption font-label-bold text-on-surface-variant mb-1.5">Raça do Pet</label>
                <input
                  type="text"
                  placeholder="Ex: Golden Retriever"
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                  className="w-full bg-elevated-card border border-hairline-border rounded-xl px-4 py-3 text-on-surface text-body-sm outline-none focus:border-primary"
                />
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
                Seu horário para <strong className="text-primary">{selectedService.name}</strong> do pet <strong>{petName}</strong> foi reservado para o dia <strong>{selectedDate} às {selectedTime}</strong>.
              </p>
            </div>

            <div className="bg-elevated-card border border-hairline-border p-5 rounded-2xl w-full text-left space-y-2 text-body-sm text-on-surface-variant max-w-md">
              <p className="flex justify-between"><span>Serviço:</span> <strong className="text-on-surface">{selectedService.name}</strong></p>
              <p className="flex justify-between"><span>Valor:</span> <strong className="text-primary font-bold">R$ {selectedService.price.toFixed(2).replace(".", ",")}</strong></p>
              <p className="flex justify-between"><span>Tutor:</span> <strong className="text-on-surface">{tutorName}</strong></p>
              <p className="flex justify-between"><span>Profissional:</span> <strong className="text-on-surface">{selectedProfessional}</strong></p>
            </div>

            <button
              onClick={openWhatsAppConfirmation}
              className="w-full max-w-md bg-emerald-500 text-black font-label-bold py-4 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer text-body-base"
            >
              <span className="material-symbols-outlined">chat</span>
              Enviar Confirmação por WhatsApp
            </button>

            {/* CTA Secundário para Cadastro do Tutor */}
            <div className="pt-4 border-t border-hairline-border/60 max-w-md w-full text-center space-y-2">
              <p className="text-xs text-on-surface-variant">
                Deseja criar sua senha para gerenciar seus agendamentos no app?
              </p>
              <Link
                href={`/auth/register?phone=${tutorPhone}`}
                className="text-xs font-bold text-primary hover:underline inline-block"
              >
                Concluir meu cadastro no SaaS Petshop →
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
