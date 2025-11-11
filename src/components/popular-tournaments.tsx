"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/section-header";
import { ArrowRight } from "lucide-react";
import { getSportImage, getTournamentImage } from "@/lib/images";
import { buildSportPath, buildTournamentPath } from "@/lib/seo";
import { getSportPath } from "@/lib/sport-routes";

const popularLeagues = [
	{ name: "Formula 1", sport: "formula1", search: "formula 1" },
	{ name: "MotoGP", sport: "motogp", search: "motogp" },
	{ name: "Tennis", sport: "tennis", search: "tennis" },
	{ name: "Champions League", sport: "soccer", search: "champions league" }, // Database uses "soccer"
	{ name: "Bundesliga", sport: "soccer", search: "bundesliga" }, // Database uses "soccer"
	{ name: "Premier League", sport: "soccer", search: "premier league" }, // Database uses "soccer"
];

export function PopularTournaments() {
	const [tournaments, setTournaments] = useState<Record<string, string>>({});
	const [tournamentData, setTournamentData] = useState<Record<string, any>>({});
	const [sports, setSports] = useState<Record<string, any>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				// Helper: fetch with timeout to avoid long hangs
				const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit, timeoutMs = 8000) => {
					const controller = new AbortController();
					const id = setTimeout(() => controller.abort(), timeoutMs);
					return fetch(input, { ...(init || {}), signal: controller.signal })
						.finally(() => clearTimeout(id));
				};

				// Fire sports and all tournament requests in parallel
				const sportsPromise = fetchWithTimeout("/api/xs2/sports");
				const tournamentFetchPromises = popularLeagues.map((league) =>
					fetchWithTimeout(`/api/xs2/tournaments?sport_type=${league.sport}&page_size=50`)
				);

				const results = await Promise.allSettled([sportsPromise, ...tournamentFetchPromises]);

				// Process sports
				if (results[0].status === "fulfilled") {
					try {
						const sportsRes = results[0].value as Response;
						const sportsData = await sportsRes.json();
						const sportsArray = (sportsData.sports ?? sportsData.results ?? []) as any[];
						const sportsMap: Record<string, any> = {};
						sportsArray.forEach((sport: any) => {
							const key = sport.sport_id?.toLowerCase() || "";
							sportsMap[key] = sport;
						});
						setSports(sportsMap);
					} catch (e) {
						console.error("[PopularTournaments] Error parsing sports:", e);
					}
				} else {
					console.error("[PopularTournaments] Sports fetch failed:", results[0].reason);
				}

				// Process tournaments by league, mapping index
				const found: Record<string, string> = {};
				const tournamentMap: Record<string, any> = {};
				const now = new Date();

				// Process all tournaments in parallel and await completion
				const tournamentPromises: Promise<{ leagueName: string; tournamentId: string; tournament: any } | null>[] = popularLeagues.map(async (league, idx) => {
					const resIdx = idx + 1; // offset by sports
					const entry = results[resIdx];
					if (entry.status !== "fulfilled") {
						console.error(`[PopularTournaments] ${league.name} fetch failed:`, entry.reason);
						return null;
					}
					
					try {
						const res = entry.value as Response;
						const data = await res.json();
						const items = (data.tournaments ?? data.results ?? []) as any[];

						const searchLower = league.search.toLowerCase();
						const matches = items.filter((t: any) => {
							const name = String(t.official_name ?? t.name ?? "").toLowerCase();
							return name.includes(searchLower);
						});

						matches.sort((a: any, b: any) => {
							const aName = String(a.official_name ?? a.name ?? "").toLowerCase();
							const bName = String(b.official_name ?? b.name ?? "").toLowerCase();

							const aExact = aName === searchLower;
							const bExact = bName === searchLower;
							if (aExact && !bExact) return -1;
							if (!aExact && bExact) return 1;

							const aDateStart = a.date_start ? new Date(a.date_start) : null;
							const aDateStop = a.date_stop ? new Date(a.date_stop) : null;
							const bDateStart = b.date_start ? new Date(b.date_start) : null;
							const bDateStop = b.date_stop ? new Date(b.date_stop) : null;

							const aIsCurrent = aDateStart && ((aDateStart <= now && (!aDateStop || aDateStop >= now)) || (aDateStart >= now));
							const bIsCurrent = bDateStart && ((bDateStart <= now && (!bDateStop || bDateStop >= now)) || (bDateStart >= now));
							if (aIsCurrent && !bIsCurrent) return -1;
							if (!aIsCurrent && bIsCurrent) return 1;

							if (aIsCurrent && bIsCurrent && aDateStart && bDateStart) {
								const aIsActive = aDateStart <= now && (!aDateStop || aDateStop >= now);
								const bIsActive = bDateStart <= now && (!bDateStop || bDateStop >= now);
								if (aIsActive && !bIsActive) return -1;
								if (!aIsActive && bIsActive) return 1;
								const aDiff = Math.abs(aDateStart.getTime() - now.getTime());
								const bDiff = Math.abs(bDateStart.getTime() - now.getTime());
								return aDiff - bDiff;
							}

							const aHasImage = !!a.image;
							const bHasImage = !!b.image;
							if (aHasImage && !bHasImage) return -1;
							if (!aHasImage && bHasImage) return 1;

							return aName.length - bName.length;
						});

						const match = matches[0];
						if (match) {
							const tournamentId = match.tournament_id ?? match.id;
							return { leagueName: league.name, tournamentId, tournament: match };
						}
						return null;
					} catch (err) {
						console.error(`[PopularTournaments] Error processing ${league.name}:`, err);
						return null;
					}
				});

				// Wait for all tournament processing to complete
				const tournamentResults = await Promise.all(tournamentPromises);
				
				// Populate maps with results
				tournamentResults.forEach((result) => {
					if (result) {
						found[result.leagueName] = result.tournamentId;
						tournamentMap[result.tournamentId] = result.tournament;
					}
				});

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
			<section className="py-12 sm:py-16">
				<div className="container mx-auto px-4">
					<SectionHeader
						title="Popular"
						subtitle="Major leagues and competitions worldwide"
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
						{[...Array(2)].map((_, i) => (
							<Card key={i} className="relative h-48 sm:h-64 md:h-80 border-0 shadow-md animate-pulse overflow-hidden">
								<div className="h-full w-full bg-muted" />
							</Card>
						))}
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6">
						{[...Array(4)].map((_, i) => (
							<Card key={i} className="relative h-36 sm:h-44 md:h-48 lg:h-56 border-0 shadow-md animate-pulse overflow-hidden">
								<div className="h-full w-full bg-muted" />
							</Card>
						))}
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="py-12 sm:py-16 bg-muted/20">
			<div className="container mx-auto px-4">
				<SectionHeader
					title="Popular"
					subtitle="Major leagues and competitions worldwide"
				/>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
					{/* First two cards - larger */}
					{popularLeagues.slice(0, 2).map((league) => {
						const tournamentId = tournaments[league.name];
						const tournament = tournamentId ? tournamentData[tournamentId] : null;
						const rawSportId = (tournament?.sport_type ?? league.sport ?? "").toLowerCase();
						const normalizedSportId = rawSportId === "soccer" ? "football" : rawSportId;
						const fallbackSportPath = buildSportPath(normalizedSportId || league.sport);
						const sportPath = (getSportPath(normalizedSportId) ?? fallbackSportPath) || fallbackSportPath;
						const sportSlug = sportPath.replace(/^\//, "");
						const tournamentSlug = tournament?.slug?.toLowerCase?.();
						const href =
							tournamentSlug && sportSlug
								? buildTournamentPath(sportSlug, tournamentSlug)
								: sportPath;

						// Map "soccer" to "football" for sport lookup (since sports table might use "football")
						const sportKey = league.sport === "soccer" ? "football" : league.sport.toLowerCase();
						const sport = sports[sportKey] || sports[league.sport.toLowerCase()];
						const imageUrl = getTournamentImage(tournamentId, tournament, league.sport, sport);
						
						// Debug: Log image URL generation
						if (process.env.NODE_ENV === "development") {
							console.log(`[PopularTournaments] Image for ${league.name}:`, {
								tournamentId,
								hasTournament: !!tournament,
								tournamentImage: tournament?.image,
								finalImageUrl: imageUrl,
							});
						}
						
						return (
							<Link key={league.name} href={href}>
								<Card className="group relative h-48 sm:h-64 md:h-72 lg:h-80 border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
									<Image
										src={imageUrl}
										alt={league.name}
										fill
										className="object-cover transition-transform duration-500 group-hover:scale-110"
										sizes="(max-width: 640px) 100vw, 50vw"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/40" />
									<div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-5 md:p-6 text-white">
										<h3 className="text-lg sm:text-xl md:text-2xl font-bold">{league.name}</h3>
										<Button 
											variant="ghost" 
											size="lg" 
											className="w-fit text-white hover:text-white/90 hover:bg-white/10 self-end text-xs sm:text-sm md:text-base px-3 sm:px-4 md:px-6 h-8 sm:h-9 md:h-10"
										>
											<span className="hidden sm:inline">{tournamentId ? "View all tickets & events" : "View all available tickets"}</span>
											<span className="sm:hidden">View tickets</span>
											<ArrowRight className="ml-1.5 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
										</Button>
									</div>
								</Card>
							</Link>
						);
					})}
				</div>
				{/* Next four cards - smaller */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mt-4 sm:mt-5 md:mt-6">
					{popularLeagues.slice(2).map((league) => {
						const tournamentId = tournaments[league.name];
						const tournament = tournamentId ? tournamentData[tournamentId] : null;
						const rawSportId = (tournament?.sport_type ?? league.sport ?? "").toLowerCase();
						const normalizedSportId = rawSportId === "soccer" ? "football" : rawSportId;
						const fallbackSportPath = buildSportPath(normalizedSportId || league.sport);
						const sportPath = (getSportPath(normalizedSportId) ?? fallbackSportPath) || fallbackSportPath;
						const sportSlug = sportPath.replace(/^\//, "");
						const tournamentSlug = tournament?.slug?.toLowerCase?.();
						const href =
							tournamentSlug && sportSlug
								? buildTournamentPath(sportSlug, tournamentSlug)
								: sportPath;
						// Map "soccer" to "football" for sport lookup (since sports table might use "football")
						const sportKey = league.sport === "soccer" ? "football" : league.sport.toLowerCase();
						const sport = sports[sportKey] || sports[league.sport.toLowerCase()];
						
						return (
							<Link key={league.name} href={href}>
								<Card className="group relative h-36 sm:h-44 md:h-48 lg:h-56 border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
									<Image
										src={getTournamentImage(tournamentId, tournament, league.sport, sport)}
										alt={league.name}
										fill
										className="object-cover transition-transform duration-500 group-hover:scale-110"
										sizes="(max-width: 640px) 50vw, 25vw"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/40" />
									<div className="absolute inset-0 flex flex-col justify-between p-3 sm:p-4 md:p-5 lg:p-6 text-white">
										<h3 className="text-sm sm:text-base md:text-lg font-bold leading-tight">{league.name}</h3>
										<Button 
											variant="ghost" 
											size="sm" 
											className="w-fit text-white hover:text-white/90 hover:bg-white/10 self-end text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 h-6 sm:h-7 md:h-8"
										>
											<span className="hidden sm:inline">View tickets</span>
											<span className="sm:hidden">View</span>
											<ArrowRight className="ml-1 sm:ml-1.5 md:ml-2 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
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

