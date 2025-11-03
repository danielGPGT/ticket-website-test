import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { validateStock } from "@/lib/xs2-api";

export async function POST(req: NextRequest) {
	const body = await req.json();
	const {
		amount,
		currency = "EUR",
		metadata = {},
		order,
	} = body as {
		amount: number;
		currency?: string;
		metadata?: Record<string, string>;
		order: {
			customer_email: string;
			customer_name: string;
			xs2_event_id: string;
			xs2_event_name: string;
			xs2_ticket_ids: string[];
			quantity: number;
			total_amount: number;
		};
	};

	if (!amount || !order) return Response.json({ error: "amount and order required" }, { status: 400 });

	// Validate stock with XS2 before creating PaymentIntent
	const ok = await validateStock(order.xs2_ticket_ids);
	if (!ok) return Response.json({ error: "One or more tickets are unavailable" }, { status: 409 });

	const stripe = getStripe();
	const pi = await stripe.paymentIntents.create({ amount, currency, metadata: { ...metadata, xs2_event_id: order.xs2_event_id } });

	// Create pending order in Supabase referencing the PaymentIntent
	const supabase = getSupabaseAdmin();
	const { data, error } = await supabase
		.from("orders")
		.insert({
			customer_email: order.customer_email,
			customer_name: order.customer_name,
			xs2_event_id: order.xs2_event_id,
			xs2_event_name: order.xs2_event_name,
			xs2_ticket_ids: order.xs2_ticket_ids,
			quantity: order.quantity,
			total_amount: order.total_amount,
			currency,
			stripe_payment_intent_id: pi.id,
			status: "pending",
		} as any)
		.select()
		.single();
	if (error) return Response.json({ error: error.message }, { status: 400 });

	return Response.json({ client_secret: pi.client_secret, order_id: data.id });
}


