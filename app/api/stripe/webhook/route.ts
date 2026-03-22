import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const getCustomerId = (obj: Stripe.Subscription | Stripe.Invoice | null) => {
    if (!obj) return null;
    return typeof obj.customer === "string" ? obj.customer : obj.customer?.id ?? null;
  };

  const updateSubscription = async (customerId: string, status: string, subscriptionId?: string) => {
    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: status,
        subscription_id: subscriptionId || null,
      })
      .eq("stripe_customer_id", customerId);
  };

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = getCustomerId(sub);
      if (customerId) {
        await updateSubscription(customerId, sub.status === "active" ? "active" : sub.status, sub.id);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = getCustomerId(sub);
      if (customerId) await updateSubscription(customerId, "canceled");
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = getCustomerId(invoice);
      if (customerId) await updateSubscription(customerId, "past_due");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
