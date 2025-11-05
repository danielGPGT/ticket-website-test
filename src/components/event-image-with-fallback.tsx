"use client";

import { useState } from "react";
import Image from "next/image";
import { getEventImage, getSportImage } from "@/lib/images";

type EventImageWithFallbackProps = {
	eventId?: string;
	sportType?: string;
	event?: any;
	tournament?: any;
	sport?: any;
	alt: string;
	fill?: boolean;
	priority?: boolean;
	className?: string;
	sizes?: string;
	style?: React.CSSProperties;
};

/**
 * EventImageWithFallback Component
 * 
 * Tries to load event-specific image first, falls back to tournament image, then sport image.
 * Uses onError handler to seamlessly fallback to sport image.
 * 
 * Priority:
 * 1. Event database image column (Supabase Storage URL)
 * 2. API-provided image URL (legacy)
 * 3. Tournament image (if tournament_id is available)
 * 4. Sport-specific image (fallback)
 */
export function EventImageWithFallback({
	eventId,
	sportType,
	event,
	tournament,
	sport,
	alt,
	fill = false,
	priority = false,
	className = "",
	sizes,
	style,
}: EventImageWithFallbackProps) {
	const sportImage = getSportImage(sportType, sport);
	
	// Get the primary event image (handles Supabase Storage, API URLs, tournament fallback)
	const primaryEventImage = getEventImage(eventId, sportType, event, tournament, sport);
	
	// Determine if it's an external URL (Supabase Storage or API) or local path
	const isExternalUrl = primaryEventImage.startsWith("http://") || primaryEventImage.startsWith("https://");
	const isLocalPath = primaryEventImage.startsWith("/images/");
	
	// For local paths (like sport images), use them directly
	// For external URLs, use them directly
	// If we have a local event path (which shouldn't happen now), skip it
	const initialSrc = isExternalUrl || isLocalPath 
		? primaryEventImage 
		: sportImage; // Fallback to sport image if we got something unexpected

	const [imageSrc, setImageSrc] = useState(initialSrc);
	const [hasError, setHasError] = useState(false);

	const handleError = () => {
		// On any error, fallback to sport image
		if (!hasError && sportImage && imageSrc !== sportImage) {
			setHasError(true);
			setImageSrc(sportImage);
		}
	};

	// Use sport image if we've errored, otherwise use the current image source
	const finalSrc = (hasError && sportImage) ? sportImage : imageSrc;

	if (fill) {
		return (
			<Image
				src={finalSrc}
				alt={alt}
				fill
				className={className}
				priority={priority}
				sizes={sizes}
				onError={handleError}
				style={{ objectPosition: 'center 80%', ...style }}
			/>
		);
	}

	return (
		<Image
			src={finalSrc}
			alt={alt}
			className={className}
			priority={priority}
			sizes={sizes}
			onError={handleError}
		/>
	);
}

