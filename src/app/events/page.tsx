"use client";

import { Suspense, useState, useEffect } from "react";
import { EventsExplorerEnhanced } from "@/components/events-explorer-enhanced";
import { SectionHeader } from "@/components/section-header";
import { EventsListSkeleton } from "@/components/events/event-card-skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { FiltersProvider, useFilters } from "@/hooks/use-filters";
import { useDebounce } from "@/hooks/use-debounce";

function EventsExplorerWithSuspense({ overrideQuery = "" }: { overrideQuery?: string }) {
	return (
		<Suspense fallback={<EventsListSkeleton count={6} />}>
			<EventsExplorerEnhanced overrideQuery={overrideQuery} />
		</Suspense>
	);
}

// Mobile search bar component - completely independent to avoid conflicts
function MobileSearchBar() {
	const { updateFilters } = useFilters();
	const [searchQuery, setSearchQuery] = useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 500);

	// Update filters when debounced search query changes - one way only, no sync back
	useEffect(() => {
		updateFilters({ query: debouncedSearchQuery });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedSearchQuery]);

	return (
		<div className="lg:hidden mb-6">
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search by name, venue..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-10 w-full"
				/>
			</div>
		</div>
	);
}

export default function EventsPage() {
	const [mobileQuery, setMobileQuery] = useState("");
	return (
		<Suspense fallback={<EventsListSkeleton count={6} />}>
			<FiltersProvider>
				<div className="container mx-auto px-4 py-8 lg:py-12 overflow-x-hidden">
					<SectionHeader
						title="Browse Events"
						subtitle="Discover tickets for your favorite sports and events"
						className="mb-8"
					/>
					<Suspense fallback={null}>
						<MobileSearchBarControlled value={mobileQuery} onChange={setMobileQuery} />
					</Suspense>
					<EventsExplorerWithSuspense overrideQuery={mobileQuery} />
				</div>
			</FiltersProvider>
		</Suspense>
	);
}

// Controlled variant to lift state for overrideQuery
function MobileSearchBarControlled({ value, onChange }: { value: string; onChange: (q: string) => void }) {
	const [, setLocal] = useState(value);
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


