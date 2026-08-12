"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import GlobalHeader from "@/components/GlobalHeader";
import GoogleButton from "@/components/ui/GoogleButton";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("existing") === "true") {
      setIsExistingAccount(true);
    }
    const err = searchParams.get("error");
    if (err) {
      setAuthError(err === "auth_failed" ? "Falha na autenticação. Por favor, tente novamente." : decodeURIComponent(err));
    }
  }, [searchParams]);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setIsLoading(false);
      if (!error) {
        router.push("/client");
      } else {
        setAuthError("Erro ao fazer login: " + error.message);
      }
    } catch (err) {
      setIsLoading(false);
      setAuthError("Erro ao fazer login. Tente novamente.");
    }
  };

  return (
    <div className="font-body-base text-body-base selection:bg-primary-container selection:text-on-primary-container min-h-screen bg-background">
      <GlobalHeader />
      <main className="flex min-h-[calc(100vh-50px)]">
        {/* Left Column: Hero Illustration (Hidden on Mobile) */}
        <section className="hidden lg:flex lg:w-[45%] bg-matte-canvas p-margin-desktop flex-col justify-center items-center relative overflow-hidden border-r border-hairline-border">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-glow opacity-20 blur-[100px] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center max-w-md text-center">
            <div className="w-full aspect-square bg-surface-container rounded-3xl overflow-hidden border border-hairline-border extruded-shadow emerald-glow-effect mb-10 group">
              <img
                alt="Login Illustration"
                className="w-full h-full object-cover grayscale-[0.1] group-hover:grayscale-0 transition-all duration-700"
                src="/assets/img-login-cli.png"
              />
            </div>
            <h2 className="font-headline-lg text-headline-lg text-primary mb-4">
              Acompanhe seu pet em tempo real
            </h2>
            <p className="text-on-surface-variant body-lg">
              Gerencie consultas, vacinas e o bem-estar do seu melhor amigo com a tecnologia e o carinho que nosso portal oferece.
            </p>
          </div>
        </section>

        {/* Right Column: Form Area */}
        <section className="w-full lg:w-[55%] bg-background p-margin-mobile md:p-margin-desktop overflow-y-auto flex flex-col justify-center items-center">
          <div className="w-full max-w-md">
            {/* Brand Logo */}
            <div className="flex flex-col items-center mb-10">
              <div className="w-14 h-14 bg-primary-container rounded-lg flex items-center justify-center extruded-shadow mb-4">
                <span
                  className="material-symbols-outlined text-on-primary-container text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  pets
                </span>
              </div>
              <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">
                PetNexus
              </h1>
              <span className="font-caption text-caption text-on-surface-variant uppercase tracking-widest mt-1">
                Gestão de Pet Shop
              </span>
            </div>

            {/* Login Card */}
            <div className="bg-elevated-card rounded-xl p-8 border border-hairline-border extruded-shadow">
              {authError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">error</span>
                  <span>{authError}</span>
                </div>
              )}

              {isExistingAccount && !authError && (
                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">warning</span>
                  <span>Sua conta do Google já possui um cadastro ativo! Por favor, faça login para continuar.</span>
                </div>
              )}

              <header className="mb-8 text-center">
                <h2 className="font-headline-md text-on-surface">Entrar como Cliente</h2>
                <p className="text-on-surface-variant mt-1">Bem-vindo de volta ao portal do seu pet</p>
              </header>

              {/* Social Login Button */}
              <GoogleButton className="mb-6" />

              <div className="relative flex items-center justify-center mb-8">
                <div className="w-full h-px bg-hairline-border"></div>
                <span className="absolute px-4 bg-elevated-card text-caption font-caption text-outline">
                  ou acesse com e-mail
                </span>
              </div>

              {/* Form */}
              <form className="space-y-6" onSubmit={handleLoginSubmit}>
                <div>
                  <label className="block font-label-bold text-label-bold text-on-surface mb-2" htmlFor="email">
                    E-mail
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                      mail
                    </span>
                    <input
                      className="w-full bg-surface-container border border-hairline-border rounded-lg pl-12 pr-4 h-[52px] text-on-surface focus:ring-0 transition-all outline-none"
                      id="email"
                      placeholder="seu@email.com"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-label-bold text-label-bold text-on-surface mb-2" htmlFor="password">
                    Senha
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                      lock
                    </span>
                    <input
                      className="w-full bg-surface-container border border-hairline-border rounded-lg pl-12 pr-12 h-[52px] text-on-surface focus:ring-0 transition-all outline-none"
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      className="w-5 h-5 rounded border-hairline-border bg-surface-container text-primary-container focus:ring-0 cursor-pointer"
                      type="checkbox"
                    />
                    <span className="font-label-muted text-label-muted text-on-surface-variant group-hover:text-on-surface transition-colors">
                      Lembrar-me
                    </span>
                  </label>
                  <a className="font-label-bold text-label-bold text-primary hover:underline" href="#">
                    Esqueceu a senha?
                  </a>
                </div>

                <button
                  className="w-full h-touch-target bg-primary-container text-on-primary-container font-label-bold text-lg rounded-lg extruded-shadow hover:bg-primary-fixed-dim transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </button>

                <p className="text-center font-label-muted text-label-muted text-on-surface-variant mt-6">
                  Não tem conta?{" "}
                  <Link className="text-primary font-label-bold hover:underline" href="/auth/register">
                    Cadastre-se
                  </Link>
                </p>

                <div className="flex justify-center mt-4 pt-4 border-t border-hairline-border/30">
                  <Link
                    className="font-caption text-caption text-outline hover:text-primary transition-colors flex items-center gap-1.5 opacity-70 hover:opacity-100"
                    href="/auth/register-admin"
                  >
                    <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                    Acesso Administrativo
                  </Link>
                </div>
              </form>
            </div>

            {/* Internal Access & Copyright */}
            <footer className="mt-12 flex flex-col items-center gap-4">
              <p className="font-caption text-caption text-outline opacity-40">
                © 2026 PetNexus. Todos os direitos reservados.
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-on-surface">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
