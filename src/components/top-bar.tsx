"use client";

import { useState } from "react";
import { Check, Star, Globe } from "lucide-react";
import Link from "next/link";
import { CountryFlag } from "@/components/country-flag";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

/**
 * Top Bar Component
 * 
 * Thin information bar displayed above the main site header.
 * Shows trust indicators, ratings, and quick links.
 */
export function TopBar() {
	const [currency, setCurrency] = useState("GBP");

	return (
		<div className="bg-foreground text-background border-b border-border/10">
			<div className="mx-auto container px-4">
				<div className="flex items-center justify-between gap-4 py-2 text-xs sm:text-sm">
					{/* Left side - Trust indicators */}
					<div className="hidden md:flex items-center gap-4 lg:gap-6 flex-wrap">
						<div className="flex items-center gap-1.5">
							<Check className="w-3.5 h-3.5 text-primary shrink-0" />
							<span className="whitespace-nowrap">Official tickets</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Check className="w-3.5 h-3.5 text-primary shrink-0" />
							<span className="whitespace-nowrap">Dedicated service</span>
						</div>
						<div className="flex items-center gap-1.5">
							<Check className="w-3.5 h-3.5 text-primary shrink-0" />
							<span className="whitespace-nowrap">Secure booking</span>
						</div>
					</div>

					{/* Mobile - Simplified trust indicator */}
					<div className="flex items-center gap-2 md:hidden">
						<Check className="w-3.5 h-3.5 text-primary shrink-0" />
						<span>Verified tickets</span>
					</div>

					

					{/* Right side - Links, Currency, and Language */}
					<div className="flex items-center gap-3 lg:gap-4 ml-auto">
						<Link 
							href="/about" 
							className="hidden sm:inline-block hover:text-primary transition-colors whitespace-nowrap"
						>
							About us
						</Link>

						<Link 
							href="/blog" 
							className="hidden lg:inline-block hover:text-primary transition-colors whitespace-nowrap"
						>
							Blog
						</Link>
						<Link 
							href="/contact" 
							className="hidden sm:inline-block hover:text-primary transition-colors whitespace-nowrap"
						>
							Contact
						</Link>
						


						{/* Language Selector */}
						<button className="flex items-center gap-1.5 hover:text-primary transition-colors">
							<CountryFlag iso2="GB" size={14} />
							<span className="hidden sm:inline whitespace-nowrap">EN-GB</span>
						</button>
						{/* Currency Selector */}
						<Select value={currency} onValueChange={setCurrency}>
							<SelectTrigger 
								size="sm"
								className="!h-auto !py-0 !px-2 text-xs sm:text-sm bg-transparent border-none hover:border-background/40 text-background focus:ring-background/20 data-[placeholder]:text-background/80 [&>span]:!py-0 [&>span]:!leading-none"
							>
								<SelectValue placeholder="Currency" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="GBP">GBP</SelectItem>
								<SelectItem value="EUR">EUR</SelectItem>
								<SelectItem value="AUD">AUD</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>
		</div>
	);
}

