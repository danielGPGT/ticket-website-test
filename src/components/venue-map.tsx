"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";

type VenueMapProps = {
  venueId: string;
  eventId: string;
  categories: Array<{ category_id?: string; id?: string }>;
  className?: string;
};

export function VenueMap({ venueId, eventId, categories, className }: VenueMapProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const svgUrl = `https://cdn.xs2event.com/venues/${venueId}.svg`;

  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract category IDs from categories prop
  const categoryIds = categories
    .map((c) => String(c.category_id ?? c.id ?? ""))
    .filter(Boolean);

  // Track currently highlighted category to avoid redundant updates
  const currentHighlightedCategoryRef = useRef<string | null>(null);

  // Inject CSS styles and set up hover handlers
  useEffect(() => {
    if (!svgMarkup || !svgContainerRef.current) return;

    const container = svgContainerRef.current;
    const svgElement = container.querySelector("svg");
    if (!svgElement) return;

    // Inject CSS styles for venue map elements
    const styleId = `venue-map-styles-${eventId}`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      /* Venue Map Base Styles - Using CSS Variables */
      .soccerfield {
        fill: var(--success-500);
      }
      .svg-background {
        fill: none;
        stroke: var(--background);
      }
      .stadium-ring {
        fill: var(--base-500);
      }
      .svg-background-soccerstadiums {
        fill: var(--background);
      }
      .track-drive-bbox {
        stroke: none;
        fill: none;
      }
      .track-drive {
        stroke: var(--base-700);
        fill: none;
        stroke-width: 12.72px;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .track-border {
        stroke: var(--base-500);
        fill: none;
        stroke-width: 25.44px;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .track-overlay {
        stroke: var(--background);
        fill: none;
        stroke-width: 15.26px;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .starting-grid {
        stroke: var(--background);
        fill: none;
      }
      .curve-red {
        fill: var(--destructive-500);
      }
      .curve-grey {
        fill: var(--base-400);
      }
      .drive-arrow {
        fill: var(--warning-500);
      }
      .flag-white {
        fill: var(--background);
      }
      .flag-black {
        fill: var(--base-900);
      }
      .hide {
        fill: none;
        stroke: none;
      }
      .grandstand-legend,
      .grandstand {
        fill: var(--base-500);
      }
      .suite-legend,
      .suite {
        fill: var(--warning-200);
      }
      .unavailable {
        fill: var(--base-300);
      }
      .general-admission-legend,
      .general-admission {
        fill: var(--success-400);
      }
      
      /* Category highlighting */
      [data-venue-map-id="${eventId}"] .category-highlight {
        fill: var(--primary-500) !important;
        stroke: var(--primary-700) !important;
        stroke-width: 2px !important;
        opacity: 0.9 !important;
        transition: fill 0.2s ease, opacity 0.2s ease, stroke 0.2s ease !important;
        filter: brightness(1.1) drop-shadow(0 0 4px var(--primary-500)) !important;
      }
      [data-venue-map-id="${eventId}"] .category-highlight:hover {
        opacity: 1 !important;
        filter: brightness(1.2) drop-shadow(0 0 6px var(--primary-400)) !important;
      }
    `;

    // Set up hover handlers for ticket categories
    const highlightCategory = (categoryId: string) => {
      if (!categoryId) return;
      
      // Strip _ctg suffix if it exists (category ID might already include it)
      const baseCategoryId = categoryId.endsWith("_ctg") 
        ? categoryId.slice(0, -4) 
        : categoryId;
      
      // Category IDs in SVG are in format: {categoryId}_ctg and _{categoryId}_ctg
      const className1 = `${baseCategoryId}_ctg`;
      const className2 = `_${baseCategoryId}_ctg`;
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[VenueMap] Original categoryId: "${categoryId}"`);
        console.log(`[VenueMap] Base categoryId: "${baseCategoryId}"`);
        console.log(`[VenueMap] Searching for classes: "${className1}" or "${className2}"`);
      }
      
      // Find all SVG elements and check if they have the matching class
      const allElements = container.querySelectorAll("svg *");
      let matchCount = 0;
      
      allElements.forEach((el) => {
        const classList = el.classList;
        // Check for both class name formats (with and without leading underscore)
        if (classList.contains(className1) || classList.contains(className2)) {
          el.classList.add("category-highlight");
          matchCount++;
        }
      });
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[VenueMap] Found ${matchCount} matching elements for category ${baseCategoryId}`);
        if (matchCount === 0) {
          // Debug: show a sample of classes from the SVG
          const sampleElements = Array.from(allElements).slice(0, 5);
          sampleElements.forEach((el, idx) => {
            console.log(`[VenueMap] Sample element ${idx} classes:`, Array.from(el.classList));
          });
        }
      }
    };

    const clearHighlights = () => {
      container.querySelectorAll(".category-highlight").forEach((el) => {
        el.classList.remove("category-highlight");
      });
    };

    // Use event delegation to handle hover events from ticket category cards
    // Use mouseover/mouseout as they bubble (unlike mouseenter/mouseleave)
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Find the closest element with data-category-id attribute
      const cardElement = target.closest(`[data-event-id="${eventId}"][data-category-id]`) as HTMLElement;
      if (cardElement) {
        const categoryId = cardElement.getAttribute("data-category-id");
        if (categoryId && categoryId !== currentHighlightedCategoryRef.current) {
          currentHighlightedCategoryRef.current = categoryId;
          if (process.env.NODE_ENV === "development") {
            console.log("[VenueMap] Highlighting category:", categoryId);
          }
          highlightCategory(categoryId);
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const relatedTarget = e.relatedTarget as HTMLElement;
      // Check if we're leaving the card element (not just moving to a child)
      const cardElement = target.closest(`[data-event-id="${eventId}"][data-category-id]`) as HTMLElement;
      if (cardElement && (!relatedTarget || !cardElement.contains(relatedTarget))) {
        currentHighlightedCategoryRef.current = null;
        clearHighlights();
      }
    };

    // Use event delegation on the document (capture phase for better reliability)
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);

    // Log category cards for debugging
    if (process.env.NODE_ENV === "development") {
      const checkCards = () => {
        const categoryCards = document.querySelectorAll(`[data-event-id="${eventId}"][data-category-id]`);
        console.log(`[VenueMap] Found ${categoryCards.length} category cards for event ${eventId}`);
        categoryCards.forEach((card, idx) => {
          const catId = card.getAttribute("data-category-id");
          console.log(`[VenueMap] Card ${idx}: category-id="${catId}"`);
        });
      };
      checkCards();
      setTimeout(checkCards, 500);
      setTimeout(checkCards, 1000);
    }

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
      clearHighlights();
      currentHighlightedCategoryRef.current = null;
    };
  }, [svgMarkup, eventId, categoryIds]);

  useEffect(() => {
    let aborted = false;
    setError(null);
    setSvgMarkup(null);
    fetch(svgUrl, { cache: "force-cache" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const text = await res.text();
        if (!aborted) setSvgMarkup(text);
      })
      .catch((e) => {
        if (!aborted) setError(`Failed to load venue map (${String(e)})`);
      });
    return () => {
      aborted = true;
    };
  }, [venueId, svgUrl]);

  return (
    <Card className={className}> 
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[520px]">
          {error ? (
            <div className="p-6 text-sm text-muted-foreground">{error}</div>
          ) : svgMarkup ? (
            <div 
              ref={svgContainerRef}
              data-venue-map-id={eventId}
              className="p-2 sm:p-4 [color-scheme:light]" 
              dangerouslySetInnerHTML={{ __html: svgMarkup }} 
            />
          ) : (
            <div className="p-6 text-sm text-muted-foreground">Loading map…</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


