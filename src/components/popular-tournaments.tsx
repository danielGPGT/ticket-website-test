"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/section-header";
import { ArrowRight } from "lucide-react";
import { getSportImage } from "@/lib/images";

const popularLeagues = [
	{ name: "Formula 1", sport: "formula1", search: "formula 1" },
	{ name: "MotoGP", sport: "motogp", search: "motogp" },
	{ name: "Tennis", sport: "tennis", search: "tennis" },
	{ name: "Champions League", sport: "football", search: "champions league" },
	{ name: "Bundesliga", sport: "football", search: "bundesliga" },
	{ name: "Premier League", sport: "football", search: "premier league" },
];

export function PopularTournaments() {
	const [tournaments, setTournaments] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchTournaments = async () => {
			setLoading(true);
			try {
				const found: Record<string, string> = {};

				for (const league of popularLeagues) {
					try {
						const res = await fetch(`/api/xs2/tournaments?sport_type=${league.sport}&page_size=50`);
						const data = await res.json();
						const items = (data.tournaments ?? data.results ?? []) as any[];
						
						const match = items.find((t: any) => {
							const name = String(t.official_name ?? t.name ?? "").toLowerCase();
							return name.includes(league.search.toLowerCase());
						});
						
						if (match) {
							found[league.name] = match.tournament_id ?? match.id;
						}
					} catch (err) {
						console.error(`[PopularTournaments] Error fetching ${league.name}:`, err);
					}
				}

				setTournaments(found);
			} catch (error) {
				console.error("[PopularTournaments] Error:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchTournaments();
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
						const href = tournamentId 
							? `/events?tournament_id=${encodeURIComponent(tournamentId)}`
							: `/events?sport_type=${league.sport}&query=${encodeURIComponent(league.search)}`;
						
						return (
							<Link key={league.name} href={href}>
								<Card className="group relative h-48 sm:h-64 md:h-72 lg:h-80 border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
									<Image
										src={getSportImage(league.sport)}
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
						const href = tournamentId 
							? `/events?tournament_id=${encodeURIComponent(tournamentId)}`
							: `/events?sport_type=${league.sport}&query=${encodeURIComponent(league.search)}`;
						
						return (
							<Link key={league.name} href={href}>
								<Card className="group relative h-36 sm:h-44 md:h-48 lg:h-56 border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
									<Image
										src={getSportImage(league.sport)}
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

