"use client";

import { Suspense } from "react";
import { EventsExplorerEnhanced } from "@/components/events-explorer-enhanced";
import { SectionHeader } from "@/components/section-header";
import { Loader2 } from "lucide-react";

type SportEventsLayoutProps = {
	sportType: string;
	sportName: string;
	description: string;
};

function SportEventsContent({ sportType, sportName, description }: SportEventsLayoutProps) {
	return (
		<div className="container mx-auto px-4 py-8 lg:py-12 overflow-x-hidden">
			{/* Hero Section */}
			<div className="mb-8">
				<SectionHeader
					title={`${sportName} Tickets`}
					subtitle={description}
					className="mb-0"
				/>
			</div>
			<EventsExplorerEnhanced hiddenFilters={["sport"]} />
		</div>
	);
}

export function SportEventsLayout({ sportType, sportName, description }: SportEventsLayoutProps) {
	return (
		<Suspense fallback={
			<div className="flex items-center justify-center py-20">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		}>
			<SportEventsContent sportType={sportType} sportName={sportName} description={description} />
		</Suspense>
	);
}

