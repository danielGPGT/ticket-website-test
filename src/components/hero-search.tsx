"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hero Search Component
 * 
 * Premium search bar for the hero section with icon and smooth interactions.
 */
export function HeroSearch() {
	const [query, setQuery] = useState("");
	const router = useRouter();

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (query.trim()) {
			router.push(`/events?query=${encodeURIComponent(query.trim())}`);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="w-full max-w-2xl">
			<div className="relative group">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60 group-focus-within:text-white transition-colors duration-200" />
				<Input
					type="search"
					placeholder="Search for events, teams, venues..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className={cn(
						"w-full h-12 sm:h-14 pl-6 pr-28 rounded-xl",
						"bg-white/10 backdrop-blur-md border-white/20",
						"text-white placeholder:text-white/60",
						"focus-visible:bg-white/15 focus-visible:border-white/30",
						"hover:bg-white/12 transition-all duration-200",
						"shadow-lg shadow-black/20"
					)}
				/>
				<Button
					type="submit"
					size="lg"
					className={cn(
						"absolute right-2 top-1/2 -translate-y-1/2",
						"h-9 sm:h-10 px-4 sm:px-6",
						"bg-primary hover:bg-primary/90",
						"shadow-md hover:shadow-lg",
						"transition-all duration-200"
					)}
				>
					<span className="hidden sm:inline">Search</span>
					<Search className="sm:hidden w-4 h-4" />
				</Button>
			</div>
		</form>
	);
}

