export type UserRole =
  | "admin"
  | "dono"
  | "recepcionista"
  | "banhista"
  | "tosador"
  | "banhista_tosador"
  | "motorista"
  | "entregador"
  | "auxiliar"
  | "veterinario"
  | string;

/**
  * Verifica se determinado cargo tem permissão para acessar uma rota do Admin.
  */
export function canAccessRoute(rawRole?: string | null, routeHref?: string): boolean {
  if (!routeHref) return true;

  const role = (rawRole || "").toLowerCase().trim();
  const href = routeHref.toLowerCase();

  // Dono e Administrador possuem acesso total irrestrito
  const isOwnerOrAdmin =
    role === "admin" ||
    role === "dono" ||
    role === "owner" ||
    role === "administrador" ||
    role === "dono(a)";

  if (isOwnerOrAdmin) return true;

  // 1. Escala de Equipe & Registrar Admin: APENAS Administrador e Dono
  if (href.includes("/equipe") || href.includes("/register-admin") || href.includes("/registro-admin")) {
    return false;
  }

  // 2. Horário de Funcionamento: APENAS Dono, Administrador e Recepcionista
  if (href.includes("/horarios") || href.includes("/horario-funcionamento")) {
    const isReceptionist =
      role === "recepcionista" ||
      role === "receptionist" ||
      role === "atendente";
    return isReceptionist;
  }

  // 3. Banhista / Tosador e Motorista / Entregador: Telas Simplificadas
  // (Dashboard, Operação ao Vivo, Agenda, Clientes, Pets e Central WhatsApp)
  const isBatherOrDriver =
    role === "banhista" ||
    role === "tosador" ||
    role === "groomer" ||
    role === "bather" ||
    role === "banhista_tosador" ||
    role === "motorista" ||
    role === "entregador" ||
    role === "driver";

  if (isBatherOrDriver) {
    const allowedExact = [
      "/admin",
      "/admin/dashboard",
      "/admin/operacao",
      "/admin/agenda",
      "/admin/clientes",
      "/admin/pets",
      "/admin/whatsapp",
    ];
    return allowedExact.some((path) => href === path || href.startsWith(path));
  }

  // 4. Recepcionista, Auxiliar Geral e Veterinário: Acesso Geral Operacional, PDV, Financeiro e Vet
  // (Mas sem Escala de Equipe, sem Registrar Admin, e no caso de Auxiliar/Vet sem Horário de Funcionamento)
  return true;
}
