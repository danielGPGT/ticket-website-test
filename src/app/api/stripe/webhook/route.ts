import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
	const signature = (await headers()).get("stripe-signature");
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!signature || !webhookSecret) return new Response("Missing webhook config", { status: 400 });
	const stripe = getStripe();
	const rawBody = await req.text();
	let event;
	try {
		event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
	} catch (err: any) {
		return new Response(`Webhook Error: ${err.message}`, { status: 400 });
	}
	// Update order status
	const supabase = getSupabaseAdmin();
	if (event.type === "payment_intent.succeeded") {
		const pi = event.data.object as { id: string };
		await (supabase.from("orders") as any).update({ status: "paid", updated_at: new Date().toISOString() }).eq("stripe_payment_intent_id", pi.id);
	}
	if (event.type === "payment_intent.payment_failed") {
		const pi = event.data.object as { id: string };
		await (supabase.from("orders") as any).update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("stripe_payment_intent_id", pi.id);
	}
	return new Response("ok", { status: 200 });
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";


