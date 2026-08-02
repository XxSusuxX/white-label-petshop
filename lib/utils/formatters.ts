/**
 * Utilitários e formatadores reutilizáveis de input para mascarar telefone, CPF, peso e idade de pets.
 */

export function formatPhone(value: string): string {
  let v = value.replace(/\D/g, "").substring(0, 11);
  if (v.length > 10) {
    return v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  } else if (v.length > 5) {
    return v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
  } else if (v.length > 2) {
    return v.replace(/^(\d{2})(\d{0,5})$/, "($1) $2");
  }
  return v;
}

export function formatCpf(value: string): string {
  let v = value.replace(/\D/g, "").substring(0, 11);
  if (v.length > 9) {
    return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
  } else if (v.length > 6) {
    return v.replace(/^(\d{3})(\d{3})(\d{0,3})$/, "$1.$2.$3");
  } else if (v.length > 3) {
    return v.replace(/^(\d{3})(\d{0,3})$/, "$1.$2");
  }
  return v;
}

export function formatFloatInput(val: string): string {
  let cleaned = val.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts[1]}`;
  }
  if (parts[1] && parts[1].length > 1) {
    cleaned = `${parts[0]}.${parts[1].slice(0, 1)}`;
  }
  if (cleaned.length > 4) {
    cleaned = cleaned.slice(0, 4);
  }
  return cleaned;
}

export function getFormattedAge(yStr: string, mStr: string): string {
  const y = parseInt(yStr || "0", 10);
  const m = parseInt(mStr || "0", 10);
  if (y === 0 && m === 0) return "Não informada";
  const yText = y > 0 ? `${y} ${y === 1 ? "ano" : "anos"}` : "";
  const mText = m > 0 ? `${m} ${m === 1 ? "mês" : "meses"}` : "";
  if (yText && mText) return `${yText} e ${mText}`;
  return yText || mText;
}
