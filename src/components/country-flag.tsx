"use client";

import { iso3ToIso2 } from "@/lib/country-flags";

type CountryFlagProps = {
	/** ISO 3166-1 alpha-3 country code (e.g., "USA", "GBR") */
	countryCode?: string | null;
	/** ISO 3166-1 alpha-2 country code (e.g., "US", "GB") - used directly if provided */
	iso2?: string | null;
	/** Size of the flag in pixels */
	size?: number;
	/** Additional CSS classes */
	className?: string;
	/** Alt text for accessibility */
	alt?: string;
};

/**
 * CountryFlag Component
 * 
 * Renders a country flag as an SVG image from public/images/country-flags/
 * Supports both ISO3 and ISO2 country codes.
 */
export function CountryFlag({ 
	countryCode, 
	iso2, 
	size = 24, 
	className = "",
	alt 
}: CountryFlagProps) {
	// Convert ISO3 to ISO2 if needed
	const code = iso2 ?? iso3ToIso2(countryCode);
	
	if (!code) {
		return null;
	}
	
	const flagPath = `/images/country-flags/${code.toLowerCase()}.svg`;
	const countryName = alt ?? `Flag of ${code}`;
	
	return (
		<img
			src={flagPath}
			alt={countryName}
			width={size}
			height={size}
			className={`rounded-full border ${className}`}
			style={{
				objectFit: "cover",
				width: `${size}px`,
				height: `${size}px`,
				flexShrink: 0,
			}}
			loading="lazy"
			onError={(e) => {
				// Fallback: hide image if flag file doesn't exist
				(e.target as HTMLImageElement).style.display = "none";
			}}
		/>
	);
}

