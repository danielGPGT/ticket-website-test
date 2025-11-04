import type { Metadata } from "next";
import { SportEventsLayout } from "@/components/sport-events-layout";

export const metadata: Metadata = {
	title: "MotoGP Tickets | Buy MotoGP Race Tickets Online | Apex Tickets",
	description: "Buy official MotoGP tickets for all Grand Prix races worldwide. Secure your MotoGP race tickets with Apex Tickets. Best prices guaranteed for the fastest motorsport on two wheels.",
	keywords: "motogp tickets, motorcycle gp tickets, motogp race tickets, grand prix motorcycle tickets",
	openGraph: {
		title: "MotoGP Tickets | Buy MotoGP Race Tickets | Apex Tickets",
		description: "Buy official MotoGP tickets for all Grand Prix races worldwide. Secure your MotoGP race tickets with best prices guaranteed.",
		type: "website",
	},
	alternates: {
		canonical: "/motogp",
	},
};

export default function MotoGPPage() {
	return (
		<SportEventsLayout
			sportType="motogp"
			sportName="MotoGP"
			description="Experience the speed and excitement of MotoGP racing live! Buy official MotoGP tickets for Grand Prix races around the world. From the iconic circuits of Mugello to Silverstone, secure your spot at the world's premier motorcycle racing championship."
		/>
	);
}

