"use client";

import { useState, useEffect } from "react";

interface CashMovement {
  id: string;
  type: "entrada" | "saida";
  amount: number;
  payment_method: string;
  description: string;
  created_at: string;
}

interface CashSession {
  id: string;
  opened_by_name: string;
  opened_at: string;
  opening_amount: number;
  status: "aberto" | "fechado";
}

interface CashSummary {
  totalEntradas: number;
  totalSaidas: number;
  byMethod: Record<string, number>;
  expected: number;
}

interface ClosedSession extends CashSession {
  closed_by_name: string;
  closed_at: string;
  expected_amount: number;
  counted_amount: number;
  difference_amount: number;
}

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  credit: "Crédito",
  debit: "Débito",
  outro: "Outro",
};

export default function CaixaPanel({ onSessionChange }: { onSessionChange?: (hasOpenSession: boolean) => void }) {
  const [session, setSession] = useState<CashSession | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [openingAmount, setOpeningAmount] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movType, setMovType] = useState<"entrada" | "saida">("saida");
  const [movAmount, setMovAmount] = useState("");
  const [movMethod, setMovMethod] = useState("dinheiro");
  const [movDescription, setMovDescription] = useState("");
  const [isSavingMovement, setIsSavingMovement] = useState(false);

  const [showCloseForm, setShowCloseForm] = useState(false);
  const [countedAmount, setCountedAmount] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const [history, setHistory] = useState<ClosedSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadCaixa = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/caixa");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível carregar o caixa.");
      setSession(data.session);
      setMovements(data.movements || []);
      setSummary(data.summary);
      onSessionChange?.(!!data.session);
    } catch (err: any) {
      console.error("Erro ao carregar caixa:", err);
      setLoadError(err.message || "Erro ao carregar caixa.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCaixa();
  }, []);

  const handleOpenCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpening(true);
    try {
      const res = await fetch("/api/admin/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opening_amount: parseFloat(openingAmount) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao abrir o caixa.");
      setOpeningAmount("");
      await loadCaixa();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsOpening(false);
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movAmount || parseFloat(movAmount) <= 0) {
      alert("Informe um valor válido.");
      return;
    }
    setIsSavingMovement(true);
    try {
      const res = await fetch("/api/admin/caixa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: movType,
          amount: parseFloat(movAmount),
          payment_method: movMethod,
          description: movDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao registrar movimentação.");
      setMovAmount("");
      setMovDescription("");
      setShowMovementForm(false);
      await loadCaixa();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingMovement(false);
    }
  };

  const handleCloseCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countedAmount) {
      alert("Informe o valor contado no fechamento.");
      return;
    }
    if (!confirm("Confirmar o fechamento do caixa? Essa ação não pode ser desfeita.")) return;
    setIsClosing(true);
    try {
      const res = await fetch("/api/admin/caixa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close", counted_amount: parseFloat(countedAmount), notes: closeNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao fechar o caixa.");
      alert(
        data.difference === 0
          ? "Caixa fechado sem diferenças."
          : data.difference > 0
          ? `Caixa fechado com sobra de R$ ${data.difference.toFixed(2)}.`
          : `Caixa fechado com falta de R$ ${Math.abs(data.difference).toFixed(2)}.`
      );
      setCountedAmount("");
      setCloseNotes("");
      setShowCloseForm(false);
      await loadCaixa();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsClosing(false);
    }
  };

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/admin/caixa/historico");
      const data = await res.json();
      if (res.ok) setHistory(data.sessions || []);
    } catch (err) {
      console.error("Erro ao carregar histórico de caixa:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const toggleHistory = () => {
    setShowHistory((v) => !v);
    if (!showHistory && history.length === 0) loadHistory();
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-on-surface-variant bg-elevated-card rounded-2xl border border-hairline-border">
        <span className="material-symbols-outlined text-4xl animate-spin text-primary mb-2">sync</span>
        <p className="font-bold">Carregando caixa...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-12 text-center bg-elevated-card rounded-2xl border border-rose-500/30 space-y-3">
        <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
        <p className="font-bold text-rose-400">{loadError}</p>
        <button onClick={loadCaixa} className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:brightness-110 cursor-pointer">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!session ? (
        <div className="bg-elevated-card border border-hairline-border rounded-2xl p-8 max-w-md mx-auto text-center space-y-4 extruded-shadow">
          <span className="material-symbols-outlined text-4xl text-primary">point_of_sale</span>
          <h3 className="font-bold text-on-surface">Nenhum caixa aberto</h3>
          <p className="text-xs text-on-surface-variant">Abra o caixa informando o valor inicial em dinheiro para começar a vender.</p>
          <form onSubmit={handleOpenCaixa} className="space-y-3">
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="Valor inicial (R$)"
              className="w-full bg-surface-container border border-hairline-border rounded-xl px-4 py-3 text-sm text-on-surface outline-none focus:border-primary text-center"
            />
            <button
              type="submit"
              disabled={isOpening}
              className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:brightness-110 transition-all cursor-pointer disabled:opacity-60"
            >
              {isOpening ? "Abrindo..." : "Abrir Caixa"}
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Cabeçalho da sessão aberta */}
          <div className="bg-elevated-card border border-primary/30 rounded-2xl p-5 extruded-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">lock_open</span>
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-sm">Caixa Aberto</h3>
                <p className="text-xs text-on-surface-variant">
                  Aberto por {session.opened_by_name} às {new Date(session.opened_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMovementForm((v) => !v)}
                className="px-4 py-2.5 bg-surface-container border border-hairline-border text-on-surface font-bold text-xs rounded-xl hover:bg-surface-container-high transition-all cursor-pointer"
              >
                + Movimentação
              </button>
              <button
                onClick={() => setShowCloseForm((v) => !v)}
                className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                Fechar Caixa
              </button>
            </div>
          </div>

          {/* Totais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-surface-container border border-hairline-border rounded-xl p-4">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Valor Inicial</span>
              <span className="text-lg font-extrabold text-on-surface">R$ {Number(session.opening_amount).toFixed(2)}</span>
            </div>
            <div className="bg-surface-container border border-hairline-border rounded-xl p-4">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Entradas</span>
              <span className="text-lg font-extrabold text-emerald-400">R$ {(summary?.totalEntradas || 0).toFixed(2)}</span>
            </div>
            <div className="bg-surface-container border border-hairline-border rounded-xl p-4">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Saídas</span>
              <span className="text-lg font-extrabold text-rose-400">R$ {(summary?.totalSaidas || 0).toFixed(2)}</span>
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
              <span className="text-[10px] font-bold text-primary uppercase block">Esperado em Caixa</span>
              <span className="text-lg font-extrabold text-primary">R$ {(summary?.expected || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Por forma de pagamento */}
          {summary && Object.keys(summary.byMethod).length > 0 && (
            <div className="bg-surface-container border border-hairline-border rounded-xl p-4 flex flex-wrap gap-4">
              {Object.entries(summary.byMethod).map(([method, amount]) => (
                <div key={method} className="text-xs">
                  <span className="text-on-surface-variant block">{PAYMENT_LABELS[method] || method}</span>
                  <span className="font-bold text-on-surface">R$ {amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Form: Nova Movimentação */}
          {showMovementForm && (
            <form onSubmit={handleAddMovement} className="bg-surface-container border border-hairline-border rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-sm text-on-surface">Registrar Movimentação Manual</h4>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setMovType("entrada")} className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${movType === "entrada" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-matte-canvas border-hairline-border text-on-surface-variant"}`}>Entrada (reforço)</button>
                <button type="button" onClick={() => setMovType("saida")} className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${movType === "saida" ? "bg-rose-500/20 border-rose-500/40 text-rose-400" : "bg-matte-canvas border-hairline-border text-on-surface-variant"}`}>Saída (sangria/despesa)</button>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={movAmount}
                onChange={(e) => setMovAmount(e.target.value)}
                placeholder="Valor (R$)"
                className="w-full bg-matte-canvas border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
              <select
                value={movMethod}
                onChange={(e) => setMovMethod(e.target.value)}
                className="w-full bg-matte-canvas border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none cursor-pointer"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="credit">Crédito</option>
                <option value="debit">Débito</option>
                <option value="outro">Outro</option>
              </select>
              <input
                type="text"
                value={movDescription}
                onChange={(e) => setMovDescription(e.target.value)}
                placeholder="Descrição (ex: Sangria para banco, compra de material...)"
                className="w-full bg-matte-canvas border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
              <button type="submit" disabled={isSavingMovement} className="w-full bg-primary text-on-primary font-bold py-2.5 rounded-xl hover:brightness-110 cursor-pointer disabled:opacity-60">
                {isSavingMovement ? "Salvando..." : "Registrar"}
              </button>
            </form>
          )}

          {/* Form: Fechar Caixa */}
          {showCloseForm && (
            <form onSubmit={handleCloseCaixa} className="bg-surface-container border border-rose-500/30 rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-sm text-on-surface">Fechar Caixa</h4>
              <p className="text-xs text-on-surface-variant">Valor esperado: <strong className="text-primary">R$ {(summary?.expected || 0).toFixed(2)}</strong></p>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={countedAmount}
                onChange={(e) => setCountedAmount(e.target.value)}
                placeholder="Valor contado no caixa (R$)"
                className="w-full bg-matte-canvas border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary"
              />
              {countedAmount && summary && (
                <p className={`text-xs font-bold ${parseFloat(countedAmount) - summary.expected === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                  Diferença: R$ {(parseFloat(countedAmount) - summary.expected).toFixed(2)}
                </p>
              )}
              <textarea
                rows={2}
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Observações do fechamento (opcional)"
                className="w-full bg-matte-canvas border border-hairline-border rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary resize-none"
              />
              <button type="submit" disabled={isClosing} className="w-full bg-rose-500 text-white font-bold py-2.5 rounded-xl hover:brightness-110 cursor-pointer disabled:opacity-60">
                {isClosing ? "Fechando..." : "Confirmar Fechamento"}
              </button>
            </form>
          )}

          {/* Lista de Movimentações */}
          <div className="bg-elevated-card border border-hairline-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-hairline-border">
              <h4 className="font-bold text-sm text-on-surface">Movimentações de Hoje</h4>
            </div>
            <div className="divide-y divide-hairline-border max-h-80 overflow-y-auto">
              {movements.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-8">Nenhuma movimentação registrada ainda.</p>
              ) : (
                movements.map((m) => (
                  <div key={m.id} className="px-5 py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`material-symbols-outlined text-base ${m.type === "entrada" ? "text-emerald-400" : "text-rose-400"}`}>
                        {m.type === "entrada" ? "arrow_downward" : "arrow_upward"}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-on-surface truncate">{m.description || (m.type === "entrada" ? "Entrada" : "Saída")}</p>
                        <p className="text-on-surface-variant">{PAYMENT_LABELS[m.payment_method] || m.payment_method} • {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <span className={`font-bold shrink-0 ${m.type === "entrada" ? "text-emerald-400" : "text-rose-400"}`}>
                      {m.type === "entrada" ? "+" : "-"} R$ {Number(m.amount).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Histórico de caixas anteriores */}
      <div className="bg-elevated-card border border-hairline-border rounded-2xl overflow-hidden">
        <button onClick={toggleHistory} className="w-full px-5 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-surface-container-high/40 transition-colors">
          <h4 className="font-bold text-sm text-on-surface">Histórico de Caixas Anteriores</h4>
          <span className="material-symbols-outlined text-on-surface-variant">{showHistory ? "expand_less" : "expand_more"}</span>
        </button>
        {showHistory && (
          <div className="border-t border-hairline-border overflow-x-auto">
            {isLoadingHistory ? (
              <p className="text-xs text-on-surface-variant text-center py-6">Carregando...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-6">Nenhum caixa fechado ainda.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant uppercase font-bold">
                    <th className="p-3">Data</th>
                    <th className="p-3">Aberto/Fechado por</th>
                    <th className="p-3 text-right">Esperado</th>
                    <th className="p-3 text-right">Contado</th>
                    <th className="p-3 text-right">Diferença</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-border">
                  {history.map((s) => (
                    <tr key={s.id}>
                      <td className="p-3 text-on-surface-variant">{new Date(s.closed_at).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3 text-on-surface">{s.opened_by_name} / {s.closed_by_name}</td>
                      <td className="p-3 text-right text-on-surface">R$ {Number(s.expected_amount).toFixed(2)}</td>
                      <td className="p-3 text-right text-on-surface">R$ {Number(s.counted_amount).toFixed(2)}</td>
                      <td className={`p-3 text-right font-bold ${Number(s.difference_amount) === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                        R$ {Number(s.difference_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
