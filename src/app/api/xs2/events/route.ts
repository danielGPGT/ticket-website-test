import { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";

// Helper function to fetch events from XS2 API (will be cached)
async function fetchEventsFromXS2(
    eventId: string | null,
    passthrough: URLSearchParams,
    origin: string | null
) {
    const today = new Date().toISOString().split("T")[0];
    
    // Only set defaults if not a single event request
    if (!eventId) {
        // Only set page_size if not already provided and we have query params
        if (!passthrough.has("page_size") && passthrough.toString()) {
            passthrough.set("page_size", "50");
        }
        // Only set date_stop if not already provided and not showing all events
        // Note: XS2 API might not accept date_stop with tournament_id alone, so only add for sport_type
        if (!passthrough.has("date_stop") && origin !== "allevents") {
            // Only add date filter if we have sport_type (not for tournament_id alone)
            if (passthrough.has("sport_type")) {
                passthrough.set("date_stop", `ge:${today}`);
            }
        }
    }
    
    const url = eventId
        ? `https://api.xs2event.com/v1/events/${encodeURIComponent(eventId)}`
        : `https://api.xs2event.com/v1/events?${passthrough.toString()}`;
    
    console.log("[API] XS2 Events URL:", url);
    console.log("[API] Query params:", Object.fromEntries(passthrough));

    const res = await fetch(url, {
        headers: {
            Accept: "application/json",
            "X-Api-Key": process.env.XS2_API_KEY as string,
        },
        cache: "no-store", // Don't cache the external API call itself
    });
    
    if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try {
            errorData = JSON.parse(errorText);
        } catch {
            errorData = { message: errorText };
        }
        console.error("[API] XS2 Error:", res.status, res.statusText);
        console.error("[API] Error details:", errorData);
        throw new Error(JSON.stringify({ 
            error: "Failed to fetch events", 
            status: res.status,
            details: errorData,
        }));
    }
    
    const data = await res.json();
    // Normalize single-event response into { results: [event] }
    if (eventId && res.ok && data && !Array.isArray(data)) {
        return { results: [data], status: res.status };
    }
    return { ...data, status: res.status };
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id") || searchParams.get("event_id");
    const origin = searchParams.get("origin");
    const passthrough = new URLSearchParams(searchParams);
    
    // Remove origin parameter (not a valid XS2 API parameter)
    passthrough.delete("origin");
    
    // Convert 'team' parameter to 'team_id' if needed
    if (passthrough.has("team") && !passthrough.has("team_id")) {
        passthrough.set("team_id", passthrough.get("team") || "");
        passthrough.delete("team");
    }
    
    // Convert 'page_number' to 'page' (XS2 API uses 'page' not 'page_number')
    if (passthrough.has("page_number") && !passthrough.has("page")) {
        passthrough.set("page", passthrough.get("page_number") || "1");
        passthrough.delete("page_number");
    }
    
    // Create stable cache key from query parameters
    // Convert to sorted string for consistent cache keys
    const sortedParams = Array.from(passthrough.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
    const cacheKey = `events-${eventId || sortedParams || 'all'}`;
    
    // Cache events for 24 hours (86400 seconds)
    // Different queries will have different cache keys
    const getCachedEvents = unstable_cache(
        async () => {
            // Clone passthrough to avoid mutations
            const paramsCopy = new URLSearchParams(passthrough);
            return await fetchEventsFromXS2(eventId, paramsCopy, origin);
        },
        [cacheKey], // Cache key
        {
            revalidate: 86400, // 24 hours in seconds
            tags: ['events'], // Cache tag for potential manual revalidation
        }
    );

    try {
        const result = await getCachedEvents();
        return Response.json(result, { status: result.status || 200 });
    } catch (error: any) {
        // Handle errors
        let errorData;
        try {
            errorData = JSON.parse(error.message);
        } catch {
            errorData = { error: error.message || "Failed to fetch events" };
        }
        return Response.json({ 
            ...errorData,
            events: [],
            results: [],
            items: []
        }, { status: errorData.status || 500 });
    }
}


