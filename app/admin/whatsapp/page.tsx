"use client";

import { useEffect, useState } from "react";

export interface WhatsAppAutomationRule {
  id: string;
  rule_key: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  icon: string;
  category: "lembrete" | "operacao" | "marketing" | "gestao";
  message: string;
  testPhone: string;
  availableTags: string[];
}

// Metadados puramente visuais (ícone, subtítulo, tags disponíveis) que não
// precisam de persistência — o que é persistido é enabled/message_template.
const RULE_META: Record<string, { subtitle: string; icon: string; availableTags: string[] }> = {
  lembrete_24h: {
    subtitle: "Envia automaticamente um lembrete no WhatsApp do tutor com horário e endereço.",
    icon: "notifications_active",
    availableTags: ["{tutor_name}", "{pet_name}", "{service_name}", "{time}"],
  },
  pet_pronto: {
    subtitle: "Disparado automaticamente pelo WhatsApp conectado assim que o status do agendamento vira \"Pronto\" na Agenda.",
    icon: "pets",
    availableTags: ["{tutor_name}", "{pet_name}", "{service_name}"],
  },
  aniversario: {
    subtitle: "Envia felicitações personalizadas com cupom de 10% OFF no dia do aniversário do pet.",
    icon: "cake",
    availableTags: ["{tutor_name}", "{pet_name}"],
  },
  pacote_vencendo: {
    subtitle: "Avisa o tutor quando o pacote dele estiver com 1 crédito ou menos (via automação agendada).",
    icon: "autorenew",
    availableTags: ["{tutor_name}", "{package_name}", "{remaining_credits}"],
  },
  resumo_diario: {
    subtitle: "Envia um resumo do faturamento e atendimentos do dia para o número do admin (via automação agendada).",
    icon: "query_stats",
    availableTags: ["{total_today}", "{completed_count}", "{new_clients_count}"],
  },
  pedido_avaliacao: {
    subtitle: "Disparado automaticamente pelo WhatsApp conectado quando o status do agendamento vira \"Concluído\".",
    icon: "star_rate",
    availableTags: ["{tutor_name}", "{pet_name}", "{service_name}"],
  },
  cliente_inativo: {
    subtitle: "Envia uma mensagem de reativação para tutores sem agendamento há 60+ dias (via automação agendada).",
    icon: "restart_alt",
    availableTags: ["{tutor_name}", "{pet_name}"],
  },
};

type WhatsAppProvider = "none" | "evolution" | "official" | "twilio" | "uazapi";

const PROVIDER_LABELS: Record<WhatsAppProvider, string> = {
  none: "Nenhum",
  evolution: "Evolution API",
  official: "WhatsApp Cloud API (Oficial)",
  twilio: "Twilio",
  uazapi: "UazAPI",
};

interface WhatsAppConfigState {
  provider: WhatsAppProvider;
  is_connected: boolean;
  connected_number: string;
  last_error: string;
  last_checked_at: string | null;
  evolution_api_url: string;
  evolution_api_key: string;
  evolution_instance_name: string;
  official_phone_number_id: string;
  official_waba_id: string;
  official_access_token: string;
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_whatsapp_number: string;
  uazapi_api_url: string;
  uazapi_token: string;
  admin_notify_phone: string;
}

const EMPTY_CONFIG: WhatsAppConfigState = {
  provider: "none",
  is_connected: false,
  connected_number: "",
  last_error: "",
  last_checked_at: null,
  evolution_api_url: "",
  evolution_api_key: "",
  evolution_instance_name: "",
  official_phone_number_id: "",
  official_waba_id: "",
  official_access_token: "",
  twilio_account_sid: "",
  twilio_auth_token: "",
  twilio_whatsapp_number: "",
  uazapi_api_url: "",
  uazapi_token: "",
  admin_notify_phone: "",
};

export default function CentralWhatsAppAdminPage() {
  // 1. Estado da Conexão do WhatsApp (Evolution API / WhatsApp Cloud API oficial / Twilio)
  const [config, setConfig] = useState<WhatsAppConfigState>(EMPTY_CONFIG);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const loadConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const res = await fetch("/api/admin/whatsapp-config");
      const data = await res.json();
      if (res.ok && data.config) {
        setConfig((prev) => ({ ...prev, ...data.config }));
      }
    } catch (err) {
      console.error("Erro ao carregar configuração do WhatsApp:", err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Salva a configuração atual no banco. Retorna true em caso de sucesso.
  const saveConfig = async (): Promise<boolean> => {
    setIsSavingConfig(true);
    try {
      const res = await fetch("/api/admin/whatsapp-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao salvar configuração.");
      await loadConfig();
      return true;
    } catch (err: any) {
      alert(err.message);
      return false;
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSaveConfig = async () => {
    const saved = await saveConfig();
    if (saved) alert("Configuração salva! Agora clique em Conectar / Testar Conexão.");
  };

  const handleConnect = async () => {
    setConnectError(null);
    setQrCodeBase64(null);

    // Salva a configuração atual antes de conectar — evita o erro de "selecione um
    // provedor" quando o admin muda o provedor/campos e clica direto em Conectar
    // sem passar por Salvar Configuração antes.
    const saved = await saveConfig();
    if (!saved) return;

    setIsConnecting(true);
    try {
      const res = await fetch("/api/admin/whatsapp-config/connect", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setConnectError(data?.error || "Não foi possível conectar.");
        return;
      }

      if (data.qrCodeBase64) {
        setQrCodeBase64(data.qrCodeBase64);
      } else if (data.connected) {
        alert(`Conectado com sucesso! Número: ${data.number || "verificado"}`);
        setShowConfigModal(false);
        await loadConfig();
      }
    } catch (err: any) {
      setConnectError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Enquanto o QR code da Evolution API estiver visível, faz polling do status de conexão
  useEffect(() => {
    if (!qrCodeBase64) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/admin/whatsapp-config/connect");
        const data = await res.json();
        if (data.connected) {
          clearInterval(interval);
          setQrCodeBase64(null);
          setShowConfigModal(false);
          await loadConfig();
          alert("WhatsApp conectado com sucesso!");
        }
      } catch {
        // silencioso — próxima tentativa do polling
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [qrCodeBase64]);

  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar? As credenciais salvas não serão apagadas.")) return;
    try {
      await fetch("/api/admin/whatsapp-config", { method: "PATCH" });
      await loadConfig();
    } catch (err) {
      console.error("Erro ao desconectar:", err);
    }
  };

  // 2. Estado do filtro de busca por regra
  const [searchFilter, setSearchFilter] = useState("");

  // 3. Regras de Disparo Automático (persistidas em automation_rules)
  const [automations, setAutomations] = useState<WhatsAppAutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAutomations = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/automations");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível carregar as automações.");

      const mapped: WhatsAppAutomationRule[] = (data.rules || []).map((r: any) => {
        const meta = RULE_META[r.rule_key] || { subtitle: "", icon: "notifications", availableTags: [] };
        return {
          id: r.id,
          rule_key: r.rule_key,
          title: r.title,
          subtitle: meta.subtitle,
          enabled: r.enabled,
          icon: meta.icon,
          category: r.category,
          message: r.message_template || "",
          testPhone: "(11) 99999-8888",
          availableTags: meta.availableTags,
        };
      });
      setAutomations(mapped);
    } catch (err: any) {
      console.error("Erro ao carregar automações:", err);
      setLoadError(err.message || "Erro ao carregar automações.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAutomations();
  }, []);

  // Handler para alternar ativação da automação (persiste imediatamente)
  const toggleAutomation = async (id: string) => {
    const rule = automations.find((a) => a.id === id);
    if (!rule) return;
    const newEnabled = !rule.enabled;
    setAutomations((prev) => prev.map((item) => (item.id === id ? { ...item, enabled: newEnabled } : item)));
    try {
      const res = await fetch("/api/admin/automations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule_key: rule.rule_key, enabled: newEnabled }),
      });
      if (!res.ok) throw new Error("Falha ao salvar.");
    } catch (err) {
      console.error("Erro ao atualizar automação:", err);
      setAutomations((prev) => prev.map((item) => (item.id === id ? { ...item, enabled: !newEnabled } : item)));
      alert("Não foi possível salvar a alteração. Tente novamente.");
    }
  };

  // Handler para atualizar mensagem de uma automação (estado local; salva no onBlur)
  const updateMessage = (id: string, text: string) => {
    setAutomations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, message: text } : item))
    );
  };

  // Persiste a mensagem quando o campo perde o foco
  const saveMessage = async (rule: WhatsAppAutomationRule) => {
    try {
      const res = await fetch("/api/admin/automations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule_key: rule.rule_key, message_template: rule.message }),
      });
      if (!res.ok) throw new Error("Falha ao salvar mensagem.");
    } catch (err) {
      console.error("Erro ao salvar mensagem da automação:", err);
      alert("Não foi possível salvar a mensagem. Tente novamente.");
    }
  };

  // Handler para atualizar telefone de teste de uma regra (apenas local, usado no envio manual)
  const updateTestPhone = (id: string, phone: string) => {
    setAutomations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, testPhone: phone } : item))
    );
  };

  // Insert tag into text
  const insertTag = (id: string, tag: string) => {
    setAutomations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, message: item.message + " " + tag };
        }
        return item;
      })
    );
  };

  // Handler para testar o envio de verdade através do provedor de WhatsApp configurado
  // (chama a mesma função usada pelas automações reais — não é mais um link wa.me manual)
  const [testSendingId, setTestSendingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const handleSendTestMessage = async (rule: WhatsAppAutomationRule) => {
    const formattedPhone = rule.testPhone.replace(/\D/g, "");
    if (!formattedPhone) {
      alert("Por favor insira um número de telefone válido.");
      return;
    }

    const sampleText = rule.message
      .replace(/{tutor_name}/g, "Carlos Eduardo")
      .replace(/{pet_name}/g, "Thor")
      .replace(/{service_name}/g, "Banho e Tosa")
      .replace(/{time}/g, "14:30")
      .replace(/{total_today}/g, "1.850,00")
      .replace(/{completed_count}/g, "18")
      .replace(/{new_clients_count}/g, "4")
      .replace(/{package_name}/g, "Plano Mensal")
      .replace(/{remaining_credits}/g, "1");

    setTestSendingId(rule.id);
    setTestResults((prev) => ({ ...prev, [rule.id]: undefined as any }));
    try {
      const res = await fetch("/api/admin/whatsapp-config/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone, message: sampleText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResults((prev) => ({ ...prev, [rule.id]: { success: false, message: data?.error || "Falha ao enviar." } }));
      } else {
        setTestResults((prev) => ({ ...prev, [rule.id]: { success: true, message: "Mensagem enviada com sucesso!" } }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({ ...prev, [rule.id]: { success: false, message: err.message || "Erro de conexão." } }));
    } finally {
      setTestSendingId(null);
    }
  };

  const filteredAutomations = automations.filter(
    (a) =>
      a.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.message.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Header Principal da Central do WhatsApp */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container border border-hairline-border p-6 rounded-2xl extruded-shadow">
        <div>
          <div className="flex items-center gap-2 text-primary font-label-bold text-xs uppercase tracking-widest mb-1">
            <span className="material-symbols-outlined text-sm">chat</span>
            Zap Notifica & Automações
          </div>
          <h1 className="text-headline-md font-headline-md font-bold text-on-surface">
            Central do WhatsApp
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Gerencie a conexão da instância e configure o envio automático de lembretes e notificações.
          </p>
        </div>

        {/* Estado da Conexão do WhatsApp */}
        <div className="flex items-center gap-3">
          {config.is_connected ? (
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-body-sm font-label-bold text-emerald-400">
                  WhatsApp Conectado
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-3 py-2 bg-surface-container-high hover:bg-rose-500/20 text-on-surface-variant hover:text-rose-400 border border-hairline-border rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Desconectar Instância do WhatsApp"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="bg-rose-500/10 border border-rose-500/30 px-4 py-2 rounded-xl flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                <span className="text-body-sm font-label-bold text-rose-400">
                  Desconectado
                </span>
              </div>
              <button
                onClick={() => setShowConfigModal(true)}
                className="bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:brightness-110 transition-all extruded-shadow cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">settings_input_antenna</span>
                Configurar Conexão
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Card de Status do Provedor Configurado */}
      <section className="bg-elevated-card border border-hairline-border rounded-2xl p-6 extruded-shadow flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.is_connected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}>
            <span className="material-symbols-outlined text-3xl">phone_iphone</span>
          </div>
          <div>
            <h3 className="font-bold text-on-surface text-body-lg">
              {config.provider === "none"
                ? "Nenhum provedor configurado"
                : config.is_connected
                ? "Instância WhatsApp Ativa"
                : "Instância WhatsApp Desconectada"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {config.provider === "none"
                ? "Configure a Evolution API, a API oficial da Meta ou o Twilio para ativar o envio automático."
                : config.is_connected
                ? `Conectado ao número ${config.connected_number || "verificado"} • Provedor: ${PROVIDER_LABELS[config.provider]}`
                : `Provedor selecionado: ${PROVIDER_LABELS[config.provider]}. Clique em Configurar Conexão para concluir.`}
            </p>
            {config.last_error && !config.is_connected && (
              <p className="text-[11px] text-rose-400 mt-1">Último erro: {config.last_error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-surface-container px-4 py-2.5 rounded-xl border border-hairline-border">
            <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Provedor</span>
            <span className="text-primary font-bold">{PROVIDER_LABELS[config.provider]}</span>
          </div>
          <div className="bg-surface-container px-4 py-2.5 rounded-xl border border-hairline-border">
            <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Último Check</span>
            <span className="text-on-surface font-bold">
              {config.last_checked_at ? new Date(config.last_checked_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Filtro e Cabeçalho das Regras de Automação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-headline-md font-bold text-on-surface">Regras de Disparo Automático</h2>
          <p className="text-xs text-on-surface-variant">Ative ou edite as mensagens que o sistema enviará aos tutores</p>
        </div>

        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar por regra ou tag..."
            className="w-full bg-surface-container border border-hairline-border rounded-xl pl-10 pr-4 py-2 text-xs text-on-surface outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* 4. Lista de Regras de Automação */}
      {isLoading ? (
        <div className="p-12 text-center text-on-surface-variant bg-elevated-card rounded-2xl border border-hairline-border">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">sync</span>
          <p className="font-bold">Carregando automações...</p>
        </div>
      ) : loadError ? (
        <div className="p-12 text-center bg-elevated-card rounded-2xl border border-rose-500/30 space-y-3">
          <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
          <p className="font-bold text-rose-400">{loadError}</p>
          <button onClick={loadAutomations} className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:brightness-110 cursor-pointer">
            Tentar novamente
          </button>
        </div>
      ) : (
      <div className="space-y-4">
        {filteredAutomations.map((item) => (
          <div
            key={item.id}
            className={`bg-elevated-card border rounded-2xl p-6 transition-all extruded-shadow space-y-4 ${
              item.enabled ? "border-hairline-border hover:border-primary/40" : "border-hairline-border/40 opacity-75"
            }`}
          >
            {/* Rule Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl ${item.enabled ? "bg-primary/20 text-primary border border-primary/30" : "bg-surface-container text-on-surface-variant"}`}>
                  <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>
                <div>
                  <h3 className="font-label-bold text-body-base text-on-surface font-bold">{item.title}</h3>
                  <p className="text-caption text-on-surface-variant mt-0.5">{item.subtitle}</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold uppercase tracking-wider ${item.enabled ? "text-primary" : "text-on-surface-variant"}`}>
                  {item.enabled ? "Ativo" : "Inativo"}
                </span>
                <button
                  type="button"
                  onClick={() => toggleAutomation(item.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    item.enabled ? "bg-primary" : "bg-surface-container-high border border-hairline-border"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-matte-canvas shadow-md transition-transform absolute top-1 ${
                      item.enabled ? "translate-x-7" : "translate-x-1"
                    }`}
                  ></span>
                </button>
              </div>
            </div>

            {/* Template Textarea */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-caption font-label-bold text-on-surface-variant">
                  Mensagem do WhatsApp (Template de Mensagem)
                </label>
                {/* Available Tag Chips */}
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] text-outline self-center mr-1">Inserir tag:</span>
                  {item.availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertTag(item.id, tag)}
                      className="px-2 py-0.5 bg-surface-container hover:bg-primary/20 text-primary rounded text-[10px] font-mono border border-primary/20 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                value={item.message}
                onChange={(e) => updateMessage(item.id, e.target.value)}
                onBlur={() => saveMessage(item)}
                className="w-full bg-surface-container border border-hairline-border rounded-xl p-4 text-on-surface text-body-sm outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Action Test Button */}
            <div className="flex flex-col gap-2 pt-2 border-t border-hairline-border/40">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-caption text-on-surface-variant shrink-0">Testar envio no Tel:</span>
                  <input
                    type="text"
                    value={item.testPhone}
                    onChange={(e) => updateTestPhone(item.id, e.target.value)}
                    className="bg-surface-container border border-hairline-border rounded-lg px-3 py-1.5 text-xs text-on-surface outline-none w-36 focus:border-primary"
                  />
                </div>

                <button
                  type="button"
                  disabled={testSendingId === item.id}
                  onClick={() => handleSendTestMessage(item)}
                  className="w-full sm:w-auto bg-surface-container-high border border-hairline-border text-on-surface hover:text-primary hover:border-primary/50 px-4 py-2 rounded-xl text-caption font-label-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                >
                  <span className={`material-symbols-outlined text-sm text-emerald-400 ${testSendingId === item.id ? "animate-spin" : ""}`}>
                    {testSendingId === item.id ? "sync" : "bolt"}
                  </span>
                  {testSendingId === item.id ? "Enviando..." : "Testar Envio via API"}
                </button>
              </div>
              {testResults[item.id] && (
                <p className={`text-[11px] font-bold text-right ${testResults[item.id].success ? "text-primary" : "text-red-400"}`}>
                  {testResults[item.id].success ? "✓" : "✗"} {testResults[item.id].message}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* 5. Modal de Configuração da Conexão (Evolution API / WhatsApp Cloud API / Twilio) */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col p-6 space-y-5 extruded-shadow animate-in fade-in">
            <div className="flex justify-between items-center border-b border-hairline-border pb-3">
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings_input_antenna</span>
                Configurar Conexão do WhatsApp
              </h3>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setQrCodeBase64(null);
                  setConnectError(null);
                }}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Seletor de Provedor */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2">Provedor</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["evolution", "uazapi", "official", "twilio", "none"] as WhatsAppProvider[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, provider: p }))}
                      className={`py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                        config.provider === p
                          ? "bg-primary text-on-primary border-primary"
                          : "bg-surface-container text-on-surface-variant border-hairline-border hover:border-primary/30"
                      }`}
                    >
                      {PROVIDER_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campos: Evolution API */}
              {config.provider === "evolution" && (
                <div className="space-y-3">
                  <p className="text-[11px] text-on-surface-variant bg-surface-container p-3 rounded-xl border border-hairline-border">
                    Instância self-hosted (Baileys/WhatsApp Web). Informe a URL base da sua API Evolution, a chave de API e o nome da instância.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">URL da API</label>
                    <input
                      type="text"
                      value={config.evolution_api_url}
                      onChange={(e) => setConfig((prev) => ({ ...prev, evolution_api_url: e.target.value }))}
                      placeholder="https://sua-instancia.exemplo.com"
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Chave de API (apikey)</label>
                    <input
                      type="password"
                      value={config.evolution_api_key}
                      onChange={(e) => setConfig((prev) => ({ ...prev, evolution_api_key: e.target.value }))}
                      placeholder="Deixe em branco para manter a atual"
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Nome da Instância</label>
                    <input
                      type="text"
                      value={config.evolution_instance_name}
                      onChange={(e) => setConfig((prev) => ({ ...prev, evolution_instance_name: e.target.value }))}
                      placeholder="petnexus"
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Campos: UazAPI */}
              {config.provider === "uazapi" && (
                <div className="space-y-3">
                  <p className="text-[11px] text-on-surface-variant bg-surface-container p-3 rounded-xl border border-hairline-border">
                    Instância UazAPI (ex.: https://free.uazapi.com ou seu subdomínio próprio). Informe a URL base e o token da instância — encontrados no painel da UazAPI.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">URL da API</label>
                    <input
                      type="text"
                      value={config.uazapi_api_url}
                      onChange={(e) => setConfig((prev) => ({ ...prev, uazapi_api_url: e.target.value }))}
                      placeholder="https://free.uazapi.com"
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Token da Instância</label>
                    <input
                      type="password"
                      value={config.uazapi_token}
                      onChange={(e) => setConfig((prev) => ({ ...prev, uazapi_token: e.target.value }))}
                      placeholder="Deixe em branco para manter o atual"
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Campos: WhatsApp Cloud API Oficial */}
              {config.provider === "official" && (
                <div className="space-y-3">
                  <p className="text-[11px] text-on-surface-variant bg-surface-container p-3 rounded-xl border border-hairline-border">
                    API oficial da Meta. Crie um app em developers.facebook.com, adicione o produto WhatsApp e copie os dados abaixo.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Phone Number ID</label>
                    <input
                      type="text"
                      value={config.official_phone_number_id}
                      onChange={(e) => setConfig((prev) => ({ ...prev, official_phone_number_id: e.target.value }))}
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">WhatsApp Business Account ID</label>
                    <input
                      type="text"
                      value={config.official_waba_id}
                      onChange={(e) => setConfig((prev) => ({ ...prev, official_waba_id: e.target.value }))}
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Access Token</label>
                    <input
                      type="password"
                      value={config.official_access_token}
                      onChange={(e) => setConfig((prev) => ({ ...prev, official_access_token: e.target.value }))}
                      placeholder="Deixe em branco para manter o atual"
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Campos: Twilio */}
              {config.provider === "twilio" && (
                <div className="space-y-3">
                  <p className="text-[11px] text-on-surface-variant bg-surface-container p-3 rounded-xl border border-hairline-border">
                    Conta Twilio com o WhatsApp Sender habilitado. Encontre esses dados no console da Twilio.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Account SID</label>
                    <input
                      type="text"
                      value={config.twilio_account_sid}
                      onChange={(e) => setConfig((prev) => ({ ...prev, twilio_account_sid: e.target.value }))}
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Auth Token</label>
                    <input
                      type="password"
                      value={config.twilio_auth_token}
                      onChange={(e) => setConfig((prev) => ({ ...prev, twilio_auth_token: e.target.value }))}
                      placeholder="Deixe em branco para manter o atual"
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Número WhatsApp Twilio</label>
                    <input
                      type="text"
                      value={config.twilio_whatsapp_number}
                      onChange={(e) => setConfig((prev) => ({ ...prev, twilio_whatsapp_number: e.target.value }))}
                      placeholder="+14155238886"
                      className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {config.provider === "none" && (
                <p className="text-xs text-on-surface-variant text-center py-6">
                  Selecione um provedor acima para configurar o envio automático de mensagens.
                </p>
              )}

              {/* Número do gestor — usado pela automação "Resumo Diário de Caixa" */}
              <div className="pt-2 border-t border-hairline-border">
                <label className="block text-xs font-bold text-on-surface mb-1">Número do Gestor (para relatórios)</label>
                <input
                  type="text"
                  value={config.admin_notify_phone}
                  onChange={(e) => setConfig((prev) => ({ ...prev, admin_notify_phone: e.target.value }))}
                  placeholder="5511999998888"
                  className="w-full bg-surface-container border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Para onde a automação "Resumo Diário de Caixa" envia o relatório automático.
                </p>
              </div>

              {/* QR Code real da Evolution API */}
              {qrCodeBase64 && (
                <div className="flex flex-col items-center gap-3 pt-2">
                  <div className="w-56 h-56 bg-white p-3 rounded-2xl shadow-2xl border-4 border-primary/40 flex items-center justify-center">
                    <img src={qrCodeBase64.startsWith("data:") ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`} alt="QR Code do WhatsApp" className="w-full h-full object-contain" />
                  </div>
                  <div className="space-y-1 text-xs text-on-surface-variant text-left bg-surface-container p-3 rounded-xl border border-hairline-border w-full">
                    <p className="font-bold text-on-surface mb-1">No celular conectado ao número do petshop:</p>
                    <p>1. Abra o WhatsApp</p>
                    <p>2. Toque em <strong>Configurações</strong> &gt; <strong>Aparelhos Conectados</strong></p>
                    <p>3. Toque em <strong>Conectar um Aparelho</strong> e aponte a câmera para o QR code acima</p>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">Aguardando leitura do QR code...</p>
                </div>
              )}

              {connectError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">{connectError}</p>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-3 pt-3 border-t border-hairline-border">
              <button
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
                className="flex-1 py-3 bg-surface-container border border-hairline-border text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-high transition-all cursor-pointer disabled:opacity-60"
              >
                {isSavingConfig ? "Salvando..." : "Salvar Configuração"}
              </button>
              {config.provider !== "none" && (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="flex-1 py-3 bg-primary text-on-primary font-bold text-xs rounded-xl hover:brightness-110 transition-all extruded-shadow cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">
                    {config.provider === "evolution" || config.provider === "uazapi" ? "qr_code_2" : "wifi_tethering"}
                  </span>
                  {isConnecting ? "Conectando..." : "Conectar / Testar Conexão"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
