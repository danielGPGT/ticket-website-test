"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Activity } from "lucide-react";
import type { FilterState } from "@/hooks/use-filters";

type FilterOption = {
	value: string;
	label: string;
	count?: number;
};

type SportFilterSectionProps = {
	filters: FilterState;
	options: FilterOption[];
	loading: boolean;
	onToggle: (value: string) => void;
};

export function SportFilterSection({
	filters,
	options,
	loading,
	onToggle,
}: SportFilterSectionProps) {
	return (
		<div className="border-b border-border">
			<div className="flex items-center gap-2 py-3 px-0">
				<Activity className="w-4 h-4 text-muted-foreground" />
				<span className="text-sm font-medium text-foreground">Sport</span>
			</div>
			<div className="pb-3 space-y-2">
				{loading ? (
					<div className="text-sm text-muted-foreground py-2">Loading...</div>
				) : options.length === 0 ? (
					<div className="text-sm text-muted-foreground py-2">No sports found</div>
				) : (
					options.map((s) => (
						<label
							key={s.value}
							className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1.5 -mx-2"
						>
							<Checkbox
								checked={filters.sportType.includes(s.value)}
								onCheckedChange={() => onToggle(s.value)}
							/>
							<span className="text-sm flex-1">{s.label}</span>
							{s.count !== undefined && (
								<span className="text-xs text-muted-foreground">({s.count})</span>
							)}
						</label>
					))
				)}
			</div>
		</div>
	);
}

