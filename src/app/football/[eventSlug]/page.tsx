import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailContent } from "@/components/event-detail-content";
import { createEventSlug, extractEventIdFromSlug } from "@/lib/slug";

async function fetchTickets(eventId: string) {
	const qs = new URLSearchParams({
		event_id: eventId,
		ticket_status: "available",
		stock: "gt:0",
		page_size: "500",
	});
	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/tickets?${qs.toString()}`, { 
		cache: "no-store",
		next: { revalidate: 300 }
	});
	if (!res.ok) return [];
	const data = await res.json();
	const rawTickets = data.tickets ?? data.results ?? data.items ?? [];
	return rawTickets.filter((t: any) => {
		return String(t.ticket_status ?? t.status ?? "").toLowerCase() === "available" && Number(t.stock ?? t.quantity ?? 0) > 0;
	});
}

async function fetchAllEvents(sportType: string): Promise<any[]> {
	const allEvents: any[] = [];
	const baseUrlRaw = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	const baseUrl = baseUrlRaw.replace(/\/+$/, "");
	let url: string | null = `${baseUrl}/api/xs2/events?sport_type=${sportType}&page_size=100&origin=allevents`;
	let pageCount = 0;
	const maxPages = 50;
	
	while (url && pageCount < maxPages) {
		try {
			url = url.replace(/([^:]\/)\/+/g, "$1"); // Normalize double slashes
			const res: Response = await fetch(url, {
				next: { revalidate: 3600 }
			});
			
			if (!res.ok) break;
			
			const data = await res.json();
			const events = data.events ?? data.results ?? data.items ?? [];
			
			if (events.length === 0) break;
			
			allEvents.push(...events);
			
			const pagination = data.pagination;
			const nextPage = pagination?.next_page;
			
			if (!nextPage || nextPage === url || typeof nextPage !== "string") {
				url = null;
			} else if (nextPage.startsWith("http")) {
				const nextUrl = new URL(nextPage);
				const nextParams = new URLSearchParams(nextUrl.searchParams);
				nextParams.set("origin", "allevents");
				url = `${baseUrl}/api/xs2/events?${nextParams.toString()}`;
			} else {
				try {
					const nextUrl = new URL(nextPage, "https://api.xs2event.com/v1/");
					const nextParams = new URLSearchParams(nextUrl.searchParams);
					nextParams.set("origin", "allevents");
					url = `${baseUrl}/api/xs2/events?${nextParams.toString()}`;
				} catch {
					if (nextPage.includes("=")) {
						const nextParams = new URLSearchParams(nextPage);
						nextParams.set("origin", "allevents");
						url = `${baseUrl}/api/xs2/events?${nextParams.toString()}`;
					} else {
						url = null;
					}
				}
			}
			
			if (url) {
				url = url.replace(/([^:]\/)\/+/g, "$1"); // Normalize double slashes
			}
			pageCount++;
		} catch (error) {
			break;
		}
	}
	
	return allEvents;
}

async function fetchEventBySlug(eventSlug: string): Promise<{ event: any; eventId: string } | null> {
	const extractedId = extractEventIdFromSlug(eventSlug);
	if (extractedId) {
		const event = await fetchEvent(extractedId);
		if (event) return { event, eventId: extractedId };
	}

	const events = await fetchAllEvents("football");
	
	for (const event of events) {
		const slug = createEventSlug(event);
		if (slug === eventSlug) {
			return { event, eventId: String(event.id ?? event.event_id) };
		}
	}
	
	return null;
}

async function fetchEvent(eventId: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/events?event_id=${encodeURIComponent(eventId)}`, { 
		cache: "no-store",
		next: { revalidate: 3600 }
	});
	if (!res.ok) return null;
	const data = await res.json();
	const items = data.results ?? data.items ?? [];
	return items[0] ?? null;
}

async function fetchCategories(eventId: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/categories?event_id=${encodeURIComponent(eventId)}`, { 
		cache: "no-store",
		next: { revalidate: 3600 }
	});
	if (!res.ok) return [];
	const data = await res.json();
	return data.categories ?? data.results ?? data.items ?? [];
}

export async function generateMetadata(
	props: { params: { eventSlug: string } | Promise<{ eventSlug: string }> }
): Promise<Metadata> {
	const maybePromise = props.params as any;
	const { eventSlug } = (maybePromise && typeof maybePromise.then === "function") ? await maybePromise : maybePromise;
	
	const result = await fetchEventBySlug(eventSlug);
	
	if (!result) {
		return {
			title: "Event Not Found | Apex Tickets",
		};
	}

	const { event } = result;
	const eventName = event.name ?? event.event_name ?? event.official_name ?? "Event";
	const venue = event.venue_name ?? event.venue ?? "";
	const date = event.date_start ?? event.date_start_main_event;
	const description = `Buy tickets for ${eventName}${venue ? ` at ${venue}` : ""}. Official football tickets, secure booking, best prices guaranteed.`;

	return {
		title: `${eventName} Tickets | Buy Football Tickets Online | Apex Tickets`,
		description,
		keywords: `${eventName} tickets, football tickets, soccer tickets, ${venue} tickets${date ? `, ${new Date(date).getFullYear()}` : ""}`,
		openGraph: {
			title: `${eventName} Tickets | Apex Tickets`,
			description,
			type: "website",
		},
		alternates: {
			canonical: `/football/${eventSlug}`,
		},
	};
}

export default async function FootballEventDetail(props: { params: { eventSlug: string } | Promise<{ eventSlug: string }> }) {
	const maybePromise = props.params as any;
	const { eventSlug } = (maybePromise && typeof maybePromise.then === "function") ? await maybePromise : maybePromise;
	
	const result = await fetchEventBySlug(eventSlug);
	
	if (!result) {
		notFound();
	}

	const { event, eventId } = result;
	const [tickets, categories] = await Promise.all([
		fetchTickets(eventId),
		fetchCategories(eventId),
	]);

	return <EventDetailContent event={event} tickets={tickets} categories={categories} sportPath="/football" />;
}

