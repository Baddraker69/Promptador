import { NextResponse } from "next/server";
import { getStripe, STRIPE_PRICE_ID } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id;
  const stripe = getStripe();

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email || user.email || undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
