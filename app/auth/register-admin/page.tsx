"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlobalHeader from "@/components/GlobalHeader";
import { createClient } from "@/lib/supabase/client";

export default function RegisterAdminPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecretKey, setAdminSecretKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Verificação de Chave Mestra de Segurança (Padrão: "admin123")
    if (adminSecretKey.trim() !== "admin123") {
      setErrorMsg("Chave secreta de administrador incorreta.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
          adminSecretKey,
        }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        setErrorMsg("Erro ao cadastrar administrador: " + (resData.error || "Erro no servidor"));
        setIsLoading(false);
        return;
      }

      // Autenticar com a senha
      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email, password });

      alert("🎉 Conta Administradora configurada com sucesso!");
      router.push("/admin/pets");
    } catch (err: any) {
      setErrorMsg("Erro ao cadastrar administrador: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-body-base text-body-base selection:bg-primary-container selection:text-on-primary-container bg-background min-h-screen">
      <GlobalHeader />
      <main className="flex min-h-[calc(100vh-50px)] items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-lg bg-elevated-card border border-primary/30 rounded-3xl p-8 md:p-10 extruded-shadow emerald-glow-effect">
          <header className="mb-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3 border border-primary/20">
              <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface">Cadastro de Administrador / Funcionário</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Acesso restrito à equipe de gestão e petshop.
            </p>
          </header>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                Nome do Colaborador
              </label>
              <input
                className="w-full bg-surface-container border border-hairline-border rounded-xl p-3.5 text-on-surface outline-none focus:border-primary transition-all"
                placeholder="Ex: Carlos Oliveira"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                E-mail Corporativo
              </label>
              <input
                className="w-full bg-surface-container border border-hairline-border rounded-xl p-3.5 text-on-surface outline-none focus:border-primary transition-all"
                placeholder="carlos@petnexus.com"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                Telefone / WhatsApp
              </label>
              <input
                className="w-full bg-surface-container border border-hairline-border rounded-xl p-3.5 text-on-surface outline-none focus:border-primary transition-all"
                placeholder="(11) 99999-9999"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                Senha de Acesso
              </label>
              <input
                className="w-full bg-surface-container border border-hairline-border rounded-xl p-3.5 text-on-surface outline-none focus:border-primary transition-all"
                placeholder="••••••••"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary mb-1 uppercase">
                Chave Secreta de Segurança (Master Key)
              </label>
              <input
                className="w-full bg-surface-container border border-primary/40 rounded-xl p-3.5 text-on-surface outline-none focus:border-primary transition-all"
                placeholder="Digite a chave master (Padrão: admin123)"
                type="password"
                required
                value={adminSecretKey}
                onChange={(e) => setAdminSecretKey(e.target.value)}
              />
              <p className="text-[11px] text-on-surface-variant mt-1">
                Chave padrão de teste: <code className="text-primary bg-primary/10 px-1 py-0.5 rounded">admin123</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl extruded-shadow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  <span>Cadastrando Administrador...</span>
                </>
              ) : (
                <>
                  <span>Criar Conta Administradora</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
