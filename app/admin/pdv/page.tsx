"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CaixaPanel from "./CaixaPanel";

interface CartItem {
  id: string;
  name: string;
  category: "product" | "service" | "package";
  price: number;
  qty: number;
  stock_quantity: number | null;
}

interface CatalogItem {
  id: string;
  name: string;
  category: "product" | "service" | "package";
  price: number;
  stock_quantity: number | null;
}

export default function PdvAdminPage() {
  const [activeTab, setActiveTab] = useState<"venda" | "caixa">("venda");
  const [hasOpenSession, setHasOpenSession] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedClientId, setSelectedClientId] = useState<string>("avulso");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit" | "debit" | "cash">("pix");
  const [discount, setDiscount] = useState<number>(0);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [lastSaleTotal, setLastSaleTotal] = useState<number>(0);
  const [lastSaleId, setLastSaleId] = useState<string>("");
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);

  // Dynamic catalog and clients from Supabase
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [clientsList, setClientsList] = useState<{id: string; label: string}[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPdvData = async () => {
      setIsLoadingCatalog(true);
      setLoadError(null);
      try {
        // Load catalog from services API
        const servicesRes = await fetch("/api/admin/services");
        const servicesData = await servicesRes.json();
        if (!servicesRes.ok) throw new Error(servicesData?.error || "Não foi possível carregar o catálogo.");
        if (servicesData.services) {
          setCatalog(servicesData.services.map((s: any) => ({
            id: s.id,
            name: s.name,
            category: s.category as "product" | "service" | "package",
            price: s.price,
            stock_quantity: s.stock_quantity ?? null,
          })));
        }

        // Load real clients
        const clientsRes = await fetch("/api/admin/clients");
        const clientsData = await clientsRes.json();
        if (!clientsRes.ok) throw new Error(clientsData?.error || "Não foi possível carregar os clientes.");
        if (clientsData.clients) {
          setClientsList([
            { id: "avulso", label: "Tutor Avulso (Balcão)" },
            ...clientsData.clients.map((c: any) => ({
              id: c.id,
              label: `${c.full_name}${c.pets.length > 0 ? ` (Pet: ${c.pets.map((p: any) => p.name).join(", ")})` : ""}`,
            })),
          ]);
        }
      } catch (err: any) {
        console.error("Erro ao carregar dados do PDV:", err);
        setLoadError(err.message || "Erro ao carregar dados do PDV.");
      } finally {
        setIsLoadingCatalog(false);
      }
  };

  const checkCaixaStatus = async () => {
    try {
      const res = await fetch("/api/admin/caixa");
      const data = await res.json();
      if (res.ok) setHasOpenSession(!!data.session);
    } catch (err) {
      console.error("Erro ao verificar status do caixa:", err);
    }
  };

  useEffect(() => {
    loadPdvData();
    checkCaixaStatus();
  }, []);

  const addToCart = (item: CatalogItem) => {
    if (item.id.startsWith("def-")) {
      alert("Este é um item de exemplo. Cadastre-o em Serviços & Preços antes de vendê-lo.");
      return;
    }
    if (item.stock_quantity !== null && item.stock_quantity <= 0) {
      alert("Este produto está sem estoque.");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        if (item.stock_quantity !== null && existing.qty + 1 > item.stock_quantity) {
          alert(`Só há ${item.stock_quantity} unidade(s) em estoque.`);
          return prev;
        }
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.qty + delta;
            if (newQty <= 0) return null;
            if (delta > 0 && i.stock_quantity !== null && newQty > i.stock_quantity) {
              alert(`Só há ${i.stock_quantity} unidade(s) em estoque.`);
              return i;
            }
            return { ...i, qty: newQty };
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const selectedClientLabel =
    clientsList.find((c) => c.id === selectedClientId)?.label || "Tutor Avulso (Balcão)";

  const handleFinishSale = async () => {
    if (cart.length === 0) {
      alert("O carrinho está vazio!");
      return;
    }
    if (!hasOpenSession) {
      alert("Abra o caixa antes de finalizar uma venda.");
      setActiveTab("caixa");
      return;
    }
    setIsSubmittingSale(true);
    try {
      const res = await fetch("/api/admin/pdv/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: selectedClientId === "avulso" ? null : selectedClientId,
          payment_method: paymentMethod,
          items: cart,
          subtotal,
          discount,
          total,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao finalizar a venda.");

      setLastSaleTotal(total);
      setLastSaleId(data.sale?.id || "");
      setShowReceiptModal(true);
    } catch (err: any) {
      console.error("Erro ao finalizar venda:", err);
      alert(err.message || "Não foi possível finalizar a venda. Tente novamente.");
    } finally {
      setIsSubmittingSale(false);
    }
  };

  const resetCart = () => {
    setCart([]);
    setDiscount(0);
    setShowReceiptModal(false);
  };

  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <main className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container border border-hairline-border p-6 rounded-2xl extruded-shadow">
          <div>
            <div className="flex items-center gap-2 text-primary font-label-bold text-xs uppercase tracking-widest mb-1">
              <span className="material-symbols-outlined text-sm">point_of_sale</span>
              Frente de Caixa & Pacotes
            </div>
            <h1 className="text-headline-md font-headline-md font-bold text-on-surface">PDV Operacional</h1>
          </div>

          <div className="flex items-center gap-3">
            {hasOpenSession !== null && (
              <div
                className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${
                  hasOpenSession
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-rose-500/10 border-rose-500/30"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${hasOpenSession ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`}></span>
                <span className={`text-body-sm font-label-bold ${hasOpenSession ? "text-emerald-400" : "text-rose-400"}`}>
                  {hasOpenSession ? "Caixa Aberto" : "Caixa Fechado"}
                </span>
              </div>
            )}
            <Link
              href="/agendar"
              target="_blank"
              className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded-xl text-body-sm font-label-bold flex items-center gap-2 hover:bg-primary/20 transition-all"
            >
              <span className="material-symbols-outlined text-sm">link</span>
              Link Público de Agendamento
            </Link>
          </div>
        </header>

        {/* Tabs: Venda / Caixa */}
        <div className="flex gap-2 bg-surface-container border border-hairline-border rounded-xl p-1.5 w-fit">
          {(["venda", "caixa"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === tab
                  ? "bg-primary text-on-primary extruded-shadow"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {tab === "venda" ? "shopping_cart" : "point_of_sale"}
              </span>
              {tab === "venda" ? "Venda" : "Caixa"}
            </button>
          ))}
        </div>

        {activeTab === "caixa" ? (
          <CaixaPanel onSessionChange={setHasOpenSession} />
        ) : (
        <>
        {hasOpenSession === false && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-bold px-4 py-3 rounded-xl flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">warning</span>
              Nenhum caixa aberto. Abra o caixa para começar a vender.
            </span>
            <button onClick={() => setActiveTab("caixa")} className="bg-rose-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:brightness-110 cursor-pointer">
              Abrir Caixa
            </button>
          </div>
        )}
        {/* PDV Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Catalog (7 cols) */}
          <section className="lg:col-span-7 bg-surface-container border border-hairline-border rounded-2xl p-6 flex flex-col gap-4">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar produto, serviço ou pacote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl pl-11 pr-4 py-3 text-on-surface placeholder:text-outline outline-none focus:border-primary transition-all text-body-sm"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: "all", label: "Todos" },
                  { id: "service", label: "Serviços" },
                  { id: "product", label: "Produtos" },
                  { id: "package", label: "Pacotes" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-label-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            {loadError ? (
              <div className="p-8 text-center bg-elevated-card rounded-xl border border-rose-500/30 space-y-3">
                <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
                <p className="font-bold text-rose-400 text-sm">{loadError}</p>
                <button
                  onClick={loadPdvData}
                  className="bg-primary text-on-primary font-bold text-xs px-4 py-2 rounded-xl hover:brightness-110 cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredCatalog.map((item) => {
                const outOfStock = item.stock_quantity !== null && item.stock_quantity <= 0;
                return (
                <div
                  key={item.id}
                  onClick={() => !outOfStock && addToCart(item)}
                  className={`bg-elevated-card border border-hairline-border p-4 rounded-xl transition-all duration-200 flex flex-col justify-between gap-3 group ${
                    item.id.startsWith("def-") || outOfStock
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:border-primary/50 hover:scale-[1.02]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-label-bold px-2 py-0.5 rounded uppercase ${
                        item.category === "package"
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : item.category === "service"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {item.category === "package" ? "Pacote Recorrente" : item.category === "service" ? "Serviço" : "Produto"}
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-xl">
                      add_circle
                    </span>
                  </div>

                  <h3 className="font-label-bold text-on-surface text-body-sm leading-snug line-clamp-2">{item.name}</h3>

                  <div className="flex items-center justify-between">
                    <div className="text-primary font-headline-md font-bold text-lg">
                      R$ {item.price.toFixed(2).replace(".", ",")}
                    </div>
                    {item.category === "product" && item.stock_quantity !== null && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        outOfStock ? "text-rose-400 bg-rose-500/10" : item.stock_quantity < 5 ? "text-amber-400 bg-amber-500/10" : "text-on-surface-variant"
                      }`}>
                        {outOfStock ? "Sem estoque" : `${item.stock_quantity} un.`}
                      </span>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
            )}
          </section>

          {/* Right Column: Checkout / Cart (5 cols) */}
          <section className="lg:col-span-5 bg-elevated-card border border-hairline-border rounded-2xl p-6 flex flex-col gap-6 extruded-shadow">
            <div className="flex items-center justify-between border-b border-hairline-border pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">shopping_cart</span>
                <h2 className="font-label-bold text-headline-md text-on-surface">Carrinho de Compras</h2>
              </div>
              <span className="text-caption font-label-bold bg-surface-container px-2.5 py-1 rounded-full text-on-surface-variant">
                {cart.reduce((s, i) => s + i.qty, 0)} itens
              </span>
            </div>

            {/* Tutor Selection */}
            <div>
              <label className="block text-caption font-label-bold text-on-surface-variant mb-2">Vincular Cliente / Pet</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-surface-container border border-hairline-border rounded-xl px-4 py-2.5 text-on-surface text-body-sm outline-none focus:border-primary transition-all cursor-pointer"
              >
                {clientsList.length === 0 ? (
                  <option value="avulso">Tutor Avulso (Balcão)</option>
                ) : (
                  clientsList.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))
                )}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant text-caption">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2 block">remove_shopping_cart</span>
                  Nenhum item adicionado ao carrinho.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 bg-surface-container p-3 rounded-xl border border-hairline-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-label-bold text-on-surface text-body-sm truncate">{item.name}</p>
                      <p className="text-caption text-on-surface-variant">R$ {item.price.toFixed(2).replace(".", ",")}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-11 h-11 bg-surface-container-high rounded-xl flex items-center justify-center text-on-surface hover:bg-primary/20 hover:text-primary transition-all text-lg font-bold"
                      >
                        -
                      </button>
                      <span className="font-label-bold text-body-sm px-1 min-w-[24px] text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-11 h-11 bg-surface-container-high rounded-xl flex items-center justify-center text-on-surface hover:bg-primary/20 hover:text-primary transition-all text-lg font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="font-label-bold text-primary text-body-sm shrink-0 min-w-[70px] text-right">
                      R$ {(item.price * item.qty).toFixed(2).replace(".", ",")}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="border-t border-hairline-border pt-4">
              <label className="block text-caption font-label-bold text-on-surface-variant mb-2">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "pix", label: "PIX QrCode", icon: "qr_code_2" },
                  { id: "credit", label: "Crédito", icon: "credit_card" },
                  { id: "debit", label: "Débito", icon: "payment" },
                  { id: "cash", label: "Dinheiro", icon: "payments" },
                ].map((pay) => (
                  <button
                    key={pay.id}
                    type="button"
                    onClick={() => setPaymentMethod(pay.id as any)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                      paymentMethod === pay.id
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-surface-container border-hairline-border text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{pay.icon}</span>
                    <span className="text-xs font-label-bold">{pay.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-surface-container p-4 rounded-xl border border-hairline-border space-y-2">
              <div className="flex justify-between text-body-sm text-on-surface-variant">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between items-center text-body-sm text-on-surface-variant">
                <span>Desconto (R$)</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0,00"
                  className="w-20 bg-surface-container-lowest border border-hairline-border rounded px-2 py-1 text-right text-on-surface text-xs outline-none"
                />
              </div>
              <div className="flex justify-between text-headline-md font-bold text-primary pt-2 border-t border-hairline-border">
                <span>TOTAL</span>
                <span>R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>

            {/* Action Submit */}
            <button
              onClick={handleFinishSale}
              disabled={isSubmittingSale || hasOpenSession === false}
              className="w-full bg-primary text-on-primary font-label-bold text-body-lg py-4 rounded-xl extruded-shadow emerald-glow-effect hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">check_circle</span>
              {isSubmittingSale ? "Finalizando..." : hasOpenSession === false ? "Abra o caixa para vender" : "Finalizar Venda & Emitir Comprovante"}
            </button>
          </section>
        </div>

      {/* Success Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-elevated-card border border-primary/30 rounded-3xl p-8 max-w-md w-full text-center extruded-shadow flex flex-col items-center gap-4 animate-scale-up">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">task_alt</span>
            </div>

            <h2 className="text-headline-md font-bold text-on-surface">Venda Realizada com Sucesso!</h2>
            <p className="text-body-sm text-on-surface-variant">
              Valor final: <strong className="text-primary text-lg">R$ {lastSaleTotal.toFixed(2).replace(".", ",")}</strong> <br />
              Cliente: <strong>{selectedClientLabel}</strong>
            </p>

            <div className="bg-surface-container p-4 rounded-2xl w-full text-left space-y-1.5 text-xs text-on-surface-variant border border-hairline-border">
              <p className="flex justify-between"><span>Venda:</span> <strong className="text-on-surface">#{lastSaleId.slice(0, 8).toUpperCase()}</strong></p>
              <p className="flex justify-between"><span>Pagamento:</span> <strong className="uppercase text-on-surface">{paymentMethod}</strong></p>
            </div>

            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={resetCart}
                className="flex-1 bg-primary text-on-primary font-label-bold py-3.5 rounded-xl hover:brightness-110 transition-all cursor-pointer text-body-sm"
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </main>
  );
}
