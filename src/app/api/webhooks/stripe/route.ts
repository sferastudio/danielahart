import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const reportId = invoice.metadata?.report_id;
      if (reportId) {
        await supabase
          .from("monthly_reports")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
          })
          .eq("id", reportId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const reportId = invoice.metadata?.report_id;
      if (reportId) {
        await supabase
          .from("monthly_reports")
          .update({ status: "overdue" })
          .eq("id", reportId);
      }
      break;
    }

    case "invoice.finalized": {
      const invoice = event.data.object as Stripe.Invoice;
      const reportId = invoice.metadata?.report_id;
      if (reportId) {
        await supabase
          .from("monthly_reports")
          .update({
            status: "invoiced",
            stripe_invoice_id: invoice.id,
            stripe_invoice_url: invoice.hosted_invoice_url,
          })
          .eq("id", reportId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
