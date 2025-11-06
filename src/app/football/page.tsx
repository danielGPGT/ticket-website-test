import type { Metadata } from "next";
import { SportEventsLayout } from "@/components/sport-events-layout";

export const metadata: Metadata = {
	title: "Football Tickets | Buy Football Match Tickets Online | Apex Tickets",
	description: "Buy official football tickets for Premier League, Champions League, La Liga, Serie A, and international matches. Secure your football match tickets with Apex Tickets.",
	keywords: "football tickets, premier league tickets, champions league tickets, football match tickets, soccer tickets",
	openGraph: {
		title: "Football Tickets | Buy Football Match Tickets | Apex Tickets",
		description: "Buy official football tickets for Premier League, Champions League, and international matches. Secure your football match tickets with best prices.",
		type: "website",
	},
	alternates: {
		canonical: "/football",
	},
};

// Cache the sport index page to speed up initial loads
export const revalidate = 300;

export default function FootballPage() {
	return (
		<SportEventsLayout
			sportType="football"
			sportName="Football"
			description="Experience the passion of football live! Buy official football tickets for Premier League, Champions League, La Liga, Serie A, and international matches. From local derbies to World Cup qualifiers, secure your seat at the biggest football matches."
		/>
	);
}

