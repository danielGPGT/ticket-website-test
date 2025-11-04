"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { DollarSign } from "lucide-react";
import type { FilterState } from "@/hooks/use-filters";

type PriceFilterSectionProps = {
	filters: FilterState;
	priceRange: [number, number];
	priceRangeFromEvents: [number, number];
	onPriceChange: (min: number, max: number) => void;
};

export function PriceFilterSection({
	filters,
	priceRange,
	priceRangeFromEvents,
	onPriceChange,
}: PriceFilterSectionProps) {
	return (
		<div className="border-b border-border">
			<div className="flex items-center gap-2 py-3 px-0">
				<DollarSign className="w-4 h-4 text-muted-foreground" />
				<span className="text-sm font-medium text-foreground">Price</span>
			</div>
			<div className="pb-3 space-y-4">
				<Slider
					value={priceRange}
					onValueChange={(value) => {
						onPriceChange(value[0], value[1]);
					}}
					min={priceRangeFromEvents[0]}
					max={priceRangeFromEvents[1]}
					step={1}
					className="w-full"
				/>
				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-1">
						<Label htmlFor="priceMin" className="text-xs text-muted-foreground">
							Min
						</Label>
						<Input
							id="priceMin"
							type="number"
							value={priceRange[0]}
							onChange={(e) => {
								const val = parseInt(e.target.value) || priceRangeFromEvents[0];
								onPriceChange(val, priceRange[1]);
							}}
							className="w-full"
							min={priceRangeFromEvents[0]}
							max={priceRangeFromEvents[1]}
							step={1}
						/>
					</div>
					<div className="space-y-1">
						<Label htmlFor="priceMax" className="text-xs text-muted-foreground">
							Max
						</Label>
						<Input
							id="priceMax"
							type="number"
							value={priceRange[1]}
							onChange={(e) => {
								const val = parseInt(e.target.value) || priceRangeFromEvents[1];
								onPriceChange(priceRange[0], val);
							}}
							className="w-full"
							min={priceRangeFromEvents[0]}
							max={priceRangeFromEvents[1]}
							step={1}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

