"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { AdminBottomNav } from "@/components/ui/admin-bottom-nav";

export default function AutomacoesAdminPage() {
  const [automations, setAutomations] = useState([
    {
      id: "aut1",
      title: "Lembrete de Agendamento (24h antes)",
      subtitle: "Envia automaticamente um lembrete no WhatsApp do tutor com horário e endereço.",
      enabled: true,
      icon: "notifications_active",
      message: "Olá {tutor_name}! Lembramos que o agendamento de {service_name} para o pet {pet_name} está confirmado para amanhã às {time}. Responda 1 para confirmar ou 2 para reagendar.",
    },
    {
      id: "aut2",
      title: "Pet Pronto para Retirada (Esteira de Banho)",
      subtitle: "Disparado com 1 clique direto no painel da operação quando o banho/tosa finaliza.",
      enabled: true,
      icon: "pets",
      message: "Parabéns {tutor_name}! O {pet_name} já terminou o banho e está cheiroso e pronto para ser retirado na recepção! 🐾",
    },
    {
      id: "aut3",
      title: "Mensagem no Aniversário do Pet",
      subtitle: "Envia felicitações personalizadas com cupom de 10% OFF no dia do aniversário do pet.",
      enabled: true,
      icon: "cake",
      message: "Hoje é um dia especial! 🎉 Desejamos um feliz aniversário para o fofíssimo {pet_name}! Como presente, você ganhou 10% OFF no próximo banho!",
    },
    {
      id: "aut4",
      title: "Aviso de Pacote Prestes a Vencer",
      subtitle: "Avisa o tutor quando faltar apenas 1 banho ou 5 dias para o pacote renovar.",
      enabled: false,
      icon: "autorenew",
      message: "Olá {tutor_name}! Seu pacote mensal de banho do {pet_name} tem apenas 1 banho restante. Clique aqui para renovar com desconto exclusivo.",
    },
    {
      id: "aut5",
      title: "Resumo Diário de Caixa (Para o Gestor)",
      subtitle: "Envia às 18:00 um resumo do faturamento e atendimentos do dia para o número do admin.",
      enabled: true,
      icon: "query_stats",
      message: "📊 Resumo Diário SaaS Petshop:\nTotal faturado hoje: R$ {total_today}\nAtendimentos concluídos: {completed_count}\nNovos clientes: {new_clients_count}",
    },
  ]);

  const [testPhone, setTestPhone] = useState("(11) 99999-8888");

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const updateMessage = (id: string, text: string) => {
    setAutomations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, message: text } : item))
    );
  };

  const handleSendTestMessage = (item: typeof automations[0]) => {
    const formattedPhone = testPhone.replace(/\D/g, "");
    const sampleText = encodeURIComponent(
      item.message
        .replace("{tutor_name}", "Carlos Eduardo")
        .replace("{pet_name}", "Thor")
        .replace("{service_name}", "Banho e Tosa")
        .replace("{time}", "14:30")
        .replace("{total_today}", "1.850,00")
        .replace("{completed_count}", "18")
        .replace("{new_clients_count}", "4")
    );

    window.open(`https://wa.me/55${formattedPhone}?text=${sampleText}`, "_blank");
  };

  return (
    <div className="bg-matte-canvas text-on-surface font-body-base antialiased min-h-screen flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container border border-hairline-border p-6 rounded-2xl extruded-shadow">
          <div>
            <div className="flex items-center gap-2 text-primary font-label-bold text-xs uppercase tracking-widest mb-1">
              <span className="material-symbols-outlined text-sm">chat</span>
              Zap Notifica (WhatsApp Automations)
            </div>
            <h1 className="text-headline-md font-headline-md font-bold text-on-surface">Automações de Notificações</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-body-sm font-label-bold text-emerald-400">WhatsApp Conectado</span>
            </div>
          </div>
        </header>

        {/* Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5 extruded-shadow">
            <span className="text-caption text-on-surface-variant block">Disparos Hoje</span>
            <strong className="text-headline-md font-bold text-primary">127 mensagens</strong>
          </div>
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5 extruded-shadow">
            <span className="text-caption text-on-surface-variant block">Redução de Faltas</span>
            <strong className="text-headline-md font-bold text-emerald-400">-78% em no-show</strong>
          </div>
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5 extruded-shadow">
            <span className="text-caption text-on-surface-variant block">Taxa de Resposta</span>
            <strong className="text-headline-md font-bold text-on-surface">94.2% confirmados</strong>
          </div>
        </div>

        {/* Automations List */}
        <div className="space-y-6">
          <h2 className="text-headline-sm font-bold text-on-surface">Regras de Disparo Automático</h2>

          {automations.map((item) => (
            <div
              key={item.id}
              className={`bg-elevated-card border rounded-2xl p-6 transition-all space-y-4 extruded-shadow ${
                item.enabled ? "border-primary/40" : "border-hairline-border opacity-70"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline-border pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.enabled ? "bg-primary/20 text-primary" : "bg-surface-container text-on-surface-variant"}`}>
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-label-bold text-headline-sm text-on-surface">{item.title}</h3>
                    <p className="text-caption text-on-surface-variant mt-0.5">{item.subtitle}</p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center gap-3">
                  <span className="text-caption font-label-bold text-on-surface-variant">
                    {item.enabled ? "Ativo" : "Inativo"}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleAutomation(item.id)}
                    className={`w-14 h-8 rounded-full transition-colors relative p-1 cursor-pointer ${
                      item.enabled ? "bg-primary" : "bg-surface-container-high"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-on-primary transition-transform ${
                        item.enabled ? "translate-x-6" : "translate-x-0"
                      }`}
                    ></div>
                  </button>
                </div>
              </div>

              {/* Template Editor */}
              <div>
                <label className="block text-caption font-label-bold text-on-surface-variant mb-2">
                  Mensagem do WhatsApp (Suporta tags: {"{tutor_name}"}, {"{pet_name}"}, {"{service_name}"}, {"{time}"})
                </label>
                <textarea
                  rows={3}
                  value={item.message}
                  onChange={(e) => updateMessage(item.id, e.target.value)}
                  className="w-full bg-surface-container border border-hairline-border rounded-xl p-4 text-on-surface text-body-sm outline-none focus:border-primary resize-none"
                ></textarea>
              </div>

              {/* Action Test Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-caption text-on-surface-variant shrink-0">Testar envio no Tel:</span>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="bg-surface-container border border-hairline-border rounded-lg px-3 py-1.5 text-xs text-on-surface outline-none w-36"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleSendTestMessage(item)}
                  className="w-full sm:w-auto bg-surface-container-high border border-hairline-border text-on-surface hover:text-primary hover:border-primary/50 px-4 py-2 rounded-xl text-caption font-label-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  Disparar Mensagem de Teste no WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
