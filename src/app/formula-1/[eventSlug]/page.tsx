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
	// Normalize base URL - remove trailing slash if present
	const baseUrlRaw = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	const baseUrl = baseUrlRaw.replace(/\/+$/, "");
	let url: string | null = `${baseUrl}/api/xs2/events?sport_type=${sportType}&page_size=100&origin=allevents`;
	let pageCount = 0;
	const maxPages = 50; // Safety limit
	
	while (url && pageCount < maxPages) {
		try {
			if (process.env.NODE_ENV === "development") {
				console.log(`[fetchAllEvents] Fetching: ${url}`);
			}
			
			const res: Response = await fetch(url, {
				next: { revalidate: 3600 }
			});
			
			if (!res.ok) {
				const errorText = await res.text();
				if (process.env.NODE_ENV === "development") {
					console.error(`[fetchAllEvents] API error: ${res.status} ${res.statusText}`, errorText);
				}
				break;
			}
			
			const data = await res.json();
			const events = data.events ?? data.results ?? data.items ?? [];
			
			if (process.env.NODE_ENV === "development") {
				if (pageCount === 0) {
					console.log(`[fetchAllEvents] First page response:`, {
						status: res.status,
						eventsCount: events.length,
						total: data.total,
						pagination: data.pagination,
						hasNextPage: data.pagination?.next_page,
						dataKeys: Object.keys(data),
						firstEventSample: events[0] ? {
							id: events[0].id ?? events[0].event_id,
							name: events[0].name ?? events[0].event_name,
							sport_type: events[0].sport_type
						} : null
					});
				}
				if (events.length === 0 && pageCount === 0) {
					console.warn(`[fetchAllEvents] No events returned! Response data:`, JSON.stringify(data, null, 2).substring(0, 500));
				}
			}
			
			if (events.length === 0) {
				break;
			}
			
			allEvents.push(...events);
			
			// Follow pagination from API response
			const pagination = data.pagination;
			const nextPage = pagination?.next_page;
			
			if (!nextPage || nextPage === url || typeof nextPage !== "string") {
				url = null;
			} else if (nextPage.startsWith("http")) {
				// Full URL - convert to our API route
				const nextUrl = new URL(nextPage);
				const nextParams = new URLSearchParams(nextUrl.searchParams);
				nextParams.set("origin", "allevents");
				url = `${baseUrl}/api/xs2/events?${nextParams.toString()}`;
			} else {
				// Relative URL or query string
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
			
			// Normalize URL to prevent double slashes
			if (url) {
				url = url.replace(/([^:]\/)\/+/g, "$1");
			}
			
			pageCount++;
		} catch (error) {
			if (process.env.NODE_ENV === "development") {
				console.error("[fetchAllEvents] Error:", error);
			}
			break;
		}
	}
	
	if (process.env.NODE_ENV === "development") {
		console.log(`[fetchAllEvents] Fetched ${pageCount} pages, ${allEvents.length} total events for ${sportType}`);
	}
	
	return allEvents;
}

async function fetchEventBySlug(eventSlug: string): Promise<{ event: any; eventId: string } | null> {
	// Try to extract event ID from slug first (fallback format: event-{id})
	const extractedId = extractEventIdFromSlug(eventSlug);
	if (extractedId) {
		const event = await fetchEvent(extractedId);
		if (event) return { event, eventId: extractedId };
	}

	// Fetch all Formula 1 events across all pages
	const events = await fetchAllEvents("formula1");
	
	if (process.env.NODE_ENV === "development") {
		console.log(`[fetchEventBySlug] Searching for slug "${eventSlug}" among ${events.length} events`);
	}
	
	// Find event that matches the slug
	for (const event of events) {
		const slug = createEventSlug(event);
		if (process.env.NODE_ENV === "development" && slug === eventSlug) {
			console.log(`[fetchEventBySlug] Found match! Event: ${event.name ?? event.event_name}, Slug: ${slug}`);
		}
		if (slug === eventSlug) {
			return { event, eventId: String(event.id ?? event.event_id) };
		}
	}
	
	if (process.env.NODE_ENV === "development") {
		console.log(`[fetchEventBySlug] No match found. Sample slugs:`, events.slice(0, 5).map(e => createEventSlug(e)));
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
	const description = `Buy tickets for ${eventName}${venue ? ` at ${venue}` : ""}. Official Formula 1 tickets, secure booking, best prices guaranteed.`;

	return {
		title: `${eventName} Tickets | Buy F1 Tickets Online | Apex Tickets`,
		description,
		keywords: `${eventName} tickets, formula 1 tickets, f1 tickets, ${venue} tickets${date ? `, ${new Date(date).getFullYear()}` : ""}`,
		openGraph: {
			title: `${eventName} Tickets | Apex Tickets`,
			description,
			type: "website",
		},
		alternates: {
			canonical: `/formula-1/${eventSlug}`,
		},
	};
}

export default async function Formula1EventDetail(props: { params: { eventSlug: string } | Promise<{ eventSlug: string }> }) {
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

	return <EventDetailContent event={event} tickets={tickets} categories={categories} sportPath="/formula-1" />;
}

