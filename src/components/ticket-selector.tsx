"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";

type Props = {
	groupKey: string;
	eventId: string;
	eventName: string;
	categoryName: string;
	ticketType: string;
	minPrice: number;
	stock: number;
	anyTicketId: string; // representative ticket id from the group
};

export function TicketSelector({ groupKey, eventId, eventName, categoryName, ticketType, minPrice, stock, anyTicketId }: Props) {
	const [qty, setQty] = useState(1);
	const addItem = useCartStore((s) => s.addItem);

	function addToCart() {
		if (qty < 1) return;
		addItem({
			id: `${groupKey}-${minPrice}`,
			xs2_ticket_id: anyTicketId,
			xs2_event_id: eventId,
			event_name: eventName,
			category_name: categoryName,
			ticket_type: ticketType,
			price: minPrice,
			quantity: qty,
		});
	}

	return (
		<div className="flex items-center gap-3">
			<select
				className="rounded border bg-transparent px-2 py-1"
				value={qty}
				onChange={(e) => setQty(Math.min(Number(e.target.value), stock))}
			>
				{Array.from({ length: Math.min(10, Math.max(1, stock)) }).map((_, i) => (
					<option key={i + 1} value={i + 1}>
						{i + 1}
					</option>
				))}
			</select>
			<Button size="sm" onClick={addToCart} disabled={stock <= 0}>
				Add to Cart
			</Button>
		</div>
	);
}


