"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { getSportImage } from "@/lib/images";

const popularLeagues = [
	{ name: "Formula 1", sport: "formula1", search: "formula 1" },
	{ name: "La Liga", sport: "football", search: "la liga" },
	{ name: "Rugby", sport: "rugby", search: "rugby" },
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
						
						return (
							<Link key={league.name} href={href}>
								<Card className="group relative h-64 border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
									<Image
										src={getSportImage(league.sport)}
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

