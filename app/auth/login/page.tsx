"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/auth/social");
  };

  const handleGoogleLogin = () => {
    router.push("/auth/social");
  };

  return (
    <div className="font-body-base text-body-base selection:bg-primary-container selection:text-on-primary-container min-h-screen bg-background">
      <main className="flex min-h-screen">
        {/* Left Column: Hero Illustration (Hidden on Mobile) */}
        <section className="hidden lg:flex lg:w-[45%] bg-matte-canvas p-margin-desktop flex-col justify-center items-center relative overflow-hidden border-r border-hairline-border">
          {/* Background Decorative Glow */}
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
                SaaS Portal
              </h1>
              <span className="font-caption text-caption text-on-surface-variant uppercase tracking-widest mt-1">
                Gestão de Pet Shop
              </span>
            </div>

            {/* Login Card */}
            <div className="bg-elevated-card rounded-xl p-8 border border-hairline-border extruded-shadow">
              <header className="mb-8 text-center">
                <h2 className="font-headline-md text-on-surface">Entrar como Cliente</h2>
                <p className="text-on-surface-variant mt-1">Bem-vindo de volta ao portal do seu pet</p>
              </header>

              {/* Social Login Button */}
              <button
                onClick={handleGoogleLogin}
                type="button"
                className="w-full h-touch-target flex items-center justify-center gap-3 bg-white text-on-surface-variant font-label-bold text-label-bold rounded-lg border border-hairline-border transition-all hover:bg-surface-variant/10 active:scale-[0.98] mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continuar com Google
              </button>

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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
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
                >
                  Entrar
                </button>

                <p className="text-center font-label-muted text-label-muted text-on-surface-variant mt-6">
                  Não tem conta?{" "}
                  <Link className="text-primary font-label-bold hover:underline" href="/auth/register">
                    Cadastre-se
                  </Link>
                </p>

                <div className="flex justify-center mt-4 pt-4 border-t border-hairline-border/30">
                  <a
                    className="font-caption text-caption text-outline hover:text-primary transition-colors flex items-center gap-1.5 opacity-70 hover:opacity-100"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Área Administrativa");
                    }}
                  >
                    <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                    Acesso Administrativo
                  </a>
                </div>
              </form>
            </div>

            {/* Internal Access & Copyright */}
            <footer className="mt-12 flex flex-col items-center gap-4">
              <a
                className="font-label-muted text-label-muted text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2 opacity-80 hover:opacity-100"
                href="#"
              >
                <span className="material-symbols-outlined text-lg">badge</span>
                Acesso para Colaboradores
              </a>
              <p className="font-caption text-caption text-outline opacity-40">
                © 2026 SaaS Portal. Todos os direitos reservados.
              </p>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}
