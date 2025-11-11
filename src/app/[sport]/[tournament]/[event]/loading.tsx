import { Skeleton } from "@/components/ui/skeleton";

export default function EventPageLoading() {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<section className="relative h-[320px] w-full overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/60 to-transparent animate-pulse" />
				<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
				<div className="relative container mx-auto flex h-full flex-col justify-end gap-4 px-4 pb-8 sm:px-6">
					<div className="flex flex-wrap gap-3">
						<Skeleton className="h-6 w-28 rounded-full bg-white/20" />
						<Skeleton className="h-6 w-20 rounded-full bg-white/10" />
					</div>
					<Skeleton className="h-12 w-full max-w-3xl bg-white/30" />
					<div className="flex flex-wrap gap-3 text-white">
						<Skeleton className="h-4 w-48 bg-white/20" />
						<Skeleton className="h-4 w-36 bg-white/15" />
						<Skeleton className="h-4 w-28 bg-white/10" />
					</div>
				</div>
			</section>

			<main className="container mx-auto flex-1 px-4 py-8 sm:px-6">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
					<div className="space-y-8 lg:col-span-3">
						<div className="space-y-4">
							<Skeleton className="h-6 w-56" />
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-2/3" />
						</div>

						<div className="space-y-5">
							{Array.from({ length: 3 }).map((_, idx) => (
								<div key={idx} className="rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm">
									<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
										<Skeleton className="h-5 w-44" />
										<div className="flex items-center gap-2">
											<Skeleton className="h-4 w-20 rounded-full" />
											<Skeleton className="h-4 w-16 rounded-full" />
										</div>
									</div>
									<div className="mt-4 space-y-3">
										{Array.from({ length: 2 }).map((__, ticketIdx) => (
											<div
												key={ticketIdx}
												className="flex flex-col gap-4 rounded-lg bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between"
											>
												<div className="space-y-2">
													<Skeleton className="h-4 w-40" />
													<Skeleton className="h-3 w-56" />
												</div>
												<div className="flex w-full items-center justify-between gap-3 sm:w-auto">
													<Skeleton className="h-4 w-20" />
													<Skeleton className="h-10 w-32" />
												</div>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>

					<aside className="space-y-6 lg:col-span-2">
						<div className="rounded-xl border border-border/60 bg-card/40 p-5 shadow-sm">
							<div className="space-y-3">
								<Skeleton className="h-5 w-40" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-4 w-2/3" />
							</div>
							<div className="mt-6 grid gap-3">
								{Array.from({ length: 4 }).map((_, iconIdx) => (
									<div key={iconIdx} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
										<Skeleton className="h-10 w-10 rounded-lg" />
										<div className="space-y-2">
											<Skeleton className="h-4 w-36" />
											<Skeleton className="h-3 w-24" />
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="rounded-xl border border-border/60 bg-card/40 p-5 shadow-sm">
							<Skeleton className="mb-4 h-5 w-44" />
							<Skeleton className="h-[260px] w-full rounded-lg" />
						</div>
					</aside>
				</div>
			</main>
		</div>
	);
}

