import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const page = parseInt(searchParams.get("page") || "1");
	const pageSize = parseInt(searchParams.get("page_size") || "200");
	
	try {
		const supabase = getSupabaseAdmin();
		
		// Build query
		let query = supabase
			.from("countries")
			.select("*")
			.order("country", { ascending: true });
		
		// Apply pagination
		const from = (page - 1) * pageSize;
		const to = from + pageSize - 1;
		query = query.range(from, to);
		
		const { data, error } = await query;
		
		if (error) {
			console.error("[API] Countries DB error:", error);
			return Response.json({ 
				error: "Failed to fetch countries",
				status: 500,
				details: error.message,
				countries: [],
				results: [],
				items: []
			}, { status: 500 });
		}
		
		// Get total count for pagination
		const { count: totalCount } = await supabase
			.from("countries")
			.select("*", { count: "exact", head: true });
		
		// Return in XS2-compatible format
		const response = {
			countries: data || [],
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
		console.error("[API] Countries fetch error:", error);
		return Response.json({ 
			error: "Failed to fetch countries",
			message: error.message,
			countries: [],
			results: [],
			items: []
		}, { status: 500 });
	}
}


