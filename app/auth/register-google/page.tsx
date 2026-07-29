"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlobalHeader from "@/components/GlobalHeader";

export default function RegisterGooglePage() {
  const router = useRouter();
  const [tutorName, setTutorName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedObjective, setSelectedObjective] = useState<string>("agendar");
  const [petCount, setPetCount] = useState<string>("1");

  const handlePhoneMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    v = v.substring(0, 11);
    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (v.length > 5) {
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{0,5})$/, "($1) $2");
    }
    setWhatsapp(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/auth/pet-register");
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-0 bg-matte-canvas text-on-surface">
      <GlobalHeader />
      <div className="w-full flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        {/* Progress Header */}
        <header className="w-full max-w-6xl mx-auto mb-8 flex items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-primary font-headline-md text-headline-md font-bold">
              SaaS Portal
            </Link>
            <span className="text-outline">/</span>
            <span className="text-label-bold font-label-bold text-on-surface-variant tracking-wider uppercase">
              Cadastro do Tutor (Google)
            </span>
          </div>
          <div className="flex-1 flex flex-col items-end gap-2">
            <div className="w-full max-w-md h-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                id="progress-fill"
                className="h-full bg-primary transition-all duration-1000"
                style={{ width: "50%" }}
              ></div>
            </div>
            <div className="flex items-center gap-1.5 text-primary">
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'wght' 700" }}
              >
                check_circle
              </span>
              <span className="text-caption font-label-bold uppercase tracking-wider">
                50% Concluído
              </span>
            </div>
          </div>
        </header>

        <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Side: Gamified Rewards */}
          <section className="bg-elevated-card border border-hairline-border rounded-3xl p-8 md:p-12 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-glow opacity-10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="floating mb-6 inline-block">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-surface-container flex items-center justify-center relative border-4 border-primary/20">
                  <img
                    className="w-full h-full object-cover rounded-full"
                    alt="Friendly pets interacting with a holographic dashboard"
                    src="/assets/img-cadastro-google-cli.png"
                  />
                  {/* Mini Badge Overlay */}
                  <div className="absolute -bottom-2 -right-2 bg-primary-container text-on-primary px-4 py-2 rounded-xl font-label-bold text-label-bold shadow-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">workspace_premium</span>
                    RECOMPENSA
                  </div>
                </div>
              </div>
              <h1 className="text-headline-md font-headline-md text-on-surface mb-4">
                Você ganhou um presente!
              </h1>
              <p className="text-body-base font-body-base text-on-surface-variant mb-10 max-w-sm mx-auto">
                Complete seu perfil agora para desbloquear estas vantagens exclusivas de boas-vindas.
              </p>
              <div className="space-y-4 w-full text-left">
                {/* Reward Item 1 */}
                <div className="bg-surface-container-high border border-hairline-border p-4 rounded-2xl flex items-center gap-4 transition-transform hover:scale-[1.02]">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      stars
                    </span>
                  </div>
                  <div>
                    <p className="text-label-bold font-label-bold text-on-surface">
                      Badge: Tutor Iniciante
                    </p>
                    <p className="text-caption font-caption text-on-surface-variant">
                      Mostre seu cuidado para a comunidade.
                    </p>
                  </div>
                </div>
                {/* Reward Item 2 */}
                <div className="bg-surface-container-high border border-hairline-border p-4 rounded-2xl flex items-center gap-4 transition-transform hover:scale-[1.02]">
                  <div className="w-12 h-12 rounded-full bg-warning-amber/10 flex items-center justify-center text-warning-amber">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      content_cut
                    </span>
                  </div>
                  <div>
                    <p className="text-label-bold font-label-bold text-on-surface">
                      10% OFF no Primeiro Banho
                    </p>
                    <p className="text-caption font-caption text-on-surface-variant">
                      Válido para qualquer parceiro do portal.
                    </p>
                  </div>
                </div>
                {/* Reward Item 3 */}
                <div className="bg-surface-container-high border border-hairline-border p-4 rounded-2xl flex items-center gap-4 transition-transform hover:scale-[1.02]">
                  <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      checklist
                    </span>
                  </div>
                  <div>
                    <p className="text-label-bold font-label-bold text-on-surface">
                      Checklist de Saúde Personalizada
                    </p>
                    <p className="text-caption font-caption text-on-surface-variant">
                      Baseado na raça e idade do seu pet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Side: Form */}
          <section className="bg-surface-container border border-hairline-border rounded-3xl p-8 md:p-12 flex flex-col justify-center">
            <header className="mb-8">
              <h2 className="text-headline-md font-headline-md text-on-surface mb-2">
                Cadastro do Tutor
              </h2>
              <p className="text-body-base font-body-base text-on-surface-variant">
                Personalize sua experiência em segundos.
              </p>
            </header>
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Name Field */}
              <div>
                <label className="block text-label-bold font-label-bold text-on-surface mb-3">
                  COMO DEVEMOS TE CHAMAR?
                </label>
                <input
                  className="w-full bg-elevated-card border border-hairline-border rounded-xl px-4 py-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="Ex: Carlos ou Tutor do Max"
                  type="text"
                  required
                  value={tutorName}
                  onChange={(e) => setTutorName(e.target.value)}
                />
              </div>
              {/* WhatsApp Field */}
              <div>
                <label className="block text-label-bold font-label-bold text-on-surface mb-3">
                  QUAL O SEU WHATSAPP?
                </label>
                <input
                  className="w-full bg-elevated-card border border-hairline-border rounded-xl px-4 py-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="(11) 99999-9999"
                  required
                  type="tel"
                  value={whatsapp}
                  onChange={handlePhoneMask}
                />
              </div>
              {/* Objective Field */}
              <div>
                <label className="block text-label-bold font-label-bold text-on-surface mb-3">
                  QUAL O SEU PRINCIPAL OBJETIVO HOJE?
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedObjective("agendar")}
                    className={`objective-opt group flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${selectedObjective === "agendar"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-hairline-border bg-elevated-card hover:border-primary/50"
                      }`}
                  >
                    <span
                      className={`material-symbols-outlined transition-colors ${selectedObjective === "agendar" ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
                        }`}
                    >
                      calendar_month
                    </span>
                    <span className="text-body-base font-body-base text-on-surface">
                      Agendar um serviço
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedObjective("vacinas")}
                    className={`objective-opt group flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${selectedObjective === "vacinas"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-hairline-border bg-elevated-card hover:border-primary/50"
                      }`}
                  >
                    <span
                      className={`material-symbols-outlined transition-colors ${selectedObjective === "vacinas" ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
                        }`}
                    >
                      vaccines
                    </span>
                    <span className="text-body-base font-body-base text-on-surface">
                      Controlar vacinas e saúde
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedObjective("produtos")}
                    className={`objective-opt group flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${selectedObjective === "produtos"
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-hairline-border bg-elevated-card hover:border-primary/50"
                      }`}
                  >
                    <span
                      className={`material-symbols-outlined transition-colors ${selectedObjective === "produtos" ? "text-primary" : "text-on-surface-variant group-hover:text-primary"
                        }`}
                    >
                      shopping_bag
                    </span>
                    <span className="text-body-base font-body-base text-on-surface">
                      Comprar produtos premium
                    </span>
                  </button>
                </div>
              </div>

              {/* Number of Pets */}
              <div>
                <label className="block text-label-bold font-label-bold text-on-surface mb-3">
                  QUANTOS PETS VOCÊ TEM?
                </label>
                <div className="flex flex-wrap gap-3">
                  {["1", "2", "3", "4", "5+"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPetCount(num)}
                      className={`pet-count-opt w-12 h-12 flex items-center justify-center rounded-xl border font-label-bold transition-all ${petCount === num
                        ? "border-primary bg-primary text-on-primary"
                        : "border-hairline-border bg-elevated-card text-on-surface hover:border-primary"
                        }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-primary-container text-on-primary font-label-bold text-body-lg py-5 rounded-2xl extruded-shadow pulse-emerald transition-all flex items-center justify-center gap-3 active:scale-[0.98] cursor-pointer"
                >
                  Ir para Cadastro do Pet <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <p className="text-center mt-4 text-caption font-caption text-outline">
                  Ao clicar, você concorda com nossos Termos de Uso.
                </p>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
