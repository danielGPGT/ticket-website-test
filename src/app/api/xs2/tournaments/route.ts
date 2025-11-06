import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const page = parseInt(searchParams.get("page") || "1");
	const pageSize = parseInt(searchParams.get("page_size") || "50");
	const sportType = searchParams.get("sport_type");
	const region = searchParams.get("region");
	const popular = searchParams.get("popular");
    const tournamentIdsParam = searchParams.get("tournament_ids"); // comma-separated list of IDs
	
	try {
		const supabase = getSupabaseAdmin();
		
        // Build query - explicitly include image column
        let query = supabase
            .from("tournaments")
            .select("tournament_id,official_name,season,tournament_type,region,sport_type,date_start,date_stop,slug,number_events,created,updated,created_at,updated_at,image");
		
		// Apply filters
		if (sportType) {
			query = query.eq("sport_type", sportType);
		}
		if (region) {
			query = query.eq("region", region);
		}
		if (popular === "true") {
			// Note: tournaments table doesn't have a popular field, but we can check if needed
			// For now, we'll skip this filter or add it to the schema if needed
		}
		
        // Filter by specific tournament IDs if provided (takes precedence)
        if (tournamentIdsParam) {
            const ids = tournamentIdsParam
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            if (ids.length > 0) {
                query = query.in("tournament_id", ids);
            }
        }

        // Order by date_start descending (most recent first)
        query = query.order("date_start", { ascending: false, nullsFirst: false });
		
		// Apply pagination
		const from = (page - 1) * pageSize;
		const to = from + pageSize - 1;
		query = query.range(from, to);
		
		const { data, error } = await query;
		
		if (error) {
			console.error("[API] Tournaments DB error:", error);
			return Response.json({ 
				error: "Failed to fetch tournaments",
				status: 500,
				details: error.message,
				tournaments: [],
				results: []
			}, { status: 500 });
		}
		
        // Get total count for pagination (with same filters)
        let countQuery = supabase
            .from("tournaments")
            .select("*", { count: "exact", head: true });
		
		if (sportType) {
			countQuery = countQuery.eq("sport_type", sportType);
		}
		if (region) {
			countQuery = countQuery.eq("region", region);
		}
		
        if (tournamentIdsParam) {
            const ids = tournamentIdsParam
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
            if (ids.length > 0) {
                countQuery = countQuery.in("tournament_id", ids);
            }
        }

        const { count: totalCount } = await countQuery;
		
		// Return in XS2-compatible format
		const response = {
			tournaments: data || [],
			results: data || [],
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
		console.error("[API] Tournaments fetch error:", error);
		return Response.json({ 
			error: "Failed to fetch tournaments",
			message: error.message,
			tournaments: [],
			results: []
		}, { status: 500 });
	}
}


