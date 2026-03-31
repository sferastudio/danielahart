import { getStripe } from "./client";
import type { Office, MonthlyReport } from "@/lib/types";

export async function getOrCreateCustomer(office: Office) {
  if (office.stripe_customer_id) {
    return office.stripe_customer_id;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: office.name,
    email: office.email,
    metadata: {
      office_id: office.id,
      office_number: office.office_number,
    },
  });

  return customer.id;
}

export async function createAndSendInvoice(
  report: MonthlyReport,
  office: Office,
  customerId: string
) {
  const stripe = getStripe();
  const reportDate = new Date(report.report_month + "T00:00:00");
  const monthLabel = reportDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: "send_invoice",
    days_until_due: 15,
    metadata: {
      report_id: report.id,
      office_id: office.id,
      report_month: report.report_month,
    },
    payment_settings: {
      payment_method_types: ["card", "us_bank_account"],
    },
  });

  // Add royalty fee line item
  if (report.royalty_fee > 0) {
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      amount: Math.round(report.royalty_fee * 100),
      currency: "usd",
      description: `Royalty Fee — ${monthLabel} (${((report.royalty_percentage ?? 0) * 100).toFixed(2)}% of ${report.total_gross.toFixed(2)})`,
    });
  }

  // Add advertising fee line item
  if (report.advertising_fee > 0) {
    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      amount: Math.round(report.advertising_fee * 100),
      currency: "usd",
      description: `Advertising Fee — ${monthLabel} (${((report.advertising_percentage ?? 0) * 100).toFixed(2)}% of ${report.total_gross.toFixed(2)})`,
    });
  }

  // Finalize and send the invoice
  const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
  await stripe.invoices.sendInvoice(invoice.id);

  return {
    invoiceId: finalizedInvoice.id,
    invoiceUrl: finalizedInvoice.hosted_invoice_url,
  };
}

export async function voidInvoice(invoiceId: string) {
  const stripe = getStripe();
  await stripe.invoices.voidInvoice(invoiceId);
}
