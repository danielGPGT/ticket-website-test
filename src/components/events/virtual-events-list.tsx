"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { EventCardHorizontal } from "@/components/event-card-horizontal";
import { EventCardSkeleton } from "./event-card-skeleton";
import type { FilterState } from "@/hooks/use-filters";

type VirtualEventsListProps = {
	events: any[];
	loading?: boolean;
	filters: FilterState;
	height?: number;
};

export function VirtualEventsList({ events, loading, filters, height = 800 }: VirtualEventsListProps) {
	const parentRef = useRef<HTMLDivElement>(null);

	const virtualizer = useVirtualizer({
		count: events.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 220, // Approximate height of each card
		overscan: 5,
	});

	if (loading && events.length === 0) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<EventCardSkeleton key={i} />
				))}
			</div>
		);
	}

	if (events.length === 0) {
		return null;
	}

	// Use virtual scrolling for very large lists (200+ items) for better performance
	// For smaller lists, regular rendering is more efficient
	if (events.length > 200) {
		const listHeight = Math.min(height, 600); // Max height for virtual list

		return (
			<div
				ref={parentRef}
				className="overflow-auto"
				style={{ height: listHeight, width: '100%' }}
			>
				<div
					style={{
						height: `${virtualizer.getTotalSize()}px`,
						width: '100%',
						position: 'relative',
					}}
				>
					{virtualizer.getVirtualItems().map((virtualItem) => {
						const e = events[virtualItem.index];
						if (!e) return null;

						const countryCode = e.iso_country ?? e.country ?? e.venue_country ?? e.location?.country ?? e.location?.iso_country ?? null;
						const timeStart = e.date_start_main_event ?? e.date_start;
						const timeEnd = e.date_stop_main_event ?? e.date_stop;

						return (
							<div
								key={virtualItem.key}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: `${virtualItem.size}px`,
									transform: `translateY(${virtualItem.start}px)`,
								}}
								className="pb-4"
							>
								<EventCardHorizontal
									id={String(e.id ?? e.event_id)}
									name={e.event_name ?? e.name ?? e.official_name ?? "Event"}
									date={e.date_start ?? e.date_start_main_event}
									dateEnd={e.date_stop ?? e.date_stop_main_event}
									timeStart={timeStart}
									timeEnd={timeEnd}
									venue={e.venue_name ?? e.venue}
									countryCode={countryCode}
									sportType={e.sport_type}
									tournamentName={e.tournament_name}
									city={e.city}
									minPrice={e.min_ticket_price_eur}
									maxPrice={e.max_ticket_price_eur}
									status={e.event_status as any}
									numberOfTickets={e.number_of_tickets}
									currency="£"
									isPopular={e.is_popular === true || e.popular === true}
								/>
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	// Regular rendering for smaller/medium lists (better UX, simpler)
	return (
		<div className="space-y-5">
			{events.map((e) => {
				const countryCode = e.iso_country ?? e.country ?? e.venue_country ?? e.location?.country ?? e.location?.iso_country ?? null;
				const timeStart = e.date_start_main_event ?? e.date_start;
				const timeEnd = e.date_stop_main_event ?? e.date_stop;

				return (
					<EventCardHorizontal
						key={e.id ?? e.event_id}
						id={String(e.id ?? e.event_id)}
						name={e.event_name ?? e.name ?? e.official_name ?? "Event"}
						date={e.date_start ?? e.date_start_main_event}
						dateEnd={e.date_stop ?? e.date_stop_main_event}
						timeStart={timeStart}
						timeEnd={timeEnd}
						venue={e.venue_name ?? e.venue}
						countryCode={countryCode}
						sportType={e.sport_type}
						tournamentName={e.tournament_name}
						city={e.city}
						minPrice={e.min_ticket_price_eur}
						maxPrice={e.max_ticket_price_eur}
						status={e.event_status as any}
						numberOfTickets={e.number_of_tickets}
						currency="£"
						isPopular={filters.popularEvents || e.is_popular === true || e.popular === true}
					/>
				);
			})}
		</div>
	);
}

