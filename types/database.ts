export type UserRole = "admin" | "vet" | "groomer" | "receptionist" | "client";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  primary_color?: string | null;
  created_at: string;
}

export interface Profile {
  id: string; // Corresponde ao auth.users.id do Supabase
  tenant_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  notes?: string | null;
  created_at: string;
}

export interface Pet {
  id: string;
  tenant_id: string;
  client_id: string;
  name: string;
  species: "dog" | "cat" | "other";
  breed: string;
  weight?: number | null;
  coat?: string | null;
  color?: string | null;
  birth_date?: string | null;
  avatar_url?: string | null;
  medical_conditions?: string | null;
  created_at: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  category: "bath" | "grooming" | "vet" | "package" | "other";
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  client_id: string;
  pet_id: string;
  service_id: string;
  scheduled_at: string;
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled";
  notes?: string | null;
  created_at: string;
}

export interface Operation {
  id: string;
  tenant_id: string;
  appointment_id: string;
  status: "waiting" | "bathing" | "grooming" | "finished" | "delivering";
  assigned_to?: string | null;
  notes?: string | null;
  updated_at: string;
}

export interface PackageSubscription {
  id: string;
  tenant_id: string;
  client_id: string;
  pet_id: string;
  name: string;
  total_credits: number;
  used_credits: number;
  price: number;
  expires_at: string;
  status: "active" | "completed" | "expired";
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  tenant_id: string;
  pet_id: string;
  vet_id: string;
  diagnosis: string;
  treatment?: string | null;
  prescriptions?: string | null;
  weight_kg?: number | null;
  created_at: string;
}

export interface VaccineRecord {
  id: string;
  tenant_id: string;
  pet_id: string;
  vaccine_name: string;
  applied_at: string;
  next_due_at: string;
  notes?: string | null;
}

export interface PdvSale {
  id: string;
  tenant_id: string;
  client_id?: string | null;
  total_amount: number;
  payment_method: "pix" | "credit_card" | "debit_card" | "cash";
  items_summary: string;
  created_at: string;
}

export interface WhatsappAutomation {
  id: string;
  tenant_id: string;
  type: "reminder_24h" | "pet_birthday" | "daily_summary" | "pet_ready";
  enabled: boolean;
  template_message: string;
}

