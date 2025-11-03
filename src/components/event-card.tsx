"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountryFlag } from "@/components/country-flag";

type Props = {
	id: string;
	name: string;
	date?: string;
	venue?: string;
	countryCode?: string | null;
};

export function EventCard({ id, name, date, venue, countryCode }: Props) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg flex items-center gap-2">
					<CountryFlag countryCode={countryCode} size={20} className="flex-shrink-0" />
					<span className="flex-1">{name}</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{date && <div className="text-sm text-muted-foreground">{date}</div>}
				{venue && <div className="text-sm">{venue}</div>}
				<Link href={`/events/${id}`}>
					<Button className="mt-2" variant="default">View Tickets</Button>
				</Link>
			</CardContent>
		</Card>
	);
}


