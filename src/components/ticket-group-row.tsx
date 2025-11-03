"use client";
import { useState } from "react";
import { TicketSelector } from "@/components/ticket-selector";

type Props = {
	groupKey: string;
	eventId: string;
	eventName: string;
	categoryName: string;
	ticketType: string;
	minPrice: number;
	stock: number;
	anyTicketId: string;
	metaNote?: string;
};

export function TicketGroupRow({ groupKey, eventId, eventName, categoryName, ticketType, minPrice, stock, anyTicketId, metaNote }: Props) {
	const [open, setOpen] = useState(false);
	return (
		<div className="rounded-lg border p-4">
			<div className="flex items-center justify-between">
				<div className="font-medium">
					{categoryName} • {ticketType}
					{metaNote ? <span className="ml-2 text-xs text-muted-foreground">{metaNote}</span> : null}
					<span className="ml-2 text-sm text-muted-foreground">Stock: {stock}</span>
				</div>
				<div className="flex items-center gap-3">
					<div className="text-sm">From €{minPrice.toFixed(2)}</div>
					<button className="rounded bg-white text-black px-3 py-1 text-sm" onClick={() => setOpen((v) => !v)}>{open ? "Close" : "Select"}</button>
				</div>
			</div>
			{open && (
				<div className="mt-3 flex items-center justify-between">
					<div className="text-sm text-muted-foreground">Choose quantity</div>
					<TicketSelector
						groupKey={groupKey}
						eventId={eventId}
						eventName={eventName}
						categoryName={categoryName}
						ticketType={ticketType}
						minPrice={minPrice}
						stock={stock}
						anyTicketId={anyTicketId}
					/>
				</div>
			)}
		</div>
	);
}


