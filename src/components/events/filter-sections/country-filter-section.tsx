"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Globe } from "lucide-react";
import { CountryFlag } from "@/components/country-flag";
import type { FilterState } from "@/hooks/use-filters";

type FilterOption = {
	value: string;
	label: string;
	count?: number;
};

type CountryFilterSectionProps = {
	filters: FilterState;
	options: FilterOption[];
	loading: boolean;
	onToggle: (value: string) => void;
};

export function CountryFilterSection({
	filters,
	options,
	loading,
	onToggle,
}: CountryFilterSectionProps) {
	return (
		<div className="border-b border-border">
			<div className="flex items-center gap-2 py-3 px-0">
				<Globe className="w-4 h-4 text-muted-foreground" />
				<span className="text-sm font-medium text-foreground">Country</span>
			</div>
			<div className="pb-3 space-y-2">
				{loading ? (
					<div className="text-sm text-muted-foreground py-2">Loading...</div>
				) : options.length === 0 ? (
					<div className="text-sm text-muted-foreground py-2">No countries found</div>
				) : (
					options.map((c) => (
						<label
							key={c.value}
							className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 rounded px-2 py-1.5 -mx-2"
						>
							<Checkbox
								checked={filters.countryCode.includes(c.value)}
								onCheckedChange={() => onToggle(c.value)}
							/>
							<div className="flex items-center gap-2 flex-1">
								<CountryFlag countryCode={c.value} size={16} className="shrink-0" />
								<span className="text-sm flex-1">{c.label}</span>
								{c.count !== undefined && (
									<span className="text-xs text-muted-foreground">({c.count})</span>
								)}
							</div>
						</label>
					))
				)}
			</div>
		</div>
	);
}

