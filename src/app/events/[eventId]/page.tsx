import { groupTickets, formatTicketType } from "@/lib/xs2-api";
import { TicketGroupRow } from "@/components/ticket-group-row";

async function fetchTickets(eventId: string) {
	const qs = new URLSearchParams({
		event_id: eventId,
		ticket_status: "available",
		stock: "gt:0",
		page_size: "500",
	});
	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/tickets?${qs.toString()}`, { cache: "no-store" });
	if (!res.ok) {
		console.error("[tickets] fetch failed", res.status, res.statusText);
		return [];
	}
	const data = await res.json();
	const rawTickets = data.tickets ?? data.results ?? data.items ?? [];
	const filtered = rawTickets.filter((t: any) => {
		return String(t.ticket_status ?? t.status ?? "").toLowerCase() === "available" && Number(t.stock ?? t.quantity ?? 0) > 0;
	});
	console.log("[tickets] eventId=", eventId, "status=", res.status, "rawCount=", rawTickets.length, "filteredCount=", filtered.length);
	if (filtered[0]) console.log("[tickets:first]", filtered[0]);
	return filtered;
}

async function fetchEvent(eventId: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/events?event_id=${encodeURIComponent(eventId)}`, { cache: "no-store" });
	if (!res.ok) return null;
	const data = await res.json();
	const items = data.results ?? data.items ?? [];
	if (items[0]) console.log("[event]", items[0]);
	return items[0] ?? null;
}

async function fetchCategories(eventId: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/categories?event_id=${encodeURIComponent(eventId)}`, { cache: "no-store" });
	if (!res.ok) return [];
	const data = await res.json();
	console.log("[categories] eventId=", eventId, "count=", (data.categories ?? data.results ?? data.items ?? []).length);
	if (Array.isArray(data.categories) && data.categories[0]) console.log("[categories:first]", data.categories[0]);
	return data.categories ?? data.results ?? data.items ?? [];
}

export default async function EventDetail(props: { params: { eventId: string } | Promise<{ eventId: string }> }) {
    const maybePromise = props.params as any;
    const { eventId } = (maybePromise && typeof maybePromise.then === "function") ? await maybePromise : maybePromise;
	const [event, tickets, categories] = await Promise.all([
		fetchEvent(eventId),
		fetchTickets(eventId),
		fetchCategories(eventId),
	]);
    type CategoryMeta = { name: string; partySizeTogether?: number | null; categoryType?: string; descriptionEN?: string };
    const categoryIdToMeta = new Map<string, CategoryMeta>(
        categories.map((c: any) => [
            String(c.category_id ?? c.id),
            {
                name: String(c.category_name ?? c.official_name ?? c.name ?? c.slug ?? "Category"),
                partySizeTogether: c.party_size_together ?? null,
                categoryType: c.category_type ?? undefined,
                descriptionEN: typeof c.description === "object" ? (c.description.en_GB ?? c.description.en ?? undefined) : undefined,
            },
        ])
    );
	const groups = groupTickets(
		tickets.map((t: any) => {
			const ticketId = String(t.ticket_id ?? t.id ?? "");
			const eventIdVal = String(t.event_id ?? eventId);
			const categoryId = String(t.category_id ?? t.category?.id ?? "unknown");
			const subCategory = String(t.sub_category ?? t.subCategory ?? "regular");

			let priceEur = 0;
			const currency = String(t.currency_code ?? t.currency ?? "EUR").toUpperCase();

			// Prefer EUR-converted rates from local_rates if available
			if (t.local_rates?.net_rate_eur) {
				priceEur = Number(t.local_rates.net_rate_eur) / 100;
			} else if (t.local_rates?.face_value_eur) {
				priceEur = Number(t.local_rates.face_value_eur) / 100;
			} else {
				// Fallback to net_rate or face_value, convert from smallest currency unit
				const rawPrice = Number(t.net_rate ?? t.face_value ?? t.sales_price ?? t.price ?? t.amount ?? 0);
				// XS2 prices are in smallest currency unit (cents/pence), always divide by 100
				priceEur = rawPrice / 100;
			}

			const stock = Number(t.stock ?? t.quantity ?? 0);

			console.log("[ticket:map]", { ticketId, categoryId, subCategory, priceEur, stock, currency, net_rate: t.net_rate, face_value: t.face_value, local_rates: t.local_rates });

			return {
				id: ticketId,
				event_id: eventIdVal,
				category_id: categoryId,
				sub_category: subCategory,
				price: priceEur,
				stock,
			};
		})
	);

	console.log("[groups] total=", groups.length, "summary:", groups.map((g) => ({ category: categoryIdToMeta.get(g.category_id)?.name ?? g.category_id, type: formatTicketType(g.sub_category), price: `€${g.min_price.toFixed(2)}`, stock: g.total_stock })));

	// Group by category for UI sections
	const categoryIdToGroups = new Map<string, typeof groups>();
	for (const g of groups) {
		const meta = categoryIdToMeta.get(g.category_id);
		const categoryName = meta?.name?.trim();
		if (!categoryName || categoryName.toLowerCase() === "category") continue; // hide unnamed categories
		const arr = categoryIdToGroups.get(g.category_id) ?? [] as any;
		arr.push(g);
		categoryIdToGroups.set(g.category_id, arr);
	}
	// Sort groups inside each category by typical race days order
	const weight = (sub: string) => {
		const s = sub.toLowerCase();
		if (s.includes("fri")) return 1;
		if (s.includes("sat")) return 2;
		if (s.includes("sun")) return 3;
		if (s.includes("weekend")) return 4;
		return 9;
	};
	for (const [cid, arr] of categoryIdToGroups) {
		arr.sort((a: any, b: any) => weight(a.sub_category) - weight(b.sub_category) || a.min_price - b.min_price);
	}

	return (
		<div className="container mx-auto px-4 py-8 space-y-6">
			<h1 className="text-3xl font-semibold">{event?.name ?? "Event"}</h1>
			<div className="space-y-6">
				{Array.from(categoryIdToGroups.entries()).map(([categoryId, arr]) => {
					const meta = categoryIdToMeta.get(categoryId);
					const displayName = meta?.name?.trim();
					if (!displayName) return null;
					return (
						<div key={categoryId} className="rounded-xl border">
							<div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
								<div className="font-semibold">{displayName}</div>
								{meta?.partySizeTogether ? (
									<div className="text-xs text-muted-foreground">seats together up to {meta.partySizeTogether}</div>
								) : null}
							</div>
							<div className="p-4 space-y-3">
								{arr.map((g: any) => (
									<TicketGroupRow
										key={`${g.event_id}-${g.category_id}-${g.sub_category}`}
										groupKey={`${g.event_id}-${g.category_id}-${g.sub_category}`}
										eventId={String(event?.id ?? g.event_id)}
										eventName={String(event?.name ?? event?.event_name ?? "Event")}
										categoryName={String(displayName)}
										ticketType={formatTicketType(g.sub_category)}
										minPrice={g.min_price}
										stock={g.total_stock}
										anyTicketId={g.tickets[0]?.id ?? `${g.event_id}-${g.category_id}`}
										metaNote={meta?.partySizeTogether ? `seats together up to ${meta.partySizeTogether}` : undefined}
									/>
								))}
							</div>
						</div>
					);
				})}
				{groups.length === 0 && (
					<div className="text-sm text-muted-foreground">No tickets available.</div>
				)}
			</div>
		</div>
	);
}


