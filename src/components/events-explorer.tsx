"use client";
import { useEffect, useMemo, useState } from "react";
import { EventCard } from "@/components/event-card";

type Option = { value: string; label: string };

export function EventsExplorer() {
	const [sports, setSports] = useState<Option[]>([]);
	const [tournaments, setTournaments] = useState<Option[]>([]);
	const [sportType, setSportType] = useState("formula1");
	const [tournamentId, setTournamentId] = useState<string | undefined>(undefined);
	const [query, setQuery] = useState("");
	const [events, setEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetch("/api/xs2/sports")
			.then((r) => r.json())
			.then((d) => {
				const raw = (d.sports ?? d.results ?? []) as any[];
				const seen = new Set<string>();
				const list: Option[] = [];
				raw.forEach((s, idx) => {
					const value = String(s.sport_type ?? s.id ?? s.slug ?? idx);
					if (seen.has(value)) return;
					seen.add(value);
					list.push({ value, label: String(s.official_name ?? s.name ?? s.sport_type ?? value) });
				});
				setSports(list);
			});
	}, []);

	useEffect(() => {
		const qs = new URLSearchParams({ sport_type: sportType, region: "WORLD", page_size: "100" });
		fetch(`/api/xs2/tournaments?${qs.toString()}`)
			.then((r) => r.json())
			.then((d) => {
				const raw = (d.tournaments ?? d.results ?? []) as any[];
				const seen = new Set<string>();
				const list: Option[] = [];
				raw.forEach((t, idx) => {
					const value = String(t.tournament_id ?? t.id ?? idx);
					if (seen.has(value)) return;
					seen.add(value);
					list.push({ value, label: String(t.official_name ?? t.name ?? value) });
				});
				setTournaments(list);
			});
	}, [sportType]);

	useEffect(() => {
		setLoading(true);
		const qs = new URLSearchParams({ sport_type: sportType, page_size: "50" });
		if (tournamentId) qs.set("tournament_id", tournamentId);
		if (query) qs.set("query", query);
		fetch(`/api/xs2/events?${qs.toString()}`)
			.then((r) => r.json())
			.then((d) => {
				const items = Array.isArray(d) ? d : (d.events ?? d.results ?? d.items ?? []);
				// Debug: log first event to see available fields
				if (process.env.NODE_ENV === "development" && items.length > 0) {
					console.log("[EventsExplorer] First event:", {
						id: items[0].id ?? items[0].event_id,
						name: items[0].name ?? items[0].event_name,
						iso_country: items[0].iso_country,
						country: items[0].country,
						allKeys: Object.keys(items[0]),
					});
				}
				setEvents(items);
			})
			.finally(() => setLoading(false));
	}, [sportType, tournamentId, query]);

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
				<div className="flex-1">
					<label className="block text-sm mb-1">Sport</label>
					<select className="w-full rounded border bg-transparent px-2 py-2" value={sportType} onChange={(e) => setSportType(e.target.value)}>
						{sports.map((s, idx) => (
							<option key={`${s.value}-${idx}`} value={s.value}>{s.label}</option>
						))}
					</select>
				</div>
				<div className="flex-1">
					<label className="block text-sm mb-1">Tournament</label>
					<select className="w-full rounded border bg-transparent px-2 py-2" value={tournamentId ?? ""} onChange={(e) => setTournamentId(e.target.value || undefined)}>
						<option value="">All</option>
						{tournaments.map((t, idx) => (
							<option key={`${t.value}-${idx}`} value={t.value}>{t.label}</option>
						))}
					</select>
				</div>
				<div className="flex-1">
					<label className="block text-sm mb-1">Search</label>
					<input className="w-full rounded border bg-transparent px-3 py-2" placeholder="Search events" value={query} onChange={(e) => setQuery(e.target.value)} />
				</div>
			</div>

			{loading ? (
				<div className="text-sm text-muted-foreground">Loading events…</div>
			) : events.length === 0 ? (
				<div className="text-sm text-muted-foreground">No events found.</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{events.map((e) => {
						// Try multiple possible country code fields
						const countryCode = e.iso_country ?? e.country ?? e.venue_country ?? e.location?.country ?? e.location?.iso_country ?? null;
						return (
							<EventCard 
								key={e.id ?? e.event_id} 
								id={String(e.id ?? e.event_id)} 
								name={e.name ?? e.official_name ?? e.event_name ?? "Event"} 
								date={e.date_start ?? e.start_date ?? undefined} 
								venue={e.venue_name ?? e.venue ?? undefined}
								countryCode={countryCode}
							/>
						);
					})}
				</div>
			)}
		</div>
	);
}


