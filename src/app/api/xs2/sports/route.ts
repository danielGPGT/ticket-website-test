import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const qs = new URL(request.url).searchParams;
	const url = `https://api.xs2event.com/v1/sports?${qs.toString()}`;
	
	try {
		const res = await fetch(url, {
			headers: { 
				Accept: "application/json", 
				"X-Api-Key": process.env.XS2_API_KEY as string 
			},
			cache: "no-store",
		});
		
		if (!res.ok) {
			const errorText = await res.text();
			console.error("[API] Sports API error:", res.status, res.statusText, errorText);
			return Response.json({ 
				error: "Failed to fetch sports",
				status: res.status,
				details: errorText,
				sports: [],
				results: [],
				items: []
			}, { status: res.status });
		}
		
		const data = await res.json();
		console.log("[API] Sports API response keys:", Object.keys(data));
		console.log("[API] Sports API response sample:", data.sports?.[0] ?? data.results?.[0] ?? data.items?.[0] ?? "no data");
		return Response.json(data, { status: res.status });
	} catch (error: any) {
		console.error("[API] Sports API fetch error:", error);
		return Response.json({ 
			error: "Failed to fetch sports",
			message: error.message,
			sports: [],
			results: [],
			items: []
		}, { status: 500 });
	}
}


