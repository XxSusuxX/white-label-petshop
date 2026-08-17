"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlobalHeader from "@/components/GlobalHeader";
import GoogleButton from "@/components/ui/GoogleButton";
import { createClient } from "@/lib/supabase/client";
import { formatPhone, formatCpf } from "@/lib/utils/formatters";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkExistingSession() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, full_name, phone")
          .eq("id", user.id)
          .maybeSingle();

        if (profile && profile.full_name?.trim() && profile.phone?.trim()) {
          const isStaff = ["admin", "dono", "veterinario", "recepcionista", "entregador"].includes(profile.role);
          window.location.href = isStaff ? "/admin/dashboard" : "/client";
        }
      }
    }
    checkExistingSession();
  }, [router]);
  
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("Cachorro");
  const [breed, setBreed] = useState("");
  const [sex, setSex] = useState("Macho");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      // 1. Criar usuário e perfil no backend com tenant_id e role vinculados
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          petName,
          species,
          breed,
          sex,
        }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        setIsLoading(false);
        alert("Erro ao criar conta: " + (resData.error || "Erro desconhecido"));
        return;
      }

      // 2. Fazer login no cliente para autenticar a sessão
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setIsLoading(false);
        alert("Conta criada! Por favor, faça login com seu e-mail e senha.");
        window.location.href = "/auth/login";
        return;
      }

      setIsLoading(false);
      window.location.href = "/client";
    } catch (err: any) {
      setIsLoading(false);
      alert("Erro ao criar conta. Tente novamente.");
    }
  };

  return (
    <div className="font-body-base text-body-base selection:bg-primary-container selection:text-on-primary-container bg-background min-h-screen">
      <GlobalHeader />
      <main className="flex min-h-[calc(100vh-50px)]">
        {/* Left Column: Institutional (Hidden on Mobile) */}
        <section className="hidden lg:flex lg:w-[45%] bg-matte-canvas p-margin-desktop flex-col justify-between relative overflow-hidden border-r border-hairline-border">
          {/* Background Decorative Glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-glow opacity-20 blur-[100px] pointer-events-none"></div>

          {/* Top section: Logo & Identity */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center extruded-shadow">
                <span
                  className="material-symbols-outlined text-on-primary-container text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  pets
                </span>
              </div>
              <div>
                <h1 className="font-headline-md text-headline-md font-bold text-primary leading-none">
                  SaaS Portal
                </h1>
                <p className="font-caption text-caption text-on-surface-variant mt-1">
                  Precise pet care management.
                </p>
              </div>
            </div>
          </div>

          {/* Middle: Illustration */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-full max-w-md aspect-square bg-surface-container rounded-3xl overflow-hidden border border-hairline-border extruded-shadow emerald-glow-effect mb-8 group">
              <img
                className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500"
                alt="Friendly dog and cat with a floating digital gift box"
                src="/assets/img-cadastro-cli.png"
              />
            </div>
            <div className="text-center">
              <h2 className="font-headline-lg text-headline-lg text-primary mb-4">
                Crie sua conta e resgate benefícios exclusivos para o seu pet
              </h2>
              <p className="text-on-surface-variant max-w-sm mx-auto">
                A tecnologia que transforma a rotina de cuidados do seu melhor amigo em uma experiência simples e segura.
              </p>
            </div>
          </div>

          {/* Bottom: Benefits */}
          <div className="relative z-10 grid grid-cols-1 gap-y-4 max-w-sm">
            <div className="flex items-center gap-3 group">
              <span
                className="material-symbols-outlined text-primary-fixed-dim bg-primary-container/10 p-1.5 rounded-full"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <span className="font-label-muted text-label-muted text-on-surface group-hover:text-primary transition-colors">
                Agende serviços online
              </span>
            </div>
            <div className="flex items-center gap-3 group">
              <span
                className="material-symbols-outlined text-primary-fixed-dim bg-primary-container/10 p-1.5 rounded-full"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <span className="font-label-muted text-label-muted text-on-surface group-hover:text-primary transition-colors">
                Acompanhe o histórico do seu pet
              </span>
            </div>
            <div className="flex items-center gap-3 group">
              <span
                className="material-symbols-outlined text-primary-fixed-dim bg-primary-container/10 p-1.5 rounded-full"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <span className="font-label-muted text-label-muted text-on-surface group-hover:text-primary transition-colors">
                Carteira de vacinação digital
              </span>
            </div>
            <div className="flex items-center gap-3 group">
              <span
                className="material-symbols-outlined text-primary-fixed-dim bg-primary-container/10 p-1.5 rounded-full"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <span className="font-label-muted text-label-muted text-on-surface group-hover:text-primary transition-colors">
                Receba lembretes automáticos
              </span>
            </div>
            <div className="flex items-center gap-3 group">
              <span
                className="material-symbols-outlined text-primary-fixed-dim bg-primary-container/10 p-1.5 rounded-full"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <span className="font-label-muted text-label-muted text-on-surface group-hover:text-primary transition-colors">
                Histórico completo sempre disponível
              </span>
            </div>
          </div>
        </section>

        {/* Right Column: Form Area */}
        <section className="w-full lg:w-[55%] bg-background p-margin-mobile md:p-margin-desktop overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-2xl">
            {/* Mobile Header */}
            <div className="flex items-center gap-3 lg:hidden mb-10">
              <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center extruded-shadow">
                <span
                  className="material-symbols-outlined text-on-primary-container text-xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  pets
                </span>
              </div>
              <h1 className="font-headline-md text-headline-md font-bold text-primary">PetNexus</h1>
            </div>

            {/* Registration Card */}
            <div className="bg-elevated-card rounded-xl p-6 md:p-8 border border-hairline-border extruded-shadow">
              <header className="mb-8">
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-2">
                  Criar sua conta
                </h2>
                <p className="text-on-surface-variant">
                  Cadastre-se gratuitamente para gerenciar seu pet e acompanhar todos os atendimentos em um só lugar.
                </p>
              </header>

              {/* Social Login */}
              <GoogleButton text="Cadastrar com Google" className="mb-6" />

              <div className="relative flex items-center justify-center mb-8">
                <div className="w-full h-px bg-hairline-border"></div>
                <span className="absolute px-4 bg-elevated-card text-caption font-caption text-outline">
                  ou continue com seu e-mail
                </span>
              </div>

              {/* Form */}
              <form className="space-y-stack-lg" onSubmit={handleSubmit}>
                {/* Section: Tutor Info */}
                <div className="space-y-4">
                  <h3 className="font-label-bold text-label-bold text-primary-fixed-dim uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">person</span>
                    Dados do Tutor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block font-label-muted text-label-muted text-on-surface-variant mb-1.5">
                        Nome Completo
                      </label>
                      <input
                        className="w-full bg-surface-container border border-hairline-border rounded-lg p-3 text-on-surface focus:ring-0 outline-none"
                        placeholder="Ex: João Silva"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-label-muted text-label-muted text-on-surface-variant mb-1.5">
                        E-mail
                      </label>
                      <input
                        className="w-full bg-surface-container border border-hairline-border rounded-lg p-3 text-on-surface focus:ring-0 outline-none"
                        placeholder="joao@exemplo.com"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-label-muted text-label-muted text-on-surface-variant mb-1.5">
                        Telefone
                      </label>
                      <input
                        className="w-full bg-surface-container border border-hairline-border rounded-lg p-3 text-on-surface focus:ring-0 outline-none"
                        placeholder="(00) 00000-0000"
                        type="text"
                        required
                        value={phone}
                        onChange={handlePhoneChange}
                      />
                    </div>
                    <div>
                      <label className="block font-label-muted text-label-muted text-on-surface-variant mb-1.5">
                        CPF (Opcional)
                      </label>
                      <input
                        className="w-full bg-surface-container border border-hairline-border rounded-lg p-3 text-on-surface focus:ring-0 outline-none"
                        placeholder="000.000.000-00"
                        type="text"
                        value={cpf}
                        onChange={handleCpfChange}
                      />
                    </div>
                    <div>
                      <label className="block font-label-muted text-label-muted text-on-surface-variant mb-1.5">
                        Senha
                      </label>
                      <input
                        className="w-full bg-surface-container border border-hairline-border rounded-lg p-3 text-on-surface focus:ring-0 outline-none"
                        placeholder="••••••••"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Pet Info */}
                <div className="pt-6 border-t border-hairline-border space-y-6">
                  <div>
                    <h3 className="font-label-bold text-label-bold text-primary-fixed-dim uppercase tracking-wider flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-lg">pets</span>
                      Cadastre seu primeiro pet
                    </h3>
                    <p className="text-caption font-caption text-outline">Poderá adicionar mais pets depois.</p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Photo Upload */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 md:w-40 md:h-40 bg-surface-container border-2 border-dashed border-hairline-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-all group overflow-hidden relative">
                        <div className="flex flex-col items-center group-hover:scale-105 transition-transform">
                          <span className="material-symbols-outlined text-outline group-hover:text-primary mb-2 text-3xl">
                            add_a_photo
                          </span>
                          <span className="font-caption text-caption text-outline text-center px-4">Foto do Pet</span>
                        </div>
                      </div>
                    </div>

                    {/* Pet Fields */}
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block font-label-muted text-label-muted text-on-surface-variant mb-1.5">
                          Nome do Pet
                        </label>
                        <input
                          className="w-full bg-surface-container border border-hairline-border rounded-lg p-3 text-on-surface focus:ring-0 outline-none"
                          placeholder="Nome dele(a)"
                          type="text"
                          value={petName}
                          onChange={(e) => setPetName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block font-label-muted text-label-muted text-on-surface-variant mb-1.5">
                          Espécie
                        </label>
                        <select
                          className="w-full bg-surface-container border border-hairline-border rounded-lg p-3 text-on-surface focus:ring-0 outline-none"
                          value={species}
                          onChange={(e) => setSpecies(e.target.value)}
                        >
                          <option value="Cachorro">Cachorro</option>
                          <option value="Gato">Gato</option>
                          <option value="Ave">Ave</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-label-muted text-label-muted text-on-surface-variant mb-1.5">
                          Raça
                        </label>
                        <input
                          className="w-full bg-surface-container border border-hairline-border rounded-lg p-3 text-on-surface focus:ring-0 outline-none"
                          placeholder="Ex: Golden Retriever"
                          type="text"
                          value={breed}
                          onChange={(e) => setBreed(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block font-label-muted text-label-muted text-on-surface-variant mb-1.5">
                          Sexo
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSex("Macho")}
                            className={`flex-1 p-3 rounded-lg border font-bold text-xs transition-all ${
                              sex === "Macho"
                                ? "bg-primary text-on-primary border-primary"
                                : "bg-surface-container border-hairline-border text-on-surface-variant"
                            }`}
                          >
                            Macho
                          </button>
                          <button
                            type="button"
                            onClick={() => setSex("Fêmea")}
                            className={`flex-1 p-3 rounded-lg border font-bold text-xs transition-all ${
                              sex === "Fêmea"
                                ? "bg-primary text-on-primary border-primary"
                                : "bg-surface-container border-hairline-border text-on-surface-variant"
                            }`}
                          >
                            Fêmea
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-touch-target bg-primary text-on-primary font-label-bold text-lg rounded-lg extruded-shadow hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-8 cursor-pointer"
                >
                  Concluir Cadastro
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>

                <p className="text-center font-label-muted text-label-muted text-on-surface-variant mt-6">
                  Já tem conta?{" "}
                  <Link href="/auth/login" className="text-primary font-label-bold hover:underline">
                    Faça Login
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
