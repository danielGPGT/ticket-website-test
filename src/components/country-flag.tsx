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
	
	// Check if className contains width/height classes (responsive sizing)
	const hasWidth = className.includes('w-');
	const hasHeight = className.includes('h-');
	const hasResponsiveSizing = hasWidth || hasHeight;
	
	// Calculate rectangular dimensions (3:2 aspect ratio for flags - wider than tall)
	const flagWidth = hasResponsiveSizing ? undefined : size * 1.5;
	const flagHeight = hasResponsiveSizing ? undefined : size;
	
	// Remove height classes if both width and height are provided (to prevent square)
	// The aspect-ratio will maintain the rectangle shape based on width
	let processedClassName = className;
	if (hasWidth && hasHeight) {
		// Remove height classes to allow aspect-ratio to control height based on width
		processedClassName = className.replace(/\bh-\d+/g, '').replace(/\bsm:h-\d+/g, '').replace(/\bmd:h-\d+/g, '').replace(/\blg:h-\d+/g, '').replace(/\bxl:h-\d+/g, '').trim();
	}
	
	// Always enforce 3:2 aspect ratio for rectangular flags
	const inlineStyle: React.CSSProperties = hasResponsiveSizing 
		? { 
				objectFit: "cover", 
				flexShrink: 0, 
				aspectRatio: "3/2"
			}
		: { 
				objectFit: "cover", 
				width: `${flagWidth}px`, 
				height: `${flagHeight}px`,
				flexShrink: 0,
			};
	
	return (
		<img
			src={flagPath}
			alt={countryName}
			width={flagWidth}
			height={flagHeight}
			className={`rounded shadow-md aspect-[3/2] ${processedClassName}`}
			style={inlineStyle}
			loading="lazy"
			onError={(e) => {
				// Fallback: hide image if flag file doesn't exist
				(e.target as HTMLImageElement).style.display = "none";
			}}
		/>
	);
}

