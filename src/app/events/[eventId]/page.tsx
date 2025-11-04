import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailContent } from "@/components/event-detail-content";

async function fetchTickets(eventId: string) {
	const qs = new URLSearchParams({
		event_id: eventId,
		ticket_status: "available",
		stock: "gt:0",
		page_size: "500",
	});
	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/tickets?${qs.toString()}`, { 
		cache: "no-store",
		next: { revalidate: 300 } // Revalidate every 5 minutes
	});
	if (!res.ok) {
		if (process.env.NODE_ENV === "development") {
			console.error("[tickets] fetch failed", res.status, res.statusText);
		}
		return [];
	}
	const data = await res.json();
	const rawTickets = data.tickets ?? data.results ?? data.items ?? [];
	const filtered = rawTickets.filter((t: any) => {
		return String(t.ticket_status ?? t.status ?? "").toLowerCase() === "available" && Number(t.stock ?? t.quantity ?? 0) > 0;
	});
	return filtered;
}

async function fetchEvent(eventId: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/events?event_id=${encodeURIComponent(eventId)}`, { 
		cache: "no-store",
		next: { revalidate: 3600 } // Revalidate every hour
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
	props: { params: { eventId: string } | Promise<{ eventId: string }> }
): Promise<Metadata> {
	const maybePromise = props.params as any;
	const { eventId } = (maybePromise && typeof maybePromise.then === "function") ? await maybePromise : maybePromise;
	
	const event = await fetchEvent(eventId);
	
	if (!event) {
		return {
			title: "Event Not Found | Apex Tickets",
		};
	}

	const eventName = event.name ?? event.event_name ?? event.official_name ?? "Event";
	const venue = event.venue_name ?? event.venue ?? "";
	const date = event.date_start ?? event.date_start_main_event;
	const sportType = event.sport_type;
	const description = `Buy tickets for ${eventName}${venue ? ` at ${venue}` : ""}. Official tickets, secure booking, best prices guaranteed.`;

	return {
		title: `${eventName} Tickets | Buy Online | Apex Tickets`,
		description,
		keywords: `${eventName} tickets, ${sportType} tickets, ${venue} tickets${date ? `, ${new Date(date).getFullYear()}` : ""}`,
		openGraph: {
			title: `${eventName} Tickets | Apex Tickets`,
			description,
			type: "website",
		},
		alternates: {
			canonical: `/events/${eventId}`,
		},
	};
}

export default async function EventDetail(props: { params: { eventId: string } | Promise<{ eventId: string }> }) {
	const maybePromise = props.params as any;
	const { eventId } = (maybePromise && typeof maybePromise.then === "function") ? await maybePromise : maybePromise;
	
	const [event, tickets, categories] = await Promise.all([
		fetchEvent(eventId),
		fetchTickets(eventId),
		fetchCategories(eventId),
	]);

	if (!event) {
		notFound();
	}

	return <EventDetailContent event={event} tickets={tickets} categories={categories} />;
}


