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
		cache: "no-store" // Always fetch fresh tickets data
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
				cache: "no-store" // Always fetch fresh events data
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

	const events = await fetchAllEvents("motogp");
	
	for (const event of events) {
		const slug = createEventSlug(event);
		if (slug === eventSlug) {
			return { event, eventId: String(event.id ?? event.event_id) };
		}
	}
	
	return null;
}

async function fetchEvent(eventId: string) {
	// Query Supabase directly to avoid Next.js fetch caching issues
	const { getSupabaseAdmin } = await import("@/lib/supabase-admin");
	const supabase = getSupabaseAdmin();
	
	const { data, error } = await supabase
		.from("events")
		.select("event_id,event_name,date_start,date_stop,event_status,tournament_id,tournament_name,venue_id,venue_name,location_id,city,iso_country,latitude,longitude,sport_type,season,tournament_type,date_confirmed,date_start_main_event,date_stop_main_event,hometeam_id,hometeam_name,visiting_id,visiting_name,created,updated,event_description,min_ticket_price_eur,max_ticket_price_eur,slug,number_of_tickets,sales_periods,is_popular,created_at,updated_at,image")
		.eq("event_id", eventId)
		.single();
	
	if (error || !data) return null;
	return data;
}

async function fetchTournament(tournamentId: string) {
	if (!tournamentId) return null;
	
	const { getSupabaseAdmin } = await import("@/lib/supabase-admin");
	const supabase = getSupabaseAdmin();
	
	const { data, error } = await supabase
		.from("tournaments")
		.select("tournament_id,official_name,image")
		.eq("tournament_id", tournamentId)
		.single();
	
	if (error || !data) return null;
	return data;
}

async function fetchSport(sportType: string) {
	if (!sportType) return null;
	
	const { getSupabaseAdmin } = await import("@/lib/supabase-admin");
	const supabase = getSupabaseAdmin();
	
	const { data, error } = await supabase
		.from("sports")
		.select("sport_id,image")
		.eq("sport_id", sportType.toLowerCase())
		.single();
	
	if (error || !data) return null;
	return data;
}

async function fetchCategories(eventId: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/xs2/categories?event_id=${encodeURIComponent(eventId)}`, { 
		cache: "no-store" // Always fetch fresh event/categories data
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
	const description = `Buy tickets for ${eventName}${venue ? ` at ${venue}` : ""}. Official MotoGP tickets, secure booking, best prices guaranteed.`;

	return {
		title: `${eventName} Tickets | Buy MotoGP Tickets Online | Apex Tickets`,
		description,
		keywords: `${eventName} tickets, motogp tickets, motorcycle gp tickets, ${venue} tickets${date ? `, ${new Date(date).getFullYear()}` : ""}`,
		openGraph: {
			title: `${eventName} Tickets | Apex Tickets`,
			description,
			type: "website",
		},
		alternates: {
			canonical: `/motogp/${eventSlug}`,
		},
	};
}

export default async function MotoGPEventDetail(props: { params: { eventSlug: string } | Promise<{ eventSlug: string }> }) {
	const maybePromise = props.params as any;
	const { eventSlug } = (maybePromise && typeof maybePromise.then === "function") ? await maybePromise : maybePromise;
	
	const result = await fetchEventBySlug(eventSlug);
	
	if (!result) {
		notFound();
	}

	const { event, eventId } = result;
	const [tickets, categories, tournament, sport] = await Promise.all([
		fetchTickets(eventId),
		fetchCategories(eventId),
		event.tournament_id ? fetchTournament(event.tournament_id) : Promise.resolve(null),
		event.sport_type ? fetchSport(event.sport_type) : Promise.resolve(null),
	]);

	return <EventDetailContent event={event} tickets={tickets} categories={categories} sportPath="/motogp" tournament={tournament} sport={sport} />;
}

