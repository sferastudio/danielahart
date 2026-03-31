import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!serviceRoleKey) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is required. Set it in .env.local or as an environment variable."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Known name mismatches: CSV name (lowercased) → DB name (lowercased)
const NAME_ALIASES: Record<string, string> = {
  "liburn": "lilburn",
  "buford ga": "buford",
  "dats doraville isboset": "dats doraville",
  "winder ga - baneza hale": "winder",
  "woodstock-sandra bacciarini": "woodstock",
};

const CSV_FILES = [
  "AllFranchisees_MonthlySalesReport_112020_1212020.csv",
  "AllFranchisees_MonthlySalesReport_112021_1212021.csv",
  "AllFranchisees_MonthlySalesReport_112022_1212022 (1).csv",
  "AllFranchisees_MonthlySalesReport_112023_1212023.csv",
  "AllFranchisees_MonthlySalesReport_112024_1212024.csv",
  "AllFranchisees_MonthlySalesReport_112025_1212025.csv",
];

const MONTH_MAP: Record<string, string> = {
  january: "01", february: "02", march: "03", april: "04",
  may: "05", june: "06", july: "07", august: "08",
  september: "09", october: "10", november: "11", december: "12",
};

function parseCurrency(value: string): number {
  if (!value || value.trim() === "") return 0;
  return parseFloat(value.replace(/[$,]/g, "")) || 0;
}

function extractOfficeName(franchisee: string): string | null {
  // Skip Z-prefixed entries (terminated/non-reporting/corporate)
  const trimmed = franchisee.trim();
  if (/^Z[\s-]/i.test(trimmed)) return null;

  // Extract part before parenthetical
  const parenIdx = trimmed.indexOf("(");
  const name = (parenIdx > 0 ? trimmed.substring(0, parenIdx) : trimmed).trim();
  return name || null;
}

function resolveOfficeName(rawName: string): string {
  const lower = rawName.toLowerCase();
  return NAME_ALIASES[lower] ?? lower;
}

function parseMonthYear(dateValue: string): string | null {
  // e.g. "January 2020" → "2020-01-01"
  const parts = dateValue.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const monthNum = MONTH_MAP[parts[0].toLowerCase()];
  const year = parts[1];
  if (!monthNum || !year) return null;
  return `${year}-${monthNum}-01`;
}

// Parse a CSV line handling unquoted currency values with thousands separators
// e.g. "$3,531.00" appears as $3,531.00 (comma is NOT a delimiter here)
function parseCSVLine(line: string): string[] {
  // Split on commas naively, then re-merge currency fragments
  const raw = line.split(",");
  const fields: string[] = [];
  let i = 0;
  while (i < raw.length) {
    const part = raw[i];
    // Currency fragment starts with $ followed by digits only (no decimal yet)
    if (/^\$\d+$/.test(part.trim())) {
      // Merge with following parts until we complete the currency value (ends with .XX)
      let merged = part;
      while (i + 1 < raw.length && !/\.\d{2}$/.test(merged)) {
        i++;
        merged += "," + raw[i];
      }
      fields.push(merged);
    } else {
      fields.push(part);
    }
    i++;
  }
  return fields;
}

interface ReportRow {
  office_id: string;
  report_month: string;
  tax_preparation_fees: number;
  bookkeeping_fees: number;
  insurance_commissions: number;
  notary_copy_fax_fees: number;
  translation_document_fees: number;
  other_service_fees: number;
  status: string;
  is_processed: boolean;
}

async function main() {
  // Load all offices from DB
  const { data: offices, error: officesError } = await supabase
    .from("offices")
    .select("id, name");

  if (officesError || !offices) {
    console.error("Failed to load offices:", officesError);
    process.exit(1);
  }

  // Build lookup: lowercased name → office
  const officeLookup = new Map<string, { id: string; name: string }>();
  for (const office of offices) {
    officeLookup.set(office.name.toLowerCase(), office);
  }

  console.log(`Loaded ${offices.length} offices from database`);

  const csvDir = join(process.cwd(), "reference", "past records");
  const allRecords: ReportRow[] = [];
  const unmatchedNames = new Set<string>();
  let totalSkipped = 0;

  for (const fileName of CSV_FILES) {
    const filePath = join(csvDir, fileName);
    let content: string;
    try {
      content = readFileSync(filePath, "utf-8");
    } catch {
      console.error(`Could not read file: ${filePath}`);
      continue;
    }

    const lines = content.split("\n");
    let currentMonth: string | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const fields = parseCSVLine(trimmedLine);

      // Check for Date: row
      if (fields[0] === "Date:") {
        currentMonth = parseMonthYear(fields[1]);
        continue;
      }

      // Skip header rows
      if (fields[0] === "Franchisee") continue;

      if (!currentMonth) continue;

      // Extract office name
      const rawName = extractOfficeName(fields[0]);
      if (!rawName) {
        totalSkipped++;
        continue;
      }

      // Parse 6 revenue columns (indices 1-6)
      const taxPrep = parseCurrency(fields[1]);
      const bookkeeping = parseCurrency(fields[2]);
      const insurance = parseCurrency(fields[3]);
      const notary = parseCurrency(fields[4]);
      const translation = parseCurrency(fields[5]);
      const otherFees = parseCurrency(fields[6]);

      // Skip rows with no revenue data (only have percentages)
      const hasRevenue =
        taxPrep > 0 ||
        bookkeeping > 0 ||
        insurance > 0 ||
        notary > 0 ||
        translation > 0 ||
        otherFees > 0;

      if (!hasRevenue) {
        totalSkipped++;
        continue;
      }

      const resolvedName = resolveOfficeName(rawName);
      const office = officeLookup.get(resolvedName);

      if (!office) {
        unmatchedNames.add(rawName);
        continue;
      }

      allRecords.push({
        office_id: office.id,
        report_month: currentMonth,
        tax_preparation_fees: taxPrep,
        bookkeeping_fees: bookkeeping,
        insurance_commissions: insurance,
        notary_copy_fax_fees: notary,
        translation_document_fees: translation,
        other_service_fees: otherFees,
        status: "paid",
        is_processed: true,
      });
    }

    console.log(`Parsed ${fileName}`);
  }

  console.log(`\nTotal records to upsert: ${allRecords.length}`);
  console.log(`Total skipped (no revenue / Z-prefix): ${totalSkipped}`);

  if (unmatchedNames.size > 0) {
    console.log(`\nUnmatched franchisee names:`);
    for (const name of unmatchedNames) {
      console.log(`  - "${name}"`);
    }
  }

  // Upsert in batches of 50
  const BATCH_SIZE = 50;
  let upsertedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
    const batch = allRecords.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("monthly_reports")
      .upsert(batch, { onConflict: "office_id,report_month" });

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      errorCount += batch.length;
    } else {
      upsertedCount += batch.length;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Records upserted: ${upsertedCount}`);
  console.log(`Records with errors: ${errorCount}`);
  console.log(`Records skipped: ${totalSkipped}`);
  console.log(`Unmatched names: ${unmatchedNames.size}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
