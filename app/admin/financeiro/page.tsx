"use client";

import { useEffect, useMemo, useState } from "react";

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string;
}

interface TopClient {
  client_id: string;
  full_name: string;
  phone: string;
  total_spent: number;
  purchase_count: number;
  avg_ticket: number;
  last_purchase_at: string;
}

interface CashSession {
  id: string;
  closed_at: string;
  opening_amount: number;
  expected_amount: number;
  counted_amount: number;
  difference_amount: number;
  closed_by_name: string;
}

interface FinanceReport {
  period: { from: string; to: string };
  revenue: {
    pdv_total: number;
    pdv_count: number;
    avg_ticket: number;
    by_payment_method: Record<string, number>;
    by_category: Record<string, number>;
    completed_appointments_outside_pdv: number;
    completed_appointments_count: number;
  };
  expenses: { total: number; by_category: Record<string, number>; items: Expense[] };
  net_result: number;
  deferred_package_value: number;
  top_clients: TopClient[];
  recent_cash_sessions: CashSession[];
}

const CATEGORY_LABELS: Record<string, string> = {
  service: "Serviços",
  product: "Produtos",
  package: "Pacotes",
  outros: "Outros",
};

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  credito: "Cartão de Crédito",
  debito: "Cartão de Débito",
  outro: "Outro",
};

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  aluguel: "Aluguel",
  salarios: "Salários",
  fornecedores: "Fornecedores / Insumos",
  marketing: "Marketing",
  manutencao: "Manutenção",
  outros: "Outros",
};

const fmt = (v: number) => `R$ ${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function firstDayOfMonthIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

type PeriodPreset = "mes_atual" | "mes_passado" | "30_dias" | "personalizado";

export default function FinanceiroPage() {
  const [preset, setPreset] = useState<PeriodPreset>("mes_atual");
  const [customFrom, setCustomFrom] = useState(firstDayOfMonthIso());
  const [customTo, setCustomTo] = useState(todayIso());

  const { from, to } = useMemo(() => {
    if (preset === "mes_atual") return { from: firstDayOfMonthIso(), to: todayIso() };
    if (preset === "30_dias") return { from: daysAgoIso(30), to: todayIso() };
    if (preset === "mes_passado") {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - 1);
      const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const to = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      return { from, to };
    }
    return { from: customFrom, to: customTo };
  }, [preset, customFrom, customTo]);

  const [report, setReport] = useState<FinanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadReport = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/financeiro?from=${from}&to=${to}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Não foi possível carregar o relatório financeiro.");
      setReport(data);
    } catch (err: any) {
      console.error("Erro ao carregar financeiro:", err);
      setLoadError(err.message || "Erro ao carregar o relatório financeiro.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  // Formulário de nova despesa
  const [expDescription, setExpDescription] = useState("");
  const [expCategory, setExpCategory] = useState("outros");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(todayIso());
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  const handleAddExpense = async () => {
    if (!expDescription.trim() || !expAmount || Number(expAmount) <= 0) {
      alert("Preencha a descrição e um valor válido.");
      return;
    }
    setIsSavingExpense(true);
    try {
      const res = await fetch("/api/admin/financeiro/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: expDescription.trim(),
          category: expCategory,
          amount: Number(expAmount),
          expense_date: expDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao salvar despesa.");
      setExpDescription("");
      setExpAmount("");
      setExpCategory("outros");
      setExpDate(todayIso());
      await loadReport();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Remover essa despesa?")) return;
    try {
      const res = await fetch(`/api/admin/financeiro/expenses?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await loadReport();
    } catch {
      alert("Não foi possível remover. Tente novamente.");
    }
  };

  const totalRevenue = report ? report.revenue.pdv_total + report.revenue.completed_appointments_outside_pdv : 0;

  return (
    <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Financeiro</h1>
          <p className="text-sm text-on-surface-variant mt-1">Receita, despesas e relatório por cliente.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { key: "mes_atual", label: "Este mês" },
              { key: "mes_passado", label: "Mês passado" },
              { key: "30_dias", label: "Últimos 30 dias" },
              { key: "personalizado", label: "Personalizado" },
            ] as { key: PeriodPreset; label: string }[]
          ).map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                preset === p.key
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-container text-on-surface-variant border-hairline-border hover:border-primary/30"
              }`}
            >
              {p.label}
            </button>
          ))}
          {preset === "personalizado" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-matte-canvas border border-hairline-border rounded-lg px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
              />
              <span className="text-xs text-on-surface-variant">até</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-matte-canvas border border-hairline-border rounded-lg px-2 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-3xl animate-spin text-primary">sync</span>
        </div>
      )}

      {!isLoading && loadError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold px-4 py-3 rounded-xl">{loadError}</div>
      )}

      {!isLoading && !loadError && report && (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-elevated-card border border-hairline-border rounded-2xl p-4">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase">Faturamento</p>
              <p className="text-xl font-extrabold text-on-surface mt-1">{fmt(totalRevenue)}</p>
              <p className="text-[10px] text-on-surface-variant mt-1">
                PDV: {fmt(report.revenue.pdv_total)} · Agenda: {fmt(report.revenue.completed_appointments_outside_pdv)}
              </p>
            </div>
            <div className="bg-elevated-card border border-hairline-border rounded-2xl p-4">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase">Despesas</p>
              <p className="text-xl font-extrabold text-red-400 mt-1">{fmt(report.expenses.total)}</p>
              <p className="text-[10px] text-on-surface-variant mt-1">{report.expenses.items.length} lançamento(s)</p>
            </div>
            <div className="bg-elevated-card border border-hairline-border rounded-2xl p-4">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase">Resultado</p>
              <p className={`text-xl font-extrabold mt-1 ${report.net_result >= 0 ? "text-primary" : "text-red-400"}`}>
                {fmt(report.net_result)}
              </p>
              <p className="text-[10px] text-on-surface-variant mt-1">Faturamento − Despesas</p>
            </div>
            <div className="bg-elevated-card border border-hairline-border rounded-2xl p-4">
              <p className="text-[11px] font-bold text-on-surface-variant uppercase">Ticket Médio (PDV)</p>
              <p className="text-xl font-extrabold text-on-surface mt-1">{fmt(report.revenue.avg_ticket)}</p>
              <p className="text-[10px] text-on-surface-variant mt-1">{report.revenue.pdv_count} venda(s)</p>
            </div>
          </div>

          {/* Receita diferida de pacotes */}
          <div className="bg-primary/5 border border-primary/30 rounded-2xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">loyalty</span>
            <div>
              <p className="text-sm font-bold text-on-surface">
                {fmt(report.deferred_package_value)} em créditos de pacotes ainda não utilizados
              </p>
              <p className="text-[11px] text-on-surface-variant">
                Valor já recebido de pacotes ativos, mas cujo serviço ainda não foi prestado — receita diferida (não entra no
                resultado acima).
              </p>
            </div>
          </div>

          {/* Breakdown por categoria e forma de pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-on-surface mb-3">Faturamento PDV por Categoria</h3>
              <div className="space-y-2">
                {Object.entries(report.revenue.by_category)
                  .filter(([, v]) => v > 0)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, value]) => (
                    <div key={cat} className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">{CATEGORY_LABELS[cat] || cat}</span>
                      <span className="font-bold text-on-surface">{fmt(value)}</span>
                    </div>
                  ))}
                {Object.values(report.revenue.by_category).every((v) => v === 0) && (
                  <p className="text-xs text-on-surface-variant">Sem vendas no período.</p>
                )}
              </div>
            </div>

            <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-on-surface mb-3">Faturamento PDV por Forma de Pagamento</h3>
              <div className="space-y-2">
                {Object.entries(report.revenue.by_payment_method)
                  .sort((a, b) => b[1] - a[1])
                  .map(([method, value]) => (
                    <div key={method} className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">{PAYMENT_LABELS[method] || method}</span>
                      <span className="font-bold text-on-surface">{fmt(value)}</span>
                    </div>
                  ))}
                {Object.keys(report.revenue.by_payment_method).length === 0 && (
                  <p className="text-xs text-on-surface-variant">Sem vendas no período.</p>
                )}
              </div>
            </div>
          </div>

          {/* Relatório por cliente */}
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5">
            <h3 className="text-sm font-bold text-on-surface mb-3">Top Clientes (histórico completo)</h3>
            {report.top_clients.length === 0 ? (
              <p className="text-xs text-on-surface-variant">Nenhuma venda vinculada a um cliente ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-on-surface-variant border-b border-hairline-border">
                      <th className="pb-2 font-bold">Cliente</th>
                      <th className="pb-2 font-bold text-right">Total Gasto</th>
                      <th className="pb-2 font-bold text-right">Compras</th>
                      <th className="pb-2 font-bold text-right">Ticket Médio</th>
                      <th className="pb-2 font-bold text-right">Última Compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.top_clients.map((c) => (
                      <tr key={c.client_id} className="border-b border-hairline-border/50 last:border-0">
                        <td className="py-2 font-bold text-on-surface">{c.full_name}</td>
                        <td className="py-2 text-right text-primary font-bold">{fmt(c.total_spent)}</td>
                        <td className="py-2 text-right text-on-surface-variant">{c.purchase_count}</td>
                        <td className="py-2 text-right text-on-surface-variant">{fmt(c.avg_ticket)}</td>
                        <td className="py-2 text-right text-on-surface-variant">
                          {new Date(c.last_purchase_at).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Últimos fechamentos de caixa */}
          {report.recent_cash_sessions.length > 0 && (
            <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-on-surface mb-3">Últimos Fechamentos de Caixa</h3>
              <div className="space-y-2">
                {report.recent_cash_sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs py-1.5 border-b border-hairline-border/50 last:border-0">
                    <div>
                      <span className="font-bold text-on-surface">{new Date(s.closed_at).toLocaleDateString("pt-BR")}</span>
                      <span className="text-on-surface-variant ml-2">por {s.closed_by_name || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-on-surface-variant">Esperado: {fmt(s.expected_amount)}</span>
                      <span className="text-on-surface-variant">Contado: {fmt(s.counted_amount)}</span>
                      <span className={`font-bold ${Number(s.difference_amount) === 0 ? "text-on-surface-variant" : Number(s.difference_amount) > 0 ? "text-primary" : "text-red-400"}`}>
                        {Number(s.difference_amount) >= 0 ? "+" : ""}
                        {fmt(s.difference_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Despesas */}
          <div className="bg-elevated-card border border-hairline-border rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-on-surface">Despesas</h3>

            <div className="flex flex-wrap items-end gap-3 bg-surface-container border border-hairline-border rounded-xl p-3.5">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Descrição</label>
                <input
                  type="text"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="Ex: Conta de luz"
                  className="w-full bg-matte-canvas border border-hairline-border rounded-lg px-2.5 py-2 text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Categoria</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="bg-matte-canvas border border-hairline-border rounded-lg px-2.5 py-2 text-xs text-on-surface outline-none focus:border-primary cursor-pointer"
                >
                  {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Valor (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="0,00"
                  className="w-28 bg-matte-canvas border border-hairline-border rounded-lg px-2.5 py-2 text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Data</label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="bg-matte-canvas border border-hairline-border rounded-lg px-2.5 py-2 text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={handleAddExpense}
                disabled={isSavingExpense}
                className="bg-primary text-on-primary font-bold text-xs px-4 py-2.5 rounded-lg extruded-shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Adicionar
              </button>
            </div>

            {report.expenses.items.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">Nenhuma despesa registrada no período.</p>
            ) : (
              <div className="space-y-1.5">
                {report.expenses.items
                  .slice()
                  .sort((a, b) => (a.expense_date < b.expense_date ? 1 : -1))
                  .map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-xs py-2 border-b border-hairline-border/50 last:border-0">
                      <div>
                        <span className="font-bold text-on-surface">{e.description}</span>
                        <span className="text-on-surface-variant ml-2">
                          {EXPENSE_CATEGORY_LABELS[e.category] || e.category} · {new Date(`${e.expense_date}T00:00:00`).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-400">{fmt(e.amount)}</span>
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="text-on-surface-variant hover:text-red-400 p-1 rounded-lg cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
