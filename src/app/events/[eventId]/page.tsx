import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventDetailContent } from "@/components/event-detail-content";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

async function fetchTickets(eventId: string) {
	const qs = new URLSearchParams({
		event_id: eventId,
		ticket_status: "available",
		stock: "gt:0",
		page_size: "500",
	});
	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/tickets?${qs.toString()}`, { 
		cache: "no-store" // Always fetch fresh tickets data
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
	// Query Supabase directly to avoid Next.js fetch caching issues
	const supabase = getSupabaseAdmin();
	
	const { data, error } = await supabase
		.from("events")
		.select("event_id,event_name,date_start,date_stop,event_status,tournament_id,tournament_name,venue_id,venue_name,location_id,city,iso_country,latitude,longitude,sport_type,season,tournament_type,date_confirmed,date_start_main_event,date_stop_main_event,hometeam_id,hometeam_name,visiting_id,visiting_name,created,updated,event_description,min_ticket_price_eur,max_ticket_price_eur,slug,number_of_tickets,sales_periods,is_popular,created_at,updated_at,image")
		.eq("event_id", eventId)
		.single();
	
	if (error || !data) {
		if (process.env.NODE_ENV === "development") {
			console.error("[fetchEvent] Supabase error:", error?.message || "Event not found");
		}
		return null;
	}
	
	return data;
}

async function fetchTournament(tournamentId: string) {
	if (!tournamentId) return null;
	
	const supabase = getSupabaseAdmin();
	
	const { data, error } = await supabase
		.from("tournaments")
		.select("tournament_id,official_name,image")
		.eq("tournament_id", tournamentId)
		.single();
	
	if (error || !data) {
		if (process.env.NODE_ENV === "development") {
			console.error("[fetchTournament] Supabase error:", error?.message || "Tournament not found");
		}
		return null;
	}
	
	return data;
}

async function fetchCategories(eventId: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/categories?event_id=${encodeURIComponent(eventId)}`, { 
		cache: "no-store" // Always fetch fresh categories data
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

	const eventData = event as any;
	const eventName = eventData.name ?? eventData.event_name ?? eventData.official_name ?? "Event";
	const venue = eventData.venue_name ?? eventData.venue ?? "";
	const date = eventData.date_start ?? eventData.date_start_main_event;
	const sportType = eventData.sport_type;
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

	// Fetch tournament and sport if available
	const eventData = event as any;
	const [tournament, sport] = await Promise.all([
		eventData.tournament_id ? fetchTournament(eventData.tournament_id) : Promise.resolve(null),
		eventData.sport_type ? (async () => {
			const supabase = getSupabaseAdmin();
			const sportKey = eventData.sport_type.toLowerCase() === "soccer" ? "football" : eventData.sport_type.toLowerCase();
			const { data } = await supabase
				.from("sports")
				.select("sport_id,image")
				.eq("sport_id", sportKey)
				.single();
			return data || null;
		})() : Promise.resolve(null),
	]);

	return <EventDetailContent event={event} tickets={tickets} categories={categories} tournament={tournament} sport={sport} />;
}


