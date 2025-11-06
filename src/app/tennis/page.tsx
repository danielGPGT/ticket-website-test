import type { Metadata } from "next";
import { SportEventsLayout } from "@/components/sport-events-layout";

export const metadata: Metadata = {
	title: "Tennis Tickets | Buy Tennis Match Tickets Online | Apex Tickets",
	description: "Buy official tennis tickets for Wimbledon, US Open, French Open, Australian Open, and ATP/WTA tournaments worldwide. Secure your tennis match tickets with Apex Tickets.",
	keywords: "tennis tickets, wimbledon tickets, us open tickets, tennis match tickets, atp tickets, wta tickets",
	openGraph: {
		title: "Tennis Tickets | Buy Tennis Match Tickets | Apex Tickets",
		description: "Buy official tennis tickets for Grand Slams and tournaments worldwide. Secure your tennis match tickets with best prices.",
		type: "website",
	},
	alternates: {
		canonical: "/tennis",
	},
};

// Cache the sport index page to speed up initial loads
export const revalidate = 300;

export default function TennisPage() {
	return (
		<SportEventsLayout
			sportType="tennis"
			sportName="Tennis"
			description="Watch the world's best tennis players compete live! Buy official tennis tickets for Grand Slam tournaments, ATP, and WTA events. From Wimbledon to the US Open, experience the excitement of professional tennis."
		/>
	);
}

