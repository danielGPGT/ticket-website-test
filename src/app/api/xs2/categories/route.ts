import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const eventId = searchParams.get("event_id");
	if (!eventId) return Response.json({ error: "event_id required" }, { status: 400 });

	const url = `https://api.xs2event.com/v1/categories?event_id=${encodeURIComponent(eventId)}`;
    const res = await fetch(url, {
        headers: {
            Accept: "application/json",
            "X-Api-Key": process.env.XS2_API_KEY as string,
        },
        cache: "no-store",
    });
	const data = await res.json();
	return Response.json(data, { status: res.status });
}


