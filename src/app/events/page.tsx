"use client";

import { Suspense } from "react";
import { EventsExplorerEnhanced } from "@/components/events-explorer-enhanced";
import { SectionHeader } from "@/components/section-header";
import { EventsListSkeleton } from "@/components/events/event-card-skeleton";

function EventsExplorerWithSuspense() {
	return (
		<Suspense fallback={<EventsListSkeleton count={6} />}>
			<EventsExplorerEnhanced />
		</Suspense>
	);
}

export default function EventsPage() {
	return (
		<div className="container mx-auto px-4 py-8 lg:py-12 overflow-x-hidden">
			<SectionHeader
				title="Browse Events"
				subtitle="Discover tickets for your favorite sports and events"
				className="mb-8"
			/>
			<EventsExplorerWithSuspense />
		</div>
	);
}


