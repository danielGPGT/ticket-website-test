import type { Metadata } from "next";
import { SportEventsLayout } from "@/components/sport-events-layout";

export const metadata: Metadata = {
	title: "Formula 1 Tickets | Buy F1 Grand Prix Race Tickets Online | Apex Tickets",
	description: "Buy official Formula 1 tickets for all Grand Prix races worldwide. Secure your F1 race tickets with Apex Tickets. Best prices guaranteed, official tickets only.",
	keywords: "formula 1 tickets, f1 tickets, grand prix tickets, f1 race tickets, formula one tickets",
	openGraph: {
		title: "Formula 1 Tickets | Buy F1 Grand Prix Race Tickets | Apex Tickets",
		description: "Buy official Formula 1 tickets for all Grand Prix races. Secure your F1 race tickets with best prices guaranteed.",
		type: "website",
	},
	alternates: {
		canonical: "/formula-1",
	},
};

// Cache the sport index page to speed up initial loads
export const revalidate = 300;

export default function Formula1Page() {
	return (
		<SportEventsLayout
			sportType="formula1"
			sportName="Formula 1"
			description="Experience the thrill of Formula 1 racing live! Buy official F1 Grand Prix tickets for races around the world. From Monaco to Silverstone, secure your spot at the world's most prestigious motorsport events."
		/>
	);
}

