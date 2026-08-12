import { AsyncLocalStorage } from "async_hooks";

interface TenantContext {
  tenantId: string;
}

/**
 * Armazenamento de contexto por requisição. Permite que qualquer função
 * (lib/server/*, rotas) descubra o tenant atual sem precisar receber o id como
 * parâmetro — basta chamar getTenantId(). O escopo é criado por withTenant() /
 * withTenantRoute() no início de cada requisição.
 */
export const tenantStorage = new AsyncLocalStorage<TenantContext>();

/** Retorna o tenant (pet_shop_id) do escopo atual. Lança erro se não foi resolvido. */
export function getTenantId(): string {
  const ctx = tenantStorage.getStore();
  if (!ctx?.tenantId) {
    throw new Error(
      "Nenhum tenant resolvido neste escopo. Envolva a operação com withTenant/withTenantRoute."
    );
  }
  return ctx.tenantId;
}

/** Executa fn dentro do contexto do tenant informado. */
export function withTenant<T>(tenantId: string, fn: () => Promise<T> | T): Promise<T> {
  return tenantStorage.run({ tenantId }, async () => fn());
}
