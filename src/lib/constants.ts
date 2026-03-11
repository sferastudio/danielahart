export const STYLES = {
  sectionHeader: "text-xs font-semibold uppercase tracking-widest text-muted-foreground",
  pageTitle: "text-2xl font-bold text-foreground",
  currencyDisplay: "text-3xl font-bold",
  cardPadding: "p-6",
} as const;

export const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export const PERCENTAGE_FORMATTER = (v: number) => `${(v * 100).toFixed(2)}%`;

export const REPORT_DEADLINE_DAY = 5;

export const REVENUE_FIELDS = [
  {
    name: "tax_preparation_fees" as const,
    label: "Tax Preparation Fees",
    description: "Personal & Business Filings",
  },
  {
    name: "bookkeeping_fees" as const,
    label: "Bookkeeping Fees",
    description: "Monthly accounting services",
  },
  {
    name: "insurance_commissions" as const,
    label: "Insurance Commissions",
    description: "Adjusted gross commissions",
  },
  {
    name: "notary_copy_fax_fees" as const,
    label: "Notary, Copy, Fax & Computer Fees",
    description: "Notary, Copy, Fax, Internet & Computer Usage",
  },
  {
    name: "translation_document_fees" as const,
    label: "Translation & Document Prep",
    description: "Translation and Document Prep Fees",
  },
  {
    name: "other_service_fees" as const,
    label: "Other Misc. Fees",
    description: "Misc platform services",
  },
] as const;

export type RevenueFieldName = (typeof REVENUE_FIELDS)[number]["name"];

export const FRANCHISEE_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  non_reporting: "Non-Reporting",
  terminated: "Terminated",
  corporate: "Corporate",
};
