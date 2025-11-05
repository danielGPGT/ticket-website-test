import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const page = parseInt(searchParams.get("page") || "1");
	const pageSize = parseInt(searchParams.get("page_size") || "100");
	
	try {
		const supabase = getSupabaseAdmin();
		
		// Build query - explicitly include image column
		let query = supabase
			.from("sports")
			.select("sport_id,created_at,updated_at,image")
			.order("sport_id", { ascending: true });
		
		// Apply pagination
		const from = (page - 1) * pageSize;
		const to = from + pageSize - 1;
		query = query.range(from, to);
		
		const { data, error, count } = await query;
		
		if (error) {
			console.error("[API] Sports DB error:", error);
			return Response.json({ 
				error: "Failed to fetch sports",
				status: 500,
				details: error.message,
				sports: [],
				results: [],
				items: []
			}, { status: 500 });
		}
		
		// Get total count for pagination
		const { count: totalCount } = await supabase
			.from("sports")
			.select("*", { count: "exact", head: true });
		
		// Return in XS2-compatible format
		const response = {
			sports: data || [],
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
		console.error("[API] Sports fetch error:", error);
		return Response.json({ 
			error: "Failed to fetch sports",
			message: error.message,
			sports: [],
			results: [],
			items: []
		}, { status: 500 });
	}
}


