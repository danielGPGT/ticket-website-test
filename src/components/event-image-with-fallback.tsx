"use client";

import { useState } from "react";
import Image from "next/image";
import { getEventImage, getSportImage } from "@/lib/images";

type EventImageWithFallbackProps = {
	eventId?: string;
	sportType?: string;
	event?: any;
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
 * Tries to load event-specific image first, falls back to sport image if event image doesn't exist.
 * Uses onError handler to seamlessly fallback to sport image.
 */
export function EventImageWithFallback({
	eventId,
	sportType,
	event,
	alt,
	fill = false,
	priority = false,
	className = "",
	sizes,
	style,
}: EventImageWithFallbackProps) {
	const sportImage = getSportImage(sportType);
	
	// Try multiple extensions for event image (.webp, .jpg, .png, .jpeg)
	const getEventImagePath = (ext: string) => {
		if (!eventId) return null;
		const normalizedId = String(eventId).toLowerCase().trim();
		return `/images/events/${normalizedId}.${ext}`;
	};

	const eventImagePaths = [
		getEventImagePath("webp"),
		getEventImagePath("jpg"),
		getEventImagePath("jpeg"),
		getEventImagePath("png"),
	].filter(Boolean) as string[];

	const [imageSrc, setImageSrc] = useState(eventImagePaths[0] || sportImage);
	const [currentPathIndex, setCurrentPathIndex] = useState(0);
	const [hasError, setHasError] = useState(false);

	const handleError = () => {
		// Try next extension if available
		if (currentPathIndex < eventImagePaths.length - 1) {
			const nextIndex = currentPathIndex + 1;
			setCurrentPathIndex(nextIndex);
			setImageSrc(eventImagePaths[nextIndex]);
		} else {
			// All extensions failed, fallback to sport image
			if (!hasError && sportImage && imageSrc !== sportImage) {
				setHasError(true);
				setImageSrc(sportImage);
			}
		}
	};

	// Use sport image if no event paths, or if we've already errored
	const finalSrc = (hasError || eventImagePaths.length === 0 || imageSrc === sportImage) 
		? sportImage 
		: imageSrc;

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

