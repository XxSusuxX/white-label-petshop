/**
 * Utilitários e formatadores reutilizáveis de input para mascarar telefone, CPF, peso e idade de pets.
 */

export function formatPhone(value: string): string {
  let v = value.replace(/\D/g, "").substring(0, 11);
  if (v.length === 0) return "";
  if (v.length <= 2) return `(${v}`;
  if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}

export function formatCpf(value: string): string {
  let v = value.replace(/\D/g, "").substring(0, 11);
  if (v.length === 0) return "";
  if (v.length <= 3) return v;
  if (v.length <= 6) return `${v.slice(0, 3)}.${v.slice(3)}`;
  if (v.length <= 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
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

export function calculateAgeFromBirthDate(birthDateStr?: string | null): string {
  if (!birthDateStr) return "Não informada";
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return birthDateStr; // fallback if it's already a string like "2 anos"
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (now.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  if (years <= 0 && months <= 0) return "Menos de 1 mês";
  return getFormattedAge(Math.max(0, years).toString(), Math.max(0, months).toString());
}

export function calculateBirthDateFromAge(yearsStr?: string | number, monthsStr?: string | number): string | null {
  const years = parseInt(String(yearsStr || 0), 10);
  const months = parseInt(String(monthsStr || 0), 10);
  if (years === 0 && months === 0) return null;
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split("T")[0];
}

export function getYearsMonthsFromBirthDate(birthDateStr?: string | null): { years: string; months: string } {
  if (!birthDateStr) return { years: "0", months: "0" };
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return { years: "0", months: "0" };
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (now.getDate() < birth.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  return {
    years: Math.max(0, years).toString(),
    months: Math.max(0, months).toString(),
  };
}
