/**
 * Retorna a URL base dinâmica do ambiente (Localhost em Dev, Vercel ou Domínio Customizado em Prod).
 * Recomendado pela documentação oficial do Supabase SSR.
 */
export const getURL = (path: string = "") => {
  let url =
    (typeof window !== "undefined" && window.location.origin ? window.location.origin : null) ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";

  // Garante que tenha o prefixo http:// ou https://
  url = url.startsWith("http") ? url : `https://${url}`;
  // Garante que não termine com barra duplicada antes de concatenar o path
  url = url.endsWith("/") ? url.slice(0, -1) : url;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${url}${cleanPath}`;
};
