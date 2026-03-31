export type UserRole = "admin" | "sub_office";
export type ReportStatus = "draft" | "submitted" | "invoiced" | "paid" | "overdue";
export type FeeType = "royalty" | "advertising";
export type OfficeStatus = "active" | "non_reporting" | "terminated" | "corporate";

export interface Office {
  id: string;
  name: string;
  office_number: string;
  address: string | null;
  phone: string | null;
  email: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  fax: string | null;
  stripe_customer_id: string | null;
  is_active: boolean;
  royalty_percentage: number;
  advertising_percentage: number;
  status: OfficeStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  office_id: string | null;
  role: UserRole;
  full_name: string;
  contact_first_name: string | null;
  contact_last_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeConfiguration {
  id: string;
  fee_type: FeeType;
  percentage: number;
  effective_from: string;
  effective_to: string | null;
  set_by: string;
}

export interface MonthlyReport {
  id: string;
  office_id: string;
  report_month: string;
  tax_preparation_fees: number;
  bookkeeping_fees: number;
  insurance_commissions: number;
  notary_copy_fax_fees: number;
  translation_document_fees: number;
  other_service_fees: number;
  total_gross: number;
  royalty_percentage: number | null;
  advertising_percentage: number | null;
  royalty_fee: number;
  advertising_fee: number;
  total_fees_due: number;
  is_processed: boolean;
  status: ReportStatus;
  submitted_at: string | null;
  submitted_by: string | null;
  edited_by: string | null;
  edited_at: string | null;
  stripe_invoice_id: string | null;
  stripe_invoice_url: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeeRateHistory {
  id: string;
  office_id: string;
  fee_type: FeeType;
  percentage: number;
  start_month: string;
  end_month: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, unknown>;
  created_at: string;
  profile?: { full_name: string };
}

export interface OfficeWithReport extends Office {
  currentReport: MonthlyReport | null;
}

export interface DashboardStats {
  submissionRate: number;
  totalGrossRevenue: number;
  revenueChange: number;
  feesCollected: number;
  feesOutstanding: number;
  overdueReports: number;
  activeOffices: number;
  daysUntilDeadline: number;
}
