import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const page = parseInt(searchParams.get("page") || "1");
	const pageSize = parseInt(searchParams.get("page_size") || "50");
	const sportType = searchParams.get("sport_type");
	const isoCountry = searchParams.get("iso_country");
	const popular = searchParams.get("popular");
	
	try {
		const supabase = getSupabaseAdmin();
		
		// Build query
		let query = supabase
			.from("teams")
			.select("*");
		
		// Apply filters
		if (sportType) {
			query = query.eq("sport_type", sportType);
		}
		if (isoCountry) {
			query = query.eq("iso_country", isoCountry);
		}
		if (popular === "true") {
			query = query.eq("popular_team", true);
		}
		
		// Order by official_name
		query = query.order("official_name", { ascending: true, nullsFirst: false });
		
		// Apply pagination
		const from = (page - 1) * pageSize;
		const to = from + pageSize - 1;
		query = query.range(from, to);
		
		const { data, error } = await query;
		
		if (error) {
			console.error("[API] Teams DB error:", error);
			return Response.json({ 
				error: "Failed to fetch teams",
				status: 500,
				details: error.message,
				teams: [],
				results: [],
				items: []
			}, { status: 500 });
		}
		
		// Get total count for pagination (with same filters)
		let countQuery = supabase
			.from("teams")
			.select("*", { count: "exact", head: true });
		
		if (sportType) {
			countQuery = countQuery.eq("sport_type", sportType);
		}
		if (isoCountry) {
			countQuery = countQuery.eq("iso_country", isoCountry);
		}
		if (popular === "true") {
			countQuery = countQuery.eq("popular_team", true);
		}
		
		const { count: totalCount } = await countQuery;
		
		// Return in XS2-compatible format
		const response = {
			teams: data || [],
			results: data || [],
			items: data || [],
			pagination: {
				page,
				page_size: pageSize,
				total: totalCount || 0,
				total_pages: Math.ceil((totalCount || 0) / pageSize),
				next_page: page * pageSize < (totalCount || 0) ? page + 1 : null,
				prev_page: page > 1 ? page - 1 : null,
			}
		};
		
		return Response.json(response, { status: 200 });
	} catch (error: any) {
		console.error("[API] Teams fetch error:", error);
		return Response.json({ 
			error: "Failed to fetch teams",
			message: error.message,
			teams: [],
			results: [],
			items: []
		}, { status: 500 });
	}
}


