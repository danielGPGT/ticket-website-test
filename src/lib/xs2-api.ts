export type Ticket = {
	id: string;
	event_id: string;
	category_id: string;
	sub_category: string; // e.g. fri_regular, weekend_regular
	price: number;
	stock: number;
	status?: string;
};

export type TicketGroup = {
	event_id: string;
	category_id: string;
	sub_category: string;
	min_price: number;
	max_price: number;
	total_stock: number;
	tickets: Ticket[];
};

export function formatTicketType(subCategory: string): string {
	const raw = (subCategory || "").toLowerCase();
	// Common multi-day patterns
	const hasFri = /fri/.test(raw);
	const hasSat = /sat/.test(raw);
	const hasSun = /sun/.test(raw);
	if ((/weekend/.test(raw)) || (hasFri && hasSat && hasSun)) return "Friday—Sunday";
	if (hasSat && hasSun && !hasFri) return "Saturday—Sunday";
	if (hasFri && !hasSat && !hasSun) return "Friday";
	if (hasSat && !hasFri && !hasSun) return "Saturday";
	if (hasSun && !hasFri && !hasSat) return "Sunday";

	// Specific mappings fallback
	const map: Record<string, string> = {
		fri_regular: "Friday",
		sat_regular: "Saturday",
		sun_regular: "Sunday",
		weekend_regular: "Friday—Sunday",
	};
	if (map[subCategory]) return map[subCategory];

	// Default: prettify
	return subCategory
		.replace(/_/g, " ")
		.replace(/\b\w/g, (m) => m.toUpperCase());
}

export function groupTickets(tickets: Ticket[]): TicketGroup[] {
	const groups = new Map<string, TicketGroup>();
	for (const t of tickets) {
		const key = `${t.event_id}__${t.category_id}__${t.sub_category}`;
		const existing = groups.get(key);
		if (!existing) {
			groups.set(key, {
				event_id: t.event_id,
				category_id: t.category_id,
				sub_category: t.sub_category,
				min_price: t.price,
				max_price: t.price,
				total_stock: t.stock,
				tickets: [t],
			});
		} else {
			existing.tickets.push(t);
			existing.min_price = Math.min(existing.min_price, t.price);
			existing.max_price = Math.max(existing.max_price, t.price);
			existing.total_stock += t.stock;
		}
	}

	const result = Array.from(groups.values());
	result.sort((a, b) => a.min_price - b.min_price);
	return result;
}

export async function xs2Fetch(path: string, init?: RequestInit) {
    const apiKey = process.env.XS2_API_KEY;
    if (!apiKey) throw new Error("XS2_API_KEY missing");
    const base = process.env.XS2_API_BASE || "https://api.xs2event.com/v1";
    const res = await fetch(`${base}/${path}`, {
		...init,
		headers: {
			Accept: "application/json",
			"X-Api-Key": apiKey,
			...(init?.headers || {}),
		},
		cache: "no-store",
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`XS2 API error ${res.status}: ${text}`);
	}
	return res.json();
}

export async function validateStock(ticketIds: string[]): Promise<boolean> {
	if (ticketIds.length === 0) return false;
	const qs = new URLSearchParams();
	qs.set("id", ticketIds.join(","));
	qs.set("ticket_status", "available");
	qs.set("stock", "gt:0");
	const data = await xs2Fetch(`tickets?${qs.toString()}`);
	const items: any[] = data.results ?? data.items ?? [];
	const availableSet = new Set(items.map((t: any) => String(t.id)));
	return ticketIds.every((id) => availableSet.has(String(id)));
}


