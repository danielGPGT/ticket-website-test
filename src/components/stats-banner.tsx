"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Globe, Calendar, Trophy } from "lucide-react";

export function StatsBanner() {
	const [stats, setStats] = useState({
		events: 0,
		countries: 0,
		sports: 0,
		tournaments: 0,
	});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const today = new Date().toISOString().split("T")[0];
				const [eventsRes, countriesRes, sportsRes, tournamentsRes] = await Promise.all([
					fetch(`/api/xs2/events?date_stop=ge:${today}&page_size=1`),
					fetch("/api/xs2/countries?page_size=1"),
					fetch("/api/xs2/sports?page_size=1"),
					fetch("/api/xs2/tournaments?page_size=1"),
				]);

				const [eventsData, countriesData, sportsData, tournamentsData] = await Promise.all([
					eventsRes.json(),
					countriesRes.json(),
					sportsRes.json(),
					tournamentsRes.json(),
				]);

				const eventsPagination = eventsData.pagination;
				const countriesPagination = countriesData.pagination;
				const sportsPagination = sportsData.pagination;
				const tournamentsPagination = tournamentsData.pagination;

				setStats({
					events: eventsPagination?.total_size ?? 0,
					countries: countriesPagination?.total_size ?? 0,
					sports: sportsPagination?.total_size ?? 0,
					tournaments: tournamentsPagination?.total_size ?? 0,
				});
			} catch (error) {
				console.error("[StatsBanner] Error:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchStats();
	}, []);

	const formatNumber = (num: number) => {
		if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
		if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
		return num.toString();
	};

	const statItems = [
		{
			icon: Calendar,
			label: "Events Available",
			value: stats.events,
			color: "text-primary",
			bgColor: "bg-primary/10",
		},
		{
			icon: Globe,
			label: "Countries",
			value: stats.countries,
			color: "text-secondary",
			bgColor: "bg-secondary/10",
		},
		{
			icon: Trophy,
			label: "Tournaments",
			value: stats.tournaments,
			color: "text-blue-600",
			bgColor: "bg-blue-500/10",
		},
		{
			icon: TrendingUp,
			label: "Sports Categories",
			value: stats.sports,
			color: "text-green-600",
			bgColor: "bg-green-500/10",
		},
	];

	if (loading) {
		return (
			<section className="py-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
				<div className="container mx-auto px-4">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{[...Array(4)].map((_, i) => (
							<Card key={i} className="border-0 shadow-sm animate-pulse">
								<CardContent className="p-6">
									<div className="h-12 w-12 rounded-lg bg-muted mb-4" />
									<div className="h-8 bg-muted rounded w-20 mb-2" />
									<div className="h-4 bg-muted rounded w-32" />
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="py-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-y border-border/50">
			<div className="container mx-auto px-4">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
					{statItems.map((item, index) => {
						const Icon = item.icon;
						return (
							<Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-card/50 backdrop-blur-sm">
								<CardContent className="p-6 text-center">
									<div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${item.bgColor} ${item.color} mb-4`}>
										<Icon className="w-7 h-7" />
									</div>
									<div className={`text-3xl md:text-4xl font-bold ${item.color} mb-2`}>
										{loading ? "—" : formatNumber(item.value)}
									</div>
									<div className="text-sm text-muted-foreground font-medium">{item.label}</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</section>
	);
}

