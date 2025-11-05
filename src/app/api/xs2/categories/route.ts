import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const eventId = searchParams.get("event_id");
	
	if (!eventId) {
		return Response.json({ error: "event_id required" }, { status: 400 });
	}
	
	try {
		const supabase = getSupabaseAdmin();
		
		// First, get the event to find its venue_id
		const { data: eventData, error: eventError } = await supabase
			.from("events")
			.select("venue_id")
			.eq("event_id", eventId)
			.single();
		
		if (eventError || !eventData) {
			console.error("[API] Event not found:", eventError);
			return Response.json({ 
				error: "Event not found",
				categories: [],
				results: [],
				items: []
			}, { status: 404 });
		}
		
		const venueId = (eventData as { venue_id: string | null }).venue_id;
		if (!venueId) {
			return Response.json({ 
				error: "Event has no venue",
				categories: [],
				results: [],
				items: []
			}, { status: 404 });
		}
		
		// Fetch categories for this venue
		const { data, error } = await supabase
			.from("categories")
			.select("*")
			.eq("venue_id", venueId)
			.order("category_name", { ascending: true });
		
		if (error) {
			console.error("[API] Categories DB error:", error);
			return Response.json({ 
				error: "Failed to fetch categories",
				status: 500,
				details: error.message,
				categories: [],
				results: [],
				items: []
			}, { status: 500 });
		}
		
		// Return in XS2-compatible format
		const response = {
			categories: data || [],
			results: data || [],
			items: data || []
		};
		
		return Response.json(response, { status: 200 });
	} catch (error: any) {
		console.error("[API] Categories fetch error:", error);
		return Response.json({ 
			error: "Failed to fetch categories",
			message: error.message,
			categories: [],
			results: [],
			items: []
		}, { status: 500 });
	}
}


