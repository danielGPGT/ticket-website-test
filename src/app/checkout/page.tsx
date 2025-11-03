"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCartStore } from "@/store/cart-store";

const Schema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
});

export default function CheckoutPage() {
	const form = useForm<{ name: string; email: string }>({ resolver: zodResolver(Schema), defaultValues: { name: "", email: "" } });
	const items = useCartStore((s) => s.items);
	const total = useCartStore((s) => s.getTotalPrice());

	async function onSubmit(values: { name: string; email: string }) {
		const res = await fetch("/api/stripe/checkout", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				amount: Math.round(total * 100),
				currency: "EUR",
				metadata: { email: values.email, name: values.name },
				order: {
					customer_email: values.email,
					customer_name: values.name,
					xs2_event_id: items[0]?.xs2_event_id ?? "",
					xs2_event_name: items[0]?.event_name ?? "",
					xs2_ticket_ids: items.map((i) => i.xs2_ticket_id),
					quantity: items.reduce((s, i) => s + i.quantity, 0),
					total_amount: Number(total.toFixed(2)),
				},
			}),
		});
		const data = await res.json();
		if (data?.client_secret) {
			// Placeholder: integrate Stripe Elements later
			alert("Payment intent created. Implement Stripe Elements next.");
		}
	}

	return (
		<div className="container mx-auto px-4 py-8 max-w-xl">
			<h1 className="text-2xl font-semibold mb-4">Checkout</h1>
			<form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
				<input className="w-full rounded border px-3 py-2 bg-transparent" placeholder="Full name" {...form.register("name")} />
				<input className="w-full rounded border px-3 py-2 bg-transparent" placeholder="Email" type="email" {...form.register("email")} />
				<div className="flex items-center justify-between pt-2">
					<div className="font-medium">Total</div>
					<div>${total.toFixed(2)}</div>
				</div>
				<button type="submit" className="w-full rounded bg-white text-black px-4 py-2">Pay</button>
			</form>
		</div>
	);
}


