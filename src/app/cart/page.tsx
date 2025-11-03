"use client";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
	const items = useCartStore((s) => s.items);
	const total = useCartStore((s) => s.getTotalPrice());
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-semibold mb-4">Your Cart</h1>
			{items.length === 0 ? (
				<p className="text-sm text-muted-foreground">Your cart is empty.</p>
			) : (
				<div className="space-y-2">
					{items.map((i) => (
						<div key={i.id} className="flex items-center justify-between rounded border p-3">
							<div>
								<div className="font-medium">{i.event_name}</div>
								<div className="text-sm text-muted-foreground">{i.category_name} • {i.ticket_type}</div>
							</div>
							<div className="text-sm">x{i.quantity} • ${(i.price * i.quantity).toFixed(2)}</div>
						</div>
					))}
					<div className="flex items-center justify-between border-t pt-3 mt-3">
						<div className="font-medium">Total</div>
						<div>${total.toFixed(2)}</div>
					</div>
					<a href="/checkout" className="inline-block rounded bg-white text-black px-4 py-2 mt-2">Checkout</a>
				</div>
			)}
		</div>
	);
}


