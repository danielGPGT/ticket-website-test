import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const qs = new URLSearchParams(searchParams);
	if (!qs.has("page_size")) qs.set("page_size", "200");

	const url = `https://api.xs2event.com/v1/tickets?${qs.toString()}`;
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


