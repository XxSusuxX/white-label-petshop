"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlobalHeader from "@/components/GlobalHeader";

export default function SocialPetSetupPage() {
  const router = useRouter();
  const [petPhoto, setPetPhoto] = useState<string | null>(null);
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("cachorro");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState("Macho");
  const [birthDate, setBirthDate] = useState("");
  const [weight, setWeight] = useState("");
  const [pelagem, setPelagem] = useState("curta");
  const [color, setColor] = useState("");
  const [isCastrated, setIsCastrated] = useState(false);
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPetPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handlePetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccessModal(true);
    }, 1200);
  };

  const handleResetForm = () => {
    setPetPhoto(null);
    setPetName("");
    setBreed("");
    setWeight("");
    setColor("");
    setNotes("");
    setIsCastrated(false);
    alert("Formulário limpo para cadastrar outro pet!");
  };

  return (
    <div className="bg-matte-canvas text-on-surface font-body-base selection:bg-primary/30 min-h-screen flex flex-col">
      <GlobalHeader />
      {/* Header / Progress Bar */}
      <header className="w-full bg-surface py-6 px-margin-mobile md:px-margin-desktop border-b border-hairline-border z-10 sticky top-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-headline-md text-headline-md font-bold text-primary">
              SaaS Portal
            </Link>
            <span className="text-outline">/</span>
            <span className="font-label-bold text-label-bold text-on-surface uppercase tracking-widest">
              Cadastro do Pet
            </span>
          </div>
          <div className="flex-1 max-w-md w-full">
            <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full shadow-[0_0_10px_rgba(78,222,163,0.5)] transition-all duration-1000 ease-out"></div>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-caption font-caption text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                100% Concluído
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg gap-gutter lg:gap-12 overflow-hidden">
        {/* Left Column: Visuals & Benefits */}
        <section className="flex-1 flex flex-col justify-center gap-stack-lg order-2 lg:order-1">
          <div className="relative group rounded-xl overflow-hidden extruded-shadow bg-elevated-card border border-hairline-border p-4 transition-transform duration-500 hover:scale-[1.01]">
            <img
              alt="Pet lifestyle image"
              className="w-full h-auto rounded-lg object-cover"
              src="/assets/img-cadastro-google2-cli.png"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <div className="bg-primary/10 backdrop-blur-md border border-primary/20 px-4 py-2 rounded-full inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full pulse-node"></span>
                <span className="text-label-bold font-label-bold text-primary">
                  Seu novo melhor amigo digital
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-headline-md text-headline-md text-on-surface">Vantagens Exclusivas</h3>
            <ul className="space-y-stack-md">
              <li className="flex items-start gap-4 p-4 rounded-xl border border-hairline-border bg-surface-container-low transition-colors hover:bg-surface-container">
                <div className="bg-primary-container/10 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-primary">history_edu</span>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface">Histórico de saúde</p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    Acompanhamento completo de vacinas e consultas.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-xl border border-hairline-border bg-surface-container-low transition-colors hover:bg-surface-container">
                <div className="bg-primary-container/10 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-primary">calendar_month</span>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface">Agenda de banhos</p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    Nunca esqueça do bem-estar do seu pet.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4 p-4 rounded-xl border border-hairline-border bg-surface-container-low transition-colors hover:bg-surface-container">
                <div className="bg-primary-container/10 p-2 rounded-lg">
                  <span className="material-symbols-outlined text-primary">camera_alt</span>
                </div>
                <div>
                  <p className="font-label-bold text-label-bold text-on-surface">Fotos em tempo real</p>
                  <p className="font-caption text-caption text-on-surface-variant">
                    Receba atualizações visuais durante o cuidado.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Right Column: Registration Form */}
        <section className="flex-1 order-1 lg:order-2">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-6 md:p-10 extruded-shadow flex flex-col gap-stack-lg">
            <div className="flex flex-col gap-2">
              <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                Quase lá! Fale sobre seu pet
              </h2>
              <p className="text-body-base font-body-base text-on-surface-variant">
                Precisamos desses detalhes para personalizar a experiência do seu parceiro.
              </p>
            </div>

            {/* Photo Upload Section */}
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
                className="relative w-24 h-24 rounded-full bg-surface-container-high border-2 border-dashed border-outline-variant flex items-center justify-center group cursor-pointer overflow-hidden transition-all hover:border-primary"
              >
                {petPhoto ? (
                  <img src={petPhoto} alt="Preview da foto do pet" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-outline-variant text-4xl group-hover:text-primary transition-colors">
                    photo_camera
                  </span>
                )}
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-elevated-card text-on-primary">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </div>
              </label>
              <span className="text-label-bold text-on-surface-variant">Foto do Pet</span>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-stack-md" onSubmit={handlePetSubmit}>
              {/* Pet Name */}
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
              </div>

              {/* Species */}
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

              {/* Breed */}
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

              {/* Sex (Toggle) */}
              <div className="md:col-span-2 flex flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface">Sexo</label>
                <div className="flex bg-surface-container-lowest p-1 rounded-xl border border-hairline-border radio-toggle">
                  <button
                    type="button"
                    onClick={() => setSex("Macho")}
                    className={`flex-1 text-center py-2 rounded-lg font-label-bold text-label-bold transition-all ${sex === "Macho" ? "bg-primary text-on-primary" : "text-on-surface-variant"
                      }`}
                  >
                    Macho
                  </button>
                  <button
                    type="button"
                    onClick={() => setSex("Fêmea")}
                    className={`flex-1 text-center py-2 rounded-lg font-label-bold text-label-bold transition-all ${sex === "Fêmea" ? "bg-primary text-on-primary" : "text-on-surface-variant"
                      }`}
                  >
                    Fêmea
                  </button>
                </div>
              </div>

              {/* Birth Date */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface" htmlFor="birth_date">
                  Data de Nascimento (Aproximada)
                </label>
                <input
                  className="bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface transition-all outline-none cursor-pointer"
                  id="birth_date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              {/* Weight */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-bold text-label-bold text-on-surface" htmlFor="weight">
                  Peso (kg)
                </label>
                <input
                  className="bg-surface-container-lowest border border-hairline-border rounded-xl px-4 py-3 text-on-surface placeholder:text-outline transition-all outline-none"
                  id="weight"
                  placeholder="Ex: 12.5"
                  step="0.1"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              {/* Fur / Pelagem */}
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

              {/* Color */}
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

              {/* Castrated Checkbox */}
              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <input
                  className="w-5 h-5 rounded bg-surface-container-lowest border-hairline-border text-primary focus:ring-primary cursor-pointer"
                  id="castrated"
                  type="checkbox"
                  checked={isCastrated}
                  onChange={(e) => setIsCastrated(e.target.checked)}
                />
                <label className="font-body-base text-body-base text-on-surface cursor-pointer" htmlFor="castrated">
                  Meu pet é castrado
                </label>
              </div>

              {/* Special Notes */}
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

              {/* Actions */}
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
        </section>
      </main>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-primary/30 rounded-3xl p-8 max-w-md w-full text-center extruded-shadow emerald-glow-effect flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2">
              <span className="material-symbols-outlined text-5xl">pets</span>
            </div>
            <h3 className="text-headline-md font-headline-md font-bold text-on-surface">
              Cadastro Concluído com Sucesso!
            </h3>
            <p className="text-body-base text-on-surface-variant">
              Seu pet foi registrado no portal. Você desbloqueou o cupom de 10% OFF e a badge de Tutor Iniciante!
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-primary text-on-primary font-label-bold py-4 rounded-xl extruded-shadow hover:brightness-110 transition-all mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ir para o Dashboard</span>
              <span className="material-symbols-outlined">dashboard</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
