"use client";

import { useState } from "react";

export interface WhatsAppAutomationRule {
  id: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  icon: string;
  category: "lembrete" | "operacao" | "marketing" | "gestao";
  message: string;
  testPhone: string;
  availableTags: string[];
}

export default function CentralWhatsAppAdminPage() {
  // 1. Estado da Conexão do WhatsApp (Simulado & Preparado para Evolution/Baileys API)
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [connectedNumber, setConnectedNumber] = useState("+55 (11) 99999-8888");

  // 2. Estado do filtro de busca por regra
  const [searchFilter, setSearchFilter] = useState("");

  // 3. Regras de Disparo Automático (Estrutura limpa e extensível)
  const [automations, setAutomations] = useState<WhatsAppAutomationRule[]>([
    {
      id: "aut-1",
      title: "Lembrete de Agendamento (24h antes)",
      subtitle: "Envia automaticamente um lembrete no WhatsApp do tutor com horário e endereço.",
      enabled: true,
      icon: "notifications_active",
      category: "lembrete",
      message: "Olá {tutor_name}! Lembramos que o agendamento de {service_name} para o pet {pet_name} está confirmado para amanhã às {time}. Responda 1 para confirmar ou 2 para reagendar.",
      testPhone: "(11) 99999-8888",
      availableTags: ["{tutor_name}", "{pet_name}", "{service_name}", "{time}"],
    },
    {
      id: "aut-2",
      title: "Pet Pronto para Retirada (Esteira de Banho)",
      subtitle: "Disparado com 1 clique direto no painel da operação quando o banho/tosa finaliza.",
      enabled: true,
      icon: "pets",
      category: "operacao",
      message: "Parabéns {tutor_name}! O {pet_name} já terminou o banho e está cheiroso e pronto para ser retirado na recepção! 🐾",
      testPhone: "(11) 99999-8888",
      availableTags: ["{tutor_name}", "{pet_name}"],
    },
    {
      id: "aut-3",
      title: "Mensagem no Aniversário do Pet",
      subtitle: "Envia felicitações personalizadas com cupom de 10% OFF no dia do aniversário do pet.",
      enabled: true,
      icon: "cake",
      category: "marketing",
      message: "Hoje é um dia especial! 🎉 Desejamos um feliz aniversário para o fofíssimo {pet_name}! Como presente, você ganhou 10% OFF no próximo banho!",
      testPhone: "(11) 99999-8888",
      availableTags: ["{tutor_name}", "{pet_name}"],
    },
    {
      id: "aut-4",
      title: "Aviso de Pacote Prestes a Vencer",
      subtitle: "Avisa o tutor quando faltar apenas 1 banho ou 5 dias para o pacote renovar.",
      enabled: false,
      icon: "autorenew",
      category: "marketing",
      message: "Olá {tutor_name}! Seu pacote mensal de banho do {pet_name} tem apenas 1 banho restante. Clique aqui para renovar com desconto exclusivo.",
      testPhone: "(11) 99999-8888",
      availableTags: ["{tutor_name}", "{pet_name}"],
    },
    {
      id: "aut-5",
      title: "Resumo Diário de Caixa (Para o Gestor)",
      subtitle: "Envia às 18:00 um resumo do faturamento e atendimentos do dia para o número do admin.",
      enabled: true,
      icon: "query_stats",
      category: "gestao",
      message: "📊 Resumo Diário SaaS Petshop:\nTotal faturado hoje: R$ {total_today}\nAtendimentos concluídos: {completed_count}\nNovos clientes: {new_clients_count}",
      testPhone: "(11) 99999-8888",
      availableTags: ["{total_today}", "{completed_count}", "{new_clients_count}"],
    },
  ]);

  // Handler para alternar ativação da automação
  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  // Handler para atualizar mensagem de uma automação
  const updateMessage = (id: string, text: string) => {
    setAutomations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, message: text } : item))
    );
  };

  // Handler para atualizar telefone de teste de uma regra
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

  // Handler para simular disparo no WhatsApp Web/App
  const handleSendTestMessage = (rule: WhatsAppAutomationRule) => {
    const formattedPhone = rule.testPhone.replace(/\D/g, "");
    if (!formattedPhone) {
      alert("Por favor insira um número de telefone válido.");
      return;
    }

    const sampleText = encodeURIComponent(
      rule.message
        .replace(/{tutor_name}/g, "Carlos Eduardo")
        .replace(/{pet_name}/g, "Thor")
        .replace(/{service_name}/g, "Banho e Tosa")
        .replace(/{time}/g, "14:30")
        .replace(/{total_today}/g, "1.850,00")
        .replace(/{completed_count}/g, "18")
        .replace(/{new_clients_count}/g, "4")
    );

    window.open(`https://wa.me/55${formattedPhone}?text=${sampleText}`, "_blank");
  };

  // Handler para simular a conexão via QR Code
  const handleSimulateQrScan = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setShowQrModal(false);
      alert("WhatsApp conectado com sucesso! API de envio pronta.");
    }, 1500);
  };

  // Handler para desconectar WhatsApp
  const handleDisconnect = () => {
    if (confirm("Tem certeza que deseja desconectar a conta do WhatsApp? As automações serão pausadas.")) {
      setIsConnected(false);
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
          {isConnected ? (
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
                onClick={() => setShowQrModal(true)}
                className="bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:brightness-110 transition-all extruded-shadow cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">qr_code_2</span>
                Conectar via QR Code
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Card de Status do Dispositivo Conectado */}
      <section className="bg-elevated-card border border-hairline-border rounded-2xl p-6 extruded-shadow flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isConnected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}>
            <span className="material-symbols-outlined text-3xl">phone_iphone</span>
          </div>
          <div>
            <h3 className="font-bold text-on-surface text-body-lg">
              {isConnected ? "Instância WhatsApp Ativa" : "Instância WhatsApp Desconectada"}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {isConnected
                ? `Conectado ao número ${connectedNumber} • Motor: Evolution / Baileys API`
                : "Conecte o seu celular escaneando o QR Code para ativar o envio automático."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-surface-container px-4 py-2.5 rounded-xl border border-hairline-border">
            <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Qualidade do Sinal</span>
            <span className="text-primary font-bold">{isConnected ? "Excelente (100%)" : "Sem Conexão"}</span>
          </div>
          <div className="bg-surface-container px-4 py-2.5 rounded-xl border border-hairline-border">
            <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Fila de Disparo</span>
            <span className="text-on-surface font-bold">{isConnected ? "0 mensagens pendentes" : "Pausado"}</span>
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
                className="w-full bg-surface-container border border-hairline-border rounded-xl p-4 text-on-surface text-body-sm outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Action Test Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-hairline-border/40">
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
                onClick={() => handleSendTestMessage(item)}
                className="w-full sm:w-auto bg-surface-container-high border border-hairline-border text-on-surface hover:text-primary hover:border-primary/50 px-4 py-2 rounded-xl text-caption font-label-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-emerald-400">send</span>
                Disparar Mensagem de Teste no WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Modal de Conexão via QR Code Simulado */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl max-w-md w-full p-6 space-y-6 extruded-shadow animate-in fade-in">
            <div className="flex justify-between items-center border-b border-hairline-border pb-3">
              <h3 className="font-bold text-lg text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">qr_code_2</span>
                Conectar WhatsApp via QR Code
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg bg-surface-container cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              {/* Moldura do QR Code */}
              <div className="w-56 h-56 bg-white p-4 rounded-2xl shadow-2xl flex items-center justify-center relative border-4 border-primary/40">
                {isConnecting ? (
                  <div className="flex flex-col items-center text-matte-canvas space-y-2">
                    <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
                    <span className="text-xs font-bold text-black">Conectando ao WhatsApp...</span>
                  </div>
                ) : (
                  /* QR Code SVG limpo e futurista */
                  <svg className="w-full h-full text-matte-canvas" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z M40,0 h20 v10 h-20 z M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z M0,40 h10 v20 h-10 z M20,40 h20 v10 h-20 z M50,40 h10 v20 h-10 z M70,40 h30 v10 h-30 z M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z M40,70 h20 v20 h-20 z M70,70 h10 v10 h-10 z M90,80 h10 v20 h-10 z" />
                  </svg>
                )}
              </div>

              <div className="space-y-1 text-xs text-on-surface-variant text-left bg-surface-container p-4 rounded-xl border border-hairline-border w-full">
                <p className="font-bold text-on-surface mb-1">Passo a passo no celular:</p>
                <p>1. Abra o WhatsApp no celular</p>
                <p>2. Toque em <strong>Configurações</strong> &gt; <strong>Aparelhos Conectados</strong></p>
                <p>3. Toque em <strong>Conectar um Aparelho</strong> e aponte a câmera para a tela</p>
              </div>

              <button
                disabled={isConnecting}
                onClick={handleSimulateQrScan}
                className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:brightness-110 transition-all extruded-shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined">check_circle</span>
                {isConnecting ? "Validando Token de Sessão..." : "Simular Leitura do QR Code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
