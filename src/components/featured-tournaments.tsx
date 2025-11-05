"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getSportImage, getTournamentImage } from "@/lib/images";

const popularLeagues = [
	{ name: "Formula 1", sport: "formula1", search: "formula 1" },
	{ name: "La Liga", sport: "soccer", search: "la liga" }, // Database uses "soccer"
	{ name: "Rugby", sport: "rugby", search: "rugby" },
	{ name: "Champions League", sport: "soccer", search: "champions league" }, // Database uses "soccer"
	{ name: "Bundesliga", sport: "soccer", search: "bundesliga" }, // Database uses "soccer"
	{ name: "Premier League", sport: "soccer", search: "premier league" }, // Database uses "soccer"
];

export function PopularTournaments() {
	const [sports, setSports] = useState<Record<string, any>>({});
	const [tournaments, setTournaments] = useState<Record<string, string>>({});
	const [tournamentData, setTournamentData] = useState<Record<string, any>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				// Fetch sports first to get image data
				const sportsRes = await fetch("/api/xs2/sports");
				const sportsData = await sportsRes.json();
				const sportsArray = (sportsData.sports ?? sportsData.results ?? []) as any[];
				const sportsMap: Record<string, any> = {};
				sportsArray.forEach((sport: any) => {
					const key = sport.sport_id?.toLowerCase() || "";
					sportsMap[key] = sport;
				});
				setSports(sportsMap);

				// Then fetch tournaments
				const found: Record<string, string> = {};
				const tournamentMap: Record<string, any> = {};

				for (const league of popularLeagues) {
					try {
					const res = await fetch(`/api/xs2/tournaments?sport_type=${league.sport}&page_size=50`);
					const data = await res.json();
					const items = (data.tournaments ?? data.results ?? []) as any[];
					
					// Improved matching: prioritize exact matches, current season, and tournaments with images
					const searchLower = league.search.toLowerCase();
					const now = new Date();
					const matches = items.filter((t: any) => {
						const name = String(t.official_name ?? t.name ?? "").toLowerCase();
						return name.includes(searchLower);
					});
					
					// Sort matches by priority:
					// 1. Exact name match (highest priority)
					// 2. Current/upcoming season (date_start >= now or date_stop >= now)
					// 3. Has image
					// 4. Shorter name (more specific)
					matches.sort((a: any, b: any) => {
						const aName = String(a.official_name ?? a.name ?? "").toLowerCase();
						const bName = String(b.official_name ?? b.name ?? "").toLowerCase();
						
						// Exact match first
						const aExact = aName === searchLower;
						const bExact = bName === searchLower;
						if (aExact && !bExact) return -1;
						if (!aExact && bExact) return 1;
						
						// Then prioritize current/upcoming tournaments
						// A tournament is "current" if:
						// - It has started (date_start <= now) AND hasn't ended (date_stop >= now or no date_stop), OR
						// - It's starting in the future (date_start >= now)
						const aDateStart = a.date_start ? new Date(a.date_start) : null;
						const aDateStop = a.date_stop ? new Date(a.date_stop) : null;
						const bDateStart = b.date_start ? new Date(b.date_start) : null;
						const bDateStop = b.date_stop ? new Date(b.date_stop) : null;
						
						const aIsCurrent = aDateStart && (
							(aDateStart <= now && (!aDateStop || aDateStop >= now)) || // Currently active
							(aDateStart >= now) // Upcoming
						);
						const bIsCurrent = bDateStart && (
							(bDateStart <= now && (!bDateStop || bDateStop >= now)) || // Currently active
							(bDateStart >= now) // Upcoming
						);
						
						if (aIsCurrent && !bIsCurrent) return -1;
						if (!aIsCurrent && bIsCurrent) return 1;
						
						// If both are current/upcoming, prefer:
						// 1. Currently active over upcoming
						// 2. The one closest to now (most recent start or nearest upcoming start)
						if (aIsCurrent && bIsCurrent && aDateStart && bDateStart) {
							const aIsActive = aDateStart <= now && (!aDateStop || aDateStop >= now);
							const bIsActive = bDateStart <= now && (!bDateStop || bDateStop >= now);
							
							// Prefer active over upcoming
							if (aIsActive && !bIsActive) return -1;
							if (!aIsActive && bIsActive) return 1;
							
							// Both same type, prefer closest to now
							const aDiff = Math.abs(aDateStart.getTime() - now.getTime());
							const bDiff = Math.abs(bDateStart.getTime() - now.getTime());
							return aDiff - bDiff;
						}
						
						// If one is current and one is not, prefer current
						if (!aIsCurrent && bIsCurrent) return 1;
						if (aIsCurrent && !bIsCurrent) return -1;
						
						// Then prioritize tournaments with images
						const aHasImage = !!a.image;
						const bHasImage = !!b.image;
						if (aHasImage && !bHasImage) return -1;
						if (!aHasImage && bHasImage) return 1;
						
						// Finally, prefer shorter names (more specific)
						return aName.length - bName.length;
					});
					
					const match = matches[0]; // Take the best match
						
						if (match) {
							const tournamentId = match.tournament_id ?? match.id;
							found[league.name] = tournamentId;
							// Store full tournament object for image access
							tournamentMap[tournamentId] = match;
						}
					} catch (err) {
						console.error(`[PopularTournaments] Error fetching ${league.name}:`, err);
					}
				}

				setTournaments(found);
				setTournamentData(tournamentMap);
			} catch (error) {
				console.error("[PopularTournaments] Error:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	if (loading) {
		return (
			<section className="py-16">
				<div className="container mx-auto px-4">
					<div className="mb-10 text-center">
						<h2 className="text-3xl font-bold mb-2">Popular</h2>
						<p className="text-muted-foreground">Major leagues and competitions worldwide</p>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
						{[...Array(6)].map((_, i) => (
							<Card key={i} className="relative h-64 border-0 shadow-md animate-pulse overflow-hidden">
								<div className="h-full w-full bg-muted" />
							</Card>
						))}
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="py-16 bg-muted/20">
			<div className="container mx-auto px-4">
				<div className="mb-10 text-center">
					<h2 className="text-3xl font-bold mb-2">Popular</h2>
					<p className="text-muted-foreground">Major leagues and competitions worldwide</p>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{popularLeagues.map((league) => {
						const tournamentId = tournaments[league.name];
						const href = tournamentId 
							? `/events?tournament_id=${encodeURIComponent(tournamentId)}`
							: `/events?sport_type=${league.sport}&query=${encodeURIComponent(league.search)}`;
						const tournament = tournamentId ? tournamentData[tournamentId] : null;
						// Map "soccer" to "football" for sport lookup (since sports table might use "football")
						const sportKey = league.sport === "soccer" ? "football" : league.sport.toLowerCase();
						const sport = sports[sportKey] || sports[league.sport.toLowerCase()];
						
						return (
							<Link key={league.name} href={href}>
								<Card className="group relative h-64 border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
									<Image
										src={getTournamentImage(tournamentId, tournament, league.sport, sport)}
										alt={league.name}
										fill
										className="object-cover transition-transform duration-500 group-hover:scale-110"
										sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/40" />
									<div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
										<h3 className="text-2xl font-bold">{league.name}</h3>
										<Button 
											variant="ghost" 
											size="lg" 
											className="w-fit text-white hover:text-white/90 hover:bg-white/10 self-end"
										>
											{tournamentId ? "View all tickets & events" : "View all available tickets"}
											<ArrowRight className="ml-2 w-4 h-4" />
										</Button>
									</div>
								</Card>
							</Link>
						);
					})}
				</div>
			</div>
		</section>
	);
}

