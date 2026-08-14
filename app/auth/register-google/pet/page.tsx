"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { petSchema } from "@/lib/validations/onboarding";
import OnboardingLayout from "@/components/ui/OnboardingLayout";
import { formatFloatInput } from "@/lib/utils/formatters";

export default function RegisterGooglePetStepPage() {
  const router = useRouter();
  const [petPhoto, setPetPhoto] = useState<string | null>(null);
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("cachorro");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState<"Macho" | "Fêmea">("Macho");
  const [ageYears, setAgeYears] = useState("0");
  const [ageMonths, setAgeMonths] = useState("0");
  const [weight, setWeight] = useState("");
  const [pelagem, setPelagem] = useState("curta");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; weight?: string }>({});

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPetPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handlePetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationResult = petSchema.safeParse({
      name: petName,
      species,
      breed,
      gender: sex,
      ageYears,
      weight,
      notes,
    });

    if (!validationResult.success) {
      const formattedErrors: { name?: string; weight?: string } = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0] === "name") formattedErrors.name = err.message;
        if (err.path[0] === "weight") formattedErrors.weight = err.message;
      });
      setErrors(formattedErrors);
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const mappedSpecies = species === "gato" ? "Gato" : species === "outro" ? "Outro" : "Cachorro";

      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: petName,
          species: mappedSpecies,
          breed: breed || "Vira-lata",
          sex: sex,
          weight: weight ? parseFloat(weight) : null,
          coat: pelagem,
          color: color,
          photo_url: petPhoto,
          age_years: ageYears,
          age_months: ageMonths,
          observations: notes.trim() || null,
        }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        console.error("Erro ao salvar pet:", resData.error);
        alert("Atenção: Não foi possível salvar o pet (" + (resData.error || "Erro desconhecido") + "). Você poderá tentar novamente no painel.");
      }
    }

    setIsLoading(false);
    window.location.href = "/client";
  };

  const handleResetForm = () => {
    setPetPhoto(null);
    setPetName("");
    setBreed("");
    setAgeYears("0");
    setAgeMonths("0");
    setWeight("");
    setColor("");
    setNotes("");
    alert("Formulário limpo para cadastrar outro pet!");
  };

  return (
    <OnboardingLayout step={2} stepTitle="Cadastro do Pet (Google)" progressPercent={100}>
      <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 md:p-10 extruded-shadow flex flex-col gap-stack-lg">
        <div className="flex flex-col gap-2">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
            Quase lá! Fale sobre seu pet
          </h2>
          <p className="text-body-base font-body-base text-on-surface-variant">
            Precisamos desses detalhes para personalizar a experiência do seu parceiro.
          </p>
        </div>

        {/* Upload de Foto */}
        <div className="flex flex-col items-center gap-2 py-2">
          <input
            type="file"
            id="pet-photo-file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <label
            htmlFor="pet-photo-file"
            className="relative w-24 h-24 cursor-pointer group flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full bg-surface-container-high border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden transition-all group-hover:border-primary">
              {petPhoto ? (
                <img src={petPhoto} alt="Preview da foto do pet" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-outline-variant text-4xl group-hover:text-primary transition-colors">
                  photo_camera
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 z-10 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-elevated-card text-on-primary shadow-md">
              <span className="material-symbols-outlined text-lg font-bold">add</span>
            </div>
          </label>
          <span className="text-label-bold text-on-surface-variant">Foto do Pet</span>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-stack-md" onSubmit={handlePetSubmit}>
          {/* Nome do Pet */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="pet_name">
              Nome do Pet
            </label>
            <input
              className="bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface placeholder:text-outline transition-all outline-none"
              id="pet_name"
              placeholder="Ex: Thor, Mel, Luna..."
              type="text"
              required
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.name}
              </p>
            )}
          </div>

          {/* Espécie */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="pet_type">
              Espécie
            </label>
            <select
              className="bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface appearance-none transition-all cursor-pointer outline-none"
              id="pet_type"
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
            >
              <option value="cachorro">Cachorro</option>
              <option value="gato">Gato</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          {/* Raça */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="breed">
              Raça
            </label>
            <input
              className="bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface placeholder:text-outline transition-all outline-none"
              id="breed"
              placeholder="Ex: Golden Retriever"
              type="text"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
            />
          </div>

          {/* Sexo */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface">Sexo</label>
            <div className="flex bg-surface-container-lowest p-1 rounded-xl border border-hairline-border radio-toggle">
              <button
                type="button"
                onClick={() => setSex("Macho")}
                className={`flex-1 text-center py-2 rounded-lg font-label-bold text-label-bold transition-all ${
                  sex === "Macho" ? "bg-primary text-on-primary" : "text-on-surface-variant"
                }`}
              >
                Macho
              </button>
              <button
                type="button"
                onClick={() => setSex("Fêmea")}
                className={`flex-1 text-center py-2 rounded-lg font-label-bold text-label-bold transition-all ${
                  sex === "Fêmea" ? "bg-primary text-on-primary" : "text-on-surface-variant"
                }`}
              >
                Fêmea
              </button>
            </div>
          </div>

          {/* Idade Aproximada */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface">Idade Aproximada</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="age_years" className="text-[10px] text-on-surface-variant font-bold uppercase block mb-0.5">
                  Anos
                </label>
                <select
                  id="age_years"
                  value={ageYears}
                  onChange={(e) => setAgeYears(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-3 py-3 text-on-surface transition-all outline-none cursor-pointer"
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i} value={i}>{i} {i === 1 ? "ano" : "anos"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="age_months" className="text-[10px] text-on-surface-variant font-bold uppercase block mb-0.5">
                  Meses
                </label>
                <select
                  id="age_months"
                  value={ageMonths}
                  onChange={(e) => setAgeMonths(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-3 py-3 text-on-surface transition-all outline-none cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>{i} {i === 1 ? "mês" : "meses"}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Peso */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="weight">
              Peso
            </label>
            <div>
              <label htmlFor="weight" className="text-[10px] text-on-surface-variant font-bold uppercase block mb-0.5">
                Quilogramas (kg)
              </label>
              <input
                className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface placeholder:text-outline transition-all outline-none focus:border-primary"
                id="weight"
                placeholder="Ex: 2.5"
                type="text"
                inputMode="decimal"
                maxLength={4}
                value={weight}
                onChange={(e) => setWeight(formatFloatInput(e.target.value))}
              />
            </div>
            {errors.weight && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.weight}
              </p>
            )}
          </div>

          {/* Pelagem */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="pelagem">
              Pelagem
            </label>
            <select
              className="bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface appearance-none transition-all cursor-pointer outline-none"
              id="pelagem"
              value={pelagem}
              onChange={(e) => setPelagem(e.target.value)}
            >
              <option value="curta">Curta</option>
              <option value="media">Média</option>
              <option value="longa">Longa</option>
            </select>
          </div>

          {/* Cor Predominante */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="color">
              Cor Predominante
            </label>
            <input
              className="bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface placeholder:text-outline transition-all outline-none"
              id="color"
              placeholder="Ex: Caramelo e Branco"
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>

          {/* Observações */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="font-label-bold text-label-bold text-on-surface" htmlFor="notes">
              Observações (Saúde, comportamento...)
            </label>
            <textarea
              className="bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface placeholder:text-outline resize-none transition-all outline-none"
              id="notes"
              placeholder="Alergias, comportamentos ou necessidades específicas..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>

          {/* Botões de Ação */}
          <div className="md:col-span-2 pt-6 flex flex-col gap-4">
            <button
              className="w-full bg-primary text-on-primary font-label-bold text-label-bold py-4 rounded-xl flex items-center justify-center gap-2 extruded-shadow emerald-glow-effect hover:brightness-110 active:scale-[0.98] transition-all group cursor-pointer"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Processando...
                </>
              ) : (
                <>
                  Concluir e Começar
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </>
              )}
            </button>

            <button
              className="w-full bg-transparent border border-hairline-border text-on-surface font-label-bold text-label-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container transition-all cursor-pointer"
              type="button"
              onClick={handleResetForm}
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Adicionar outro pet
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-2 pt-2 border-t border-hairline-border mt-4">
          <span className="material-symbols-outlined text-outline text-[18px]">verified_user</span>
          <p className="text-caption font-caption text-outline">
            Seus dados estão protegidos pela nossa Política de Privacidade.
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
}
