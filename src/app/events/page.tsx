"use client";

import { EventsExplorerEnhanced } from "@/components/events-explorer-enhanced";
import { SectionHeader } from "@/components/section-header";

export default function EventsPage() {
	return (
		<div className="container mx-auto px-4 py-8 lg:py-12 overflow-x-hidden">
			<SectionHeader
				title="Browse Events"
				subtitle="Discover tickets for your favorite sports and events"
				className="mb-8"
			/>
			<EventsExplorerEnhanced />
		</div>
	);
}


