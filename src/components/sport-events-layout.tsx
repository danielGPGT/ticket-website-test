"use client";

import { Suspense, useState, useEffect } from "react";
import { EventsExplorerEnhanced } from "@/components/events-explorer-enhanced";
import { SectionHeader } from "@/components/section-header";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { FiltersProvider, useFilters } from "@/hooks/use-filters";

type SportEventsLayoutProps = {
	sportType: string;
	sportName: string;
	description: string;
};

// Mobile search bar component - same as events page
function MobileSearchBarControlled({ value, onChange }: { value: string; onChange: (q: string) => void }) {
	const debounced = useDebounce(value, 500);
	const { updateFilters } = useFilters();
	useEffect(() => {
		// Push debounced value into the shared filters store
		updateFilters({ query: debounced });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debounced]);
	return (
		<div className="lg:hidden mb-6">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search by name, venue..."
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="pl-10 w-full bg-card"
				/>
			</div>
		</div>
	);
}

function SportEventsContent({ sportType, sportName, description }: SportEventsLayoutProps) {
	const [mobileQuery, setMobileQuery] = useState("");
	
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
			<Suspense fallback={null}>
				<MobileSearchBarControlled value={mobileQuery} onChange={setMobileQuery} />
			</Suspense>
			<EventsExplorerEnhanced hiddenFilters={["sport"]} overrideQuery={mobileQuery} />
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
			<FiltersProvider>
				<SportEventsContent sportType={sportType} sportName={sportName} description={description} />
			</FiltersProvider>
		</Suspense>
	);
}

