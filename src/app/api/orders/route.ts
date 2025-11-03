import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
	const body = await req.json();
	const supabase = getSupabaseAdmin();
	const { data, error } = await supabase.from("orders").insert(body).select().single();
	if (error) return Response.json({ error: error.message }, { status: 400 });
	return Response.json(data);
}

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id");
	if (!id) return Response.json({ error: "id required" }, { status: 400 });
	const supabase = getSupabaseAdmin();
	const { data, error } = await supabase.from("orders").select("*").eq("id", id).single();
	if (error) return Response.json({ error: error.message }, { status: 404 });
	return Response.json(data);
}


