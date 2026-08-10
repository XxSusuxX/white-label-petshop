"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GlobalHeader from "@/components/GlobalHeader";
import { createClient } from "@/lib/supabase/client";

interface ExistingClient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

export default function RegisterAdminPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [adminSecretKey, setAdminSecretKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Clientes existentes carregados do Supabase
  const [clientsList, setClientsList] = useState<ExistingClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/admin/clients");
        const data = await res.json();
        if (res.ok && data.clients) {
          setClientsList(data.clients);
        }
      } catch (err) {
        console.warn("Aviso ao carregar lista de clientes para auto-preenchimento:", err);
      }
    }
    loadClients();
  }, []);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clientsList.find((c) => c.id === clientId);
    if (client) {
      if (client.email && client.email !== "Sem e-mail") setEmail(client.email);
      if (client.full_name) setFullName(client.full_name);
      if (client.phone && client.phone !== "Não informado") setPhone(client.phone);
    }
  };

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    // Tentar corresponder automaticamente o cliente pelo e-mail
    const matched = clientsList.find((c) => c.email.toLowerCase() === newEmail.trim().toLowerCase());
    if (matched) {
      setSelectedClientId(matched.id);
      if (matched.full_name) setFullName(matched.full_name);
      if (matched.phone && matched.phone !== "Não informado") setPhone(matched.phone);
    }
  };

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
          role,
          adminSecretKey,
        }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        setErrorMsg("Erro ao cadastrar colaborador: " + (resData.error || "Erro no servidor"));
        setIsLoading(false);
        return;
      }

      // Se o usuário não estiver logado, fazer login automático com a nova conta criada
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        await supabase.auth.signInWithPassword({ email, password });
      }

      alert(`🎉 Conta de ${fullName || email} configurada com sucesso!`);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setErrorMsg("Erro ao cadastrar colaborador: " + err.message);
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
            <h1 className="text-2xl font-bold text-on-surface">Cadastro de Equipe & Gestão</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Cadastre ou promova clientes existentes para colaboradores e gestores.
            </p>
          </header>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo para Importar Dados de Cliente Existente */}
            {clientsList.length > 0 && (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 space-y-2">
                <label className="block text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">person_search</span>
                  Promover Cliente Existente (Auto-preencher)
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full bg-surface-container border border-hairline-border rounded-xl p-3 text-sm text-on-surface outline-none focus:border-primary cursor-pointer font-medium"
                >
                  <option value="">-- Selecionar cliente para puxar e-mail e nome --</option>
                  {clientsList.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.full_name} ({client.email})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-on-surface-variant">
                  Ao escolher um cliente, o e-mail, nome e WhatsApp serão puxados automaticamente.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                Cargo / Função no Petshop
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-surface-container border border-hairline-border rounded-xl p-3.5 text-on-surface outline-none focus:border-primary transition-all cursor-pointer font-medium"
              >
                <option value="admin">Administrador (Acesso Total)</option>
                <option value="dono">Dono(a) / Proprietário(a) (Acesso Total)</option>
                <option value="veterinario">Médico(a) Veterinário(a)</option>
                <option value="banhista_tosador">Banhista & Tosador(a)</option>
                <option value="recepcionista">Recepcionista</option>
                <option value="entregador">Entregador / Motorista</option>
                <option value="auxiliar">Auxiliar Geral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                E-mail Corporativo ou do Cliente
              </label>
              <input
                className="w-full bg-surface-container border border-hairline-border rounded-xl p-3.5 text-on-surface outline-none focus:border-primary transition-all"
                placeholder="carlos@petshop.com"
                type="email"
                required
                list="clients-email-datalist"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
              />
              <datalist id="clients-email-datalist">
                {clientsList.map((c) => (
                  <option key={c.id} value={c.email}>
                    {c.full_name}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                Nome do Colaborador / Gestor
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
                  <span>Cadastrando Colaborador...</span>
                </>
              ) : (
                <>
                  <span>Salvar Conta de Colaborador</span>
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
