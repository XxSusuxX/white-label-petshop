// ==============================================================================
// TIPOS DO BANCO — alinhados com supabase/schema.sql + supabase/migration_phase*.sql
// (esquema REAL do Supabase). Use com: createClient<Database>() (lib/supabase/*).
// ==============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// -----------------------------------------------------------------------------
// Enums usados pelo código (PT-BR e EN convivem; ver migration_phase15)
// -----------------------------------------------------------------------------
export type UserRole =
  | "client"
  | "tutor"
  | "admin"
  | "dono"
  | "vet"
  | "veterinarian"
  | "veterinario"
  | "groomer"
  | "bather"
  | "banhista_tosador"
  | "receptionist"
  | "recepcionista"
  | "delivery"
  | "entregador"
  | "employee"
  | "funcionario"
  | "auxiliar";

export type AppointmentStatus =
  | "agendado"
  | "confirmado"
  | "em_atendimento"
  | "pronto"
  | "em_rota"
  | "concluido"
  | "cancelado"
  | "bloqueio";

export type NotificationType =
  | "agendamento_criado"
  | "agendamento_confirmado"
  | "agendamento_alterado"
  | "agendamento_cancelado"
  | "lembrete"
  | "mensagem";

export type PackageStatus = "ativo" | "expirado" | "cancelado" | "finalizado";
export type RecurringBookingStatus = "ativo" | "pausado" | "cancelado";
export type CashSessionStatus = "aberto" | "fechado";
export type ServiceCategory = "service" | "product" | "package";
export type LeadStatus = "novo" | "contato_feito" | "agendamento_marcado" | "convertido" | "perdido";
export type WhatsappProvider = "none" | "evolution" | "official" | "twilio" | "uazapi";

// -----------------------------------------------------------------------------
// Helpers de tabela (Row/Insert/Update)
// -----------------------------------------------------------------------------
type Row<T> = { [K in keyof T]: T[K] };
type Insert<T, K extends keyof T = never> = { [P in keyof Omit<T, K>]?: T[P] | null } & { [P in K]: T[P] };
type Update<T, K extends keyof T = never> = { [P in keyof Omit<T, K>]?: T[P] | null };

// -----------------------------------------------------------------------------
// Tabelas
// -----------------------------------------------------------------------------
export interface PetShopsRow {
  id: string;
  name: string;
  owner_id: string | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
}
export type PetShopsInsert = Insert<PetShopsRow, "name">;
export type PetShopsUpdate = Update<PetShopsRow>;

export interface ProfilesRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  role: string;
  avatar_url: string | null;
  pet_shop_id: string;
  last_winback_sent_at: string | null;
  created_at: string;
  updated_at: string;
}
export type ProfilesInsert = Insert<ProfilesRow, "id">;
export type ProfilesUpdate = Update<ProfilesRow>;

export interface PetsRow {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: string | null;
  birth_date: string | null;
  weight: number | null;
  microchip: string | null;
  coat: string | null;
  color: string | null;
  is_neutered: boolean;
  allergies: string | null;
  medications: string | null;
  diseases: string | null;
  observations: string | null;
  photo_url: string | null;
  current_status: string;
  client_id: string;
  pet_shop_id: string;
  last_birthday_greeted_year: number | null;
  created_at: string;
  updated_at: string;
}
export type PetsInsert = Insert<PetsRow, "name" | "client_id" | "pet_shop_id">;
export type PetsUpdate = Update<PetsRow>;

export interface ServicesRow {
  id: string;
  pet_shop_id: string;
  name: string;
  description: string | null;
  category: ServiceCategory;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  stock_quantity: number | null;
  package_credits: number | null;
  package_validity_days: number | null;
  created_at: string;
  updated_at: string;
}
export type ServicesInsert = Insert<ServicesRow, "name" | "pet_shop_id">;
export type ServicesUpdate = Update<ServicesRow>;

export interface ServiceHistoryRow {
  id: string;
  pet_id: string;
  service_type: string;
  service_date: string | null;
  notes: string | null;
  employee_id: string | null;
  pet_shop_id: string;
  created_at: string;
  updated_at: string;
}
export type ServiceHistoryInsert = Insert<ServiceHistoryRow, "pet_id" | "pet_shop_id">;
export type ServiceHistoryUpdate = Update<ServiceHistoryRow>;

export interface AppointmentsRow {
  id: string;
  pet_shop_id: string;
  pet_id: string;
  service_id: string | null;
  service_type: string;
  professional: string;
  scheduled_at: string;
  status: AppointmentStatus;
  price: number;
  notes: string;
  address: string;
  paid_via_package_id: string | null;
  reminder_sent_at: string | null;
  recurring_booking_id: string | null;
  created_at: string;
  updated_at: string;
}
export type AppointmentsInsert = Insert<AppointmentsRow, "pet_shop_id" | "pet_id" | "scheduled_at">;
export type AppointmentsUpdate = Update<AppointmentsRow>;

export interface LeadsRow {
  id: string;
  pet_shop_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  status: LeadStatus;
  pet_name: string | null;
  pet_species: string | null;
  notes: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}
export type LeadsInsert = Insert<LeadsRow, "name" | "pet_shop_id">;
export type LeadsUpdate = Update<LeadsRow>;

export interface SalesRow {
  id: string;
  pet_shop_id: string;
  client_id: string | null;
  payment_method: string;
  subtotal: number;
  discount: number;
  total: number;
  created_at: string;
}
export type SalesInsert = Insert<SalesRow, "pet_shop_id">;
export type SalesUpdate = Update<SalesRow>;

export interface SaleItemsRow {
  id: string;
  sale_id: string;
  service_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}
export type SaleItemsInsert = Insert<SaleItemsRow, "sale_id" | "name">;
export type SaleItemsUpdate = Update<SaleItemsRow>;

export interface MedicalRecordsRow {
  id: string;
  pet_shop_id: string;
  pet_id: string;
  vet_name: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  created_at: string;
}
export type MedicalRecordsInsert = Insert<MedicalRecordsRow, "pet_shop_id" | "pet_id">;
export type MedicalRecordsUpdate = Update<MedicalRecordsRow>;

export interface VaccineRecordsRow {
  id: string;
  pet_shop_id: string;
  pet_id: string;
  vaccine_name: string;
  applied_at: string | null;
  next_due_at: string | null;
  created_at: string;
}
export type VaccineRecordsInsert = Insert<VaccineRecordsRow, "pet_shop_id" | "pet_id" | "vaccine_name">;
export type VaccineRecordsUpdate = Update<VaccineRecordsRow>;

export interface WeightLogsRow {
  id: string;
  pet_id: string;
  weight: number;
  recorded_at: string;
}
export type WeightLogsInsert = Insert<WeightLogsRow, "pet_id" | "weight">;
export type WeightLogsUpdate = Update<WeightLogsRow>;

export interface AutomationRulesRow {
  id: string;
  pet_shop_id: string;
  rule_key: string;
  title: string;
  category: string;
  enabled: boolean;
  message_template: string;
  created_at: string;
  updated_at: string;
}
export type AutomationRulesInsert = Insert<AutomationRulesRow, "pet_shop_id" | "rule_key" | "title">;
export type AutomationRulesUpdate = Update<AutomationRulesRow>;

export interface NotificationsRow {
  id: string;
  pet_shop_id: string;
  client_id: string;
  appointment_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}
export type NotificationsInsert = Insert<NotificationsRow, "pet_shop_id" | "client_id" | "title">;
export type NotificationsUpdate = Update<NotificationsRow>;

export interface CashSessionsRow {
  id: string;
  pet_shop_id: string;
  opened_by: string | null;
  opened_by_name: string;
  opened_at: string;
  opening_amount: number;
  closed_by: string | null;
  closed_by_name: string;
  closed_at: string | null;
  expected_amount: number | null;
  counted_amount: number | null;
  difference_amount: number | null;
  status: CashSessionStatus;
  notes: string;
}
export type CashSessionsInsert = Insert<CashSessionsRow, "pet_shop_id">;
export type CashSessionsUpdate = Update<CashSessionsRow>;

export interface CashMovementsRow {
  id: string;
  cash_session_id: string;
  type: "entrada" | "saida";
  payment_method: string;
  amount: number;
  description: string;
  sale_id: string | null;
  created_by: string | null;
  created_at: string;
}
export type CashMovementsInsert = Insert<CashMovementsRow, "cash_session_id" | "type" | "amount">;
export type CashMovementsUpdate = Update<CashMovementsRow>;

export interface WhatsappConfigRow {
  id: string;
  pet_shop_id: string;
  provider: WhatsappProvider;
  is_connected: boolean;
  connected_number: string;
  last_checked_at: string | null;
  last_error: string;
  evolution_api_url: string | null;
  evolution_api_key: string | null;
  evolution_instance_name: string;
  official_phone_number_id: string;
  official_waba_id: string;
  official_access_token: string | null;
  twilio_account_sid: string;
  twilio_auth_token: string | null;
  twilio_whatsapp_number: string;
  uazapi_api_url: string | null;
  uazapi_token: string | null;
  admin_notify_phone: string | null;
  resumo_diario_last_sent_date: string | null;
  created_at: string;
  updated_at: string;
}
export type WhatsappConfigInsert = Insert<WhatsappConfigRow, "pet_shop_id">;
export type WhatsappConfigUpdate = Update<WhatsappConfigRow>;

export interface ClientPackagesRow {
  id: string;
  pet_shop_id: string;
  client_id: string;
  service_id: string | null;
  package_name: string;
  total_credits: number;
  used_credits: number;
  price_paid: number;
  purchased_at: string;
  expires_at: string | null;
  status: PackageStatus;
  sale_id: string | null;
  low_credit_notified_at: string | null;
}
export type ClientPackagesInsert = Insert<ClientPackagesRow, "pet_shop_id" | "client_id" | "package_name">;
export type ClientPackagesUpdate = Update<ClientPackagesRow>;

export interface RecurringBookingsRow {
  id: string;
  pet_shop_id: string;
  pet_id: string;
  service_id: string | null;
  service_type: string;
  professional: string;
  price: number;
  address: string;
  interval_days: number;
  status: RecurringBookingStatus;
  created_at: string;
  updated_at: string;
}
export type RecurringBookingsInsert = Insert<RecurringBookingsRow, "pet_shop_id" | "pet_id" | "service_type">;
export type RecurringBookingsUpdate = Update<RecurringBookingsRow>;

export interface BusinessHoursRow {
  id: string;
  pet_shop_id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
  slot_interval_minutes: number;
  created_at: string;
  updated_at: string;
}
export type BusinessHoursInsert = Insert<BusinessHoursRow, "pet_shop_id" | "day_of_week">;
export type BusinessHoursUpdate = Update<BusinessHoursRow>;

export interface BlockedDatesRow {
  id: string;
  pet_shop_id: string;
  blocked_date: string;
  reason: string;
  created_at: string;
}
export type BlockedDatesInsert = Insert<BlockedDatesRow, "pet_shop_id" | "blocked_date">;
export type BlockedDatesUpdate = Update<BlockedDatesRow>;

export interface FinancialExpensesRow {
  id: string;
  pet_shop_id: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string;
  created_at: string;
}
export type FinancialExpensesInsert = Insert<FinancialExpensesRow, "pet_shop_id" | "description" | "amount">;
export type FinancialExpensesUpdate = Update<FinancialExpensesRow>;

export interface StaffSchedulesRow {
  id: string;
  pet_shop_id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export type StaffSchedulesInsert = Insert<StaffSchedulesRow, "pet_shop_id" | "staff_id" | "day_of_week">;
export type StaffSchedulesUpdate = Update<StaffSchedulesRow>;

// -----------------------------------------------------------------------------
// Funções (RPCs)
// -----------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      pet_shops: { Row: PetShopsRow; Insert: PetShopsInsert; Update: PetShopsUpdate };
      profiles: { Row: ProfilesRow; Insert: ProfilesInsert; Update: ProfilesUpdate };
      pets: { Row: PetsRow; Insert: PetsInsert; Update: PetsUpdate };
      services: { Row: ServicesRow; Insert: ServicesInsert; Update: ServicesUpdate };
      service_history: { Row: ServiceHistoryRow; Insert: ServiceHistoryInsert; Update: ServiceHistoryUpdate };
      appointments: { Row: AppointmentsRow; Insert: AppointmentsInsert; Update: AppointmentsUpdate };
      leads: { Row: LeadsRow; Insert: LeadsInsert; Update: LeadsUpdate };
      sales: { Row: SalesRow; Insert: SalesInsert; Update: SalesUpdate };
      sale_items: { Row: SaleItemsRow; Insert: SaleItemsInsert; Update: SaleItemsUpdate };
      medical_records: { Row: MedicalRecordsRow; Insert: MedicalRecordsInsert; Update: MedicalRecordsUpdate };
      vaccine_records: { Row: VaccineRecordsRow; Insert: VaccineRecordsInsert; Update: VaccineRecordsUpdate };
      weight_logs: { Row: WeightLogsRow; Insert: WeightLogsInsert; Update: WeightLogsUpdate };
      automation_rules: { Row: AutomationRulesRow; Insert: AutomationRulesInsert; Update: AutomationRulesUpdate };
      notifications: { Row: NotificationsRow; Insert: NotificationsInsert; Update: NotificationsUpdate };
      cash_sessions: { Row: CashSessionsRow; Insert: CashSessionsInsert; Update: CashSessionsUpdate };
      cash_movements: { Row: CashMovementsRow; Insert: CashMovementsInsert; Update: CashMovementsUpdate };
      whatsapp_config: { Row: WhatsappConfigRow; Insert: WhatsappConfigInsert; Update: WhatsappConfigUpdate };
      client_packages: { Row: ClientPackagesRow; Insert: ClientPackagesInsert; Update: ClientPackagesUpdate };
      recurring_bookings: { Row: RecurringBookingsRow; Insert: RecurringBookingsInsert; Update: RecurringBookingsUpdate };
      business_hours: { Row: BusinessHoursRow; Insert: BusinessHoursInsert; Update: BusinessHoursUpdate };
      blocked_dates: { Row: BlockedDatesRow; Insert: BlockedDatesInsert; Update: BlockedDatesUpdate };
      financial_expenses: { Row: FinancialExpensesRow; Insert: FinancialExpensesInsert; Update: FinancialExpensesUpdate };
      staff_schedules: { Row: StaffSchedulesRow; Insert: StaffSchedulesInsert; Update: StaffSchedulesUpdate };
    };
    Functions: {
      use_package_credit: {
        Args: { package_id: string };
        Returns: boolean;
      };
      refund_package_credit: {
        Args: { package_id: string };
        Returns: boolean;
      };
      book_appointment: {
        Args: {
          p_pet_id: string;
          p_pet_shop_id: string;
          p_service_id: string;
          p_service_type: string;
          p_scheduled_at: string;
          p_professional: string;
          p_price: number;
          p_notes?: string;
          p_address?: string;
          p_package_id?: string | null;
          p_recurring_booking_id?: string | null;
          p_exclude_appointment_id?: string | null;
          p_force?: boolean;
        };
        Returns: AppointmentsRow;
      };
    };
  };
}
