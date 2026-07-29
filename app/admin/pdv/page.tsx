"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminSidebar } from "@/components/ui/admin-sidebar";
import { AdminBottomNav } from "@/components/ui/admin-bottom-nav";

interface CartItem {
  id: string;
  name: string;
  category: "product" | "service" | "package";
  price: number;
  qty: number;
}

interface CatalogItem {
  id: string;
  name: string;
  category: "product" | "service" | "package";
  price: number;
}

export default function PdvAdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("Tutor Avulso (Balcão)");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit" | "debit" | "cash">("pix");
  const [discount, setDiscount] = useState<number>(0);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [lastSaleTotal, setLastSaleTotal] = useState<number>(0);

  // Available catalog
  const catalog: CatalogItem[] = [
    { id: "1", name: "Banho & Tosa Completo (Cão Porte M)", category: "service", price: 85.0 },
    { id: "2", name: "Higienização Auricular & Corte de Unhas", category: "service", price: 35.0 },
    { id: "3", name: "Consulta Veterinária Geral", category: "service", price: 150.0 },
    { id: "4", name: "Pacote Banho Mensal 4x", category: "package", price: 149.9 },
    { id: "5", name: "Plano Premium Anual (Estética + Vet)", category: "package", price: 299.9 },
    { id: "6", name: "Ração Premium Cães Adultos 15kg", category: "product", price: 189.9 },
    { id: "7", name: "Shampoo Hipoalergênico Pet 500ml", category: "product", price: 42.0 },
    { id: "8", name: "Brinquedo Mordedor Resistente", category: "product", price: 28.5 },
  ];

  const [cart, setCart] = useState<CartItem[]>([
    { id: "1", name: "Banho & Tosa Completo (Cão Porte M)", category: "service", price: 85.0, qty: 1 },
    { id: "7", name: "Shampoo Hipoalergênico Pet 500ml", category: "product", price: 42.0, qty: 1 },
  ]);

  const addToCart = (item: CatalogItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
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
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = Math.max(0, subtotal - discount);

  const handleFinishSale = () => {
    if (cart.length === 0) {
      alert("O carrinho está vazio!");
      return;
    }
    setLastSaleTotal(total);
    setShowReceiptModal(true);
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
    <div className="bg-matte-canvas text-on-surface font-body-base antialiased min-h-screen flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
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
            <div className="bg-surface-container-high border border-hairline-border px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></span>
              <span className="text-body-sm font-label-bold text-on-surface">Caixa Aberto</span>
            </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-elevated-card border border-hairline-border hover:border-primary/50 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between gap-3 group"
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

                  <div className="text-primary font-headline-md font-bold text-lg">
                    R$ {item.price.toFixed(2).replace(".", ",")}
                  </div>
                </div>
              ))}
            </div>
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
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-surface-container border border-hairline-border rounded-xl px-4 py-2.5 text-on-surface text-body-sm outline-none focus:border-primary transition-all cursor-pointer"
              >
                <option value="Tutor Avulso (Balcão)">Tutor Avulso (Balcão)</option>
                <option value="Carlos Eduardo (Pet: Thor)">Carlos Eduardo (Pet: Thor)</option>
                <option value="Mariana Costa (Pet: Mel)">Mariana Costa (Pet: Mel)</option>
                <option value="Welington Souza (Pet: Bidu)">Welington Souza (Pet: Bidu)</option>
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
                        className="w-7 h-7 bg-surface-container-high rounded-lg flex items-center justify-center text-on-surface hover:bg-primary/20 hover:text-primary transition-all"
                      >
                        -
                      </button>
                      <span className="font-label-bold text-body-sm px-1 min-w-[20px] text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-7 h-7 bg-surface-container-high rounded-lg flex items-center justify-center text-on-surface hover:bg-primary/20 hover:text-primary transition-all"
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
              className="w-full bg-primary text-on-primary font-label-bold text-body-lg py-4 rounded-xl extruded-shadow emerald-glow-effect hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined">check_circle</span>
              Finalizar Venda & Emitir Comprovante
            </button>
          </section>
        </div>
      </main>

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
              Cliente: <strong>{selectedClient}</strong>
            </p>

            <div className="bg-surface-container p-4 rounded-2xl w-full text-left space-y-1.5 text-xs text-on-surface-variant border border-hairline-border">
              <p className="flex justify-between"><span>Comprovante:</span> <strong className="text-on-surface">#NFCe-2026-0891</strong></p>
              <p className="flex justify-between"><span>Pagamento:</span> <strong className="uppercase text-on-surface">{paymentMethod}</strong></p>
              <p className="flex justify-between"><span>Status WhatsApp:</span> <strong className="text-primary">Recibo Enviado</strong></p>
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

      <AdminBottomNav />
    </div>
  );
}
