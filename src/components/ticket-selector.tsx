"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCartStore } from "@/store/cart-store";
import { ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
	const [added, setAdded] = useState(false);
	const addItem = useCartStore((s) => s.addItem);

	const maxQty = Math.min(10, Math.max(1, stock));
	const qtyOptions = Array.from({ length: maxQty }, (_, i) => i + 1);

	function addToCart() {
		if (qty < 1 || stock <= 0) return;
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
		setAdded(true);
		setTimeout(() => setAdded(false), 2000);
	}

	return (
		<div className="flex items-center gap-3">
			<Select
				value={String(qty)}
				onValueChange={(value) => setQty(Math.min(Number(value), stock))}
				disabled={stock <= 0}
			>
				<SelectTrigger className="w-20">
					<SelectValue placeholder="Qty" />
				</SelectTrigger>
				<SelectContent>
					{qtyOptions.map((num) => (
						<SelectItem key={num} value={String(num)}>
							{num}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Button
				size="sm"
				onClick={addToCart}
				disabled={stock <= 0 || qty < 1}
				className={cn(
					"min-w-[120px] transition-all",
					added && "bg-success text-success-foreground hover:bg-success/90"
				)}
				style={added ? {
					backgroundColor: 'var(--success)',
					color: 'var(--success-foreground)'
				} : undefined}
			>
				{added ? (
					<>
						<Check className="w-4 h-4" />
						Added!
					</>
				) : (
					<>
						<ShoppingCart className="w-4 h-4" />
						Add to Cart
					</>
				)}
			</Button>
		</div>
	);
}


