import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EventCardSkeleton() {
	return (
		<Card className="border py-0 border-border/50 shadow-sm">
			<CardContent className="p-0">
				<div className="flex flex-col sm:flex-row">
					{/* Left Section */}
					<div className="flex-1 p-4 sm:p-5 lg:p-6">
						<div className="space-y-2.5 sm:space-y-3">
							<div className="flex items-start gap-2.5 sm:gap-3">
								<Skeleton className="w-6 h-6 rounded" />
								<div className="flex-1 min-w-0 space-y-1">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-4 w-24" />
								</div>
							</div>
							<Skeleton className="h-5 w-3/4" />
							<div className="flex flex-wrap gap-1.5 sm:gap-2">
								<Skeleton className="h-5 w-20" />
								<Skeleton className="h-5 w-16" />
								<Skeleton className="h-5 w-24" />
							</div>
						</div>
					</div>

					{/* Right Section */}
					<div className="relative sm:w-56 lg:w-60 px-4 sm:px-5 lg:px-6 py-4 sm:py-5 border-t sm:border-t-0 sm:border-l border-border/30 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-center gap-3 sm:gap-3 bg-muted/30 sm:bg-transparent">
						<div className="flex flex-col items-start sm:items-center w-full space-y-2 sm:space-y-2">
							<div className="flex items-end justify-start sm:justify-between w-full gap-2">
								<div className="flex flex-col items-start">
									<Skeleton className="h-3 w-8 mb-1" />
									<Skeleton className="h-6 w-16" />
								</div>
								<Skeleton className="h-5 w-16 rounded-full" />
							</div>
							<Skeleton className="w-full h-9 rounded-md" />
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function EventsListSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="space-y-4">
			{Array.from({ length: count }).map((_, i) => (
				<EventCardSkeleton key={i} />
			))}
		</div>
	);
}

