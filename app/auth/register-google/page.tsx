"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { tutorSchema } from "@/lib/validations/onboarding";
import OnboardingLayout from "@/components/ui/OnboardingLayout";
import { formatPhone } from "@/lib/utils/formatters";

export default function RegisterGooglePage() {
  const router = useRouter();
  const [tutorName, setTutorName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<string>("agendar");
  const [petCount, setPetCount] = useState<string>("1");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  useEffect(() => {
    async function loadGoogleUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (existingProfile) {
          router.replace(existingProfile.role === "admin" ? "/admin/pets" : "/client");
          return;
        }

        if (user.user_metadata) {
          const name = user.user_metadata.full_name || user.user_metadata.name || "";
          const avatar = user.user_metadata.avatar_url || user.user_metadata.picture || null;
          if (name) setTutorName(name);
          if (avatar) setGoogleAvatar(avatar);
        }
      }
      setIsChecking(false);
    }
    loadGoogleUser();
  }, [router]);

  const handlePhoneMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = tutorSchema.safeParse({
      fullName: tutorName,
      phone: whatsapp,
    });

    if (!result.success) {
      const formattedErrors: { fullName?: string; phone?: string } = {};
      result.error.issues.forEach((err) => {
        if (err.path[0] === "fullName") formattedErrors.fullName = err.message;
        if (err.path[0] === "phone") formattedErrors.phone = err.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const res = await fetch("/api/auth/register-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          fullName: tutorName,
          phone: whatsapp,
        }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        console.error("Erro ao cadastrar perfil:", resData.error);
        alert("Erro ao salvar cadastro: " + (resData.error || "Erro no servidor"));
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
    router.push("/auth/register-google/pet");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-matte-canvas text-on-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
          <p className="text-sm font-bold text-on-surface-variant">Verificando sua conta...</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingLayout step={1} stepTitle="Cadastro do Tutor (Google)" progressPercent={50}>
      <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 md:p-10 extruded-shadow flex flex-col gap-stack-lg">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Cadastro do Tutor
          </h2>
          <p className="text-body-base font-body-base text-on-surface-variant">
            Personalize sua experiência em segundos.
          </p>
        </div>

        {/* Google User Avatar Badge */}
        {googleAvatar && (
          <div className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <img src={googleAvatar} alt="Foto do perfil Google" className="w-12 h-12 rounded-full border-2 border-primary object-cover" />
            <div>
              <p className="font-label-bold text-label-bold text-on-surface">Conectado via Google</p>
              <p className="font-caption text-caption text-primary">Conta autenticada com sucesso</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Nome Completo */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="tutorName">
              Como devemos te chamar?
            </label>
            <input
              id="tutorName"
              type="text"
              required
              value={tutorName}
              onChange={(e) => setTutorName(e.target.value)}
              placeholder="Seu nome completo"
              className="bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface placeholder:text-outline outline-none"
            />
            {errors.fullName && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.fullName}
              </p>
            )}
          </div>

          {/* WhatsApp */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="whatsapp">
              Qual o seu WhatsApp?
            </label>
            <input
              id="whatsapp"
              type="text"
              required
              value={whatsapp}
              onChange={handlePhoneMask}
              placeholder="(11) 99999-9999"
              className="bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface placeholder:text-outline outline-none"
            />
            {errors.phone && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.phone}
              </p>
            )}
          </div>

          {/* Objetivo Principal */}
          <div className="flex flex-col gap-2">
            <label className="font-label-bold text-label-bold text-on-surface">
              Qual o seu principal objetivo hoje?
            </label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: "agendar", label: "Agendar um serviço", icon: "calendar_month" },
                { id: "saude", label: "Controlar vacinas e saúde", icon: "medical_services" },
                { id: "compras", label: "Comprar produtos premium", icon: "shopping_bag" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedObjective(item.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                    selectedObjective === item.id
                      ? "border-primary bg-primary/10 text-on-surface"
                      : "border-hairline-border bg-surface-container-lowest text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  <span className={`material-symbols-outlined ${selectedObjective === item.id ? "text-primary" : "text-outline"}`}>
                    {item.icon}
                  </span>
                  <span className="font-label-bold text-label-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantidade de Pets */}
          <div className="flex flex-col gap-2">
            <label className="font-label-bold text-label-bold text-on-surface">
              Quantos pets você possui?
            </label>
            <div className="flex gap-3">
              {["1", "2", "3+"].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPetCount(count)}
                  className={`flex-1 py-3 rounded-xl border font-bold transition-all text-center cursor-pointer ${
                    petCount === count
                      ? "border-primary bg-primary text-on-primary"
                      : "border-hairline-border bg-surface-container-lowest text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  {count} {count === "1" ? "Pet" : "Pets"}
                </button>
              ))}
            </div>
          </div>

          {/* Botão de Avançar para a Etapa 2 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-xl flex items-center justify-center gap-2 extruded-shadow emerald-glow-effect hover:brightness-110 active:scale-[0.98] transition-all group cursor-pointer mt-4"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Processando...
              </>
            ) : (
              <>
                <span>Avançar para o Cadastro do Pet</span>
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </OnboardingLayout>
  );
}
