"use client";

import { Suspense } from "react";
import { EventsExplorerEnhanced } from "@/components/events-explorer-enhanced";
import { SectionHeader } from "@/components/section-header";
import { Loader2 } from "lucide-react";

function EventsExplorerWithSuspense() {
	return (
		<Suspense fallback={
			<div className="flex items-center justify-center py-20">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		}>
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


