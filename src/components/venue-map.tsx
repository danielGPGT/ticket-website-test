"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/section-header";
import { X } from "lucide-react";

type CategoryInfo = {
  category_id?: string;
  id?: string;
  category_name?: string;
  name?: string;
};

type VenueMapProps = {
  venueId: string;
  eventId: string;
  categories: CategoryInfo[];
  tickets?: Array<{ category_id?: string; stock?: number; quantity?: number }>;
  className?: string;
};

export function VenueMap({ venueId, eventId, categories, tickets = [], className }: VenueMapProps) {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const svgUrl = `https://cdn.xs2event.com/venues/${venueId}.svg`;

  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Click card state for SVG clicks
  const [clickedCategories, setClickedCategories] = useState<CategoryInfo[]>([]);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const isCardOpenRef = useRef(false);

  // Extract category IDs from categories prop
  const categoryIds = categories
    .map((c) => String(c.category_id ?? c.id ?? ""))
    .filter(Boolean);
  
  // Create a set of category IDs that have tickets with stock > 0
  const categoriesWithTickets = new Set<string>();
  tickets.forEach((ticket) => {
    const categoryId = String(ticket.category_id ?? "");
    if (categoryId) {
      const stock = Number(ticket.stock ?? ticket.quantity ?? 0);
      if (stock > 0) {
        categoriesWithTickets.add(categoryId);
      }
    }
  });

  // Create a map of category ID to category info for quick lookup
  // Store both with and without _ctg suffix for matching
  const categoryMap = new Map<string, CategoryInfo>();
  categories.forEach((c) => {
    const id = String(c.category_id ?? c.id ?? "");
    if (id) {
      categoryMap.set(id, c);
      // Also store without _ctg if it has it, and with _ctg if it doesn't
      if (id.endsWith("_ctg")) {
        const baseId = id.slice(0, -4);
        categoryMap.set(baseId, c);
      } else {
        categoryMap.set(`${id}_ctg`, c);
      }
    }
  });
  

  // Track currently highlighted category to avoid redundant updates
  const currentHighlightedCategoryRef = useRef<string | null>(null);
  const currentHoveredSvgElementRef = useRef<Element | null>(null);
  
  // Function to scroll to and open accordion for a category
  const scrollToCategory = useCallback((categoryId: string) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[VenueMap] scrollToCategory called for category:", categoryId);
      console.log("[VenueMap] Using eventId:", eventId);
    }
    
    // Normalize categoryId - remove _ctg suffix if present, as data-category-id might not have it
    const normalizedCategoryId = categoryId.endsWith("_ctg") 
      ? categoryId.slice(0, -4) 
      : categoryId;
    
    // Function to find the card - try multiple times in case DOM hasn't loaded yet
    const findCategoryCard = (): HTMLElement | null => {
      // Try both with and without _ctg suffix
      let card = document.querySelector(
        `[data-event-id="${eventId}"][data-category-id="${normalizedCategoryId}"]`
      ) as HTMLElement;
      
      if (!card) {
        // Try with original categoryId (in case it's stored with _ctg)
        card = document.querySelector(
          `[data-event-id="${eventId}"][data-category-id="${categoryId}"]`
        ) as HTMLElement;
      }
      
      // Try without eventId filter as fallback
      if (!card) {
        card = document.querySelector(
          `[data-category-id="${normalizedCategoryId}"]`
        ) as HTMLElement;
      }
      
      if (!card) {
        card = document.querySelector(
          `[data-category-id="${categoryId}"]`
        ) as HTMLElement;
      }
      
      return card;
    };
    
    // Function to process the found category card
    const processCategoryCard = (card: HTMLElement) => {
      if (process.env.NODE_ENV === "development") {
        console.log("[VenueMap] Category card found:", card);
        console.log("[VenueMap] Used categoryId:", card.getAttribute("data-category-id"));
      }
      // Structure: CategoryType AccordionItem > AccordionContent (p-2 pb-0) > Inner Accordion > AccordionItem > Card
      // Strategy: Find the AccordionContent with class "p-2 pb-0" that contains this card,
      // then go up one level to find the category type AccordionItem
      let categoryTypeAccordionItem: HTMLElement | null = null;
      
      // Find the AccordionContent wrapper (has class "p-2 pb-0") that contains the inner Accordion
      let current: HTMLElement | null = card;
      if (process.env.NODE_ENV === "development") {
        console.log("[VenueMap] Searching for AccordionContent with classes p-2 pb-0...");
      }
      
      while (current && current !== document.body) {
        // Check if this element is the AccordionContent wrapper (has the specific class)
        if (current.classList && current.classList.contains('p-2') && current.classList.contains('pb-0')) {
          if (process.env.NODE_ENV === "development") {
            console.log("[VenueMap] Found AccordionContent element:", current);
          }
          // Found the AccordionContent! Now go up one level to find the category type AccordionItem
          if (current.parentElement && current.parentElement.hasAttribute('data-state')) {
            categoryTypeAccordionItem = current.parentElement as HTMLElement;
            if (process.env.NODE_ENV === "development") {
              const trigger = categoryTypeAccordionItem.querySelector('button[type="button"], [role="button"]');
              console.log("[VenueMap] ✓ Found category type accordion via AccordionContent:", trigger?.textContent?.trim());
            }
            break;
          } else {
            if (process.env.NODE_ENV === "development") {
              console.log("[VenueMap] AccordionContent found but parent doesn't have data-state");
            }
          }
        }
        current = current.parentElement;
      }
      
      // Fallback: If we didn't find it via AccordionContent, try the previous method
      if (!categoryTypeAccordionItem) {
        if (process.env.NODE_ENV === "development") {
          console.log("[VenueMap] AccordionContent method failed, trying fallback method...");
        }
        const categoryAccordionItem = card.closest('[data-state]') as HTMLElement;
        if (categoryAccordionItem) {
          if (process.env.NODE_ENV === "development") {
            console.log("[VenueMap] Found category accordion item:", categoryAccordionItem);
          }
          current = categoryAccordionItem.parentElement;
          while (current && current !== document.body) {
            if (current.hasAttribute('data-state')) {
              const trigger = current.querySelector('button[type="button"], [role="button"]');
              if (trigger) {
                const triggerText = trigger.textContent || '';
                if (process.env.NODE_ENV === "development") {
                  console.log("[VenueMap] Checking element:", triggerText.trim(), "has 'per person':", triggerText.includes('per person'));
                }
                if (triggerText.includes('per person') && current !== categoryAccordionItem) {
                  categoryTypeAccordionItem = current;
                  if (process.env.NODE_ENV === "development") {
                    console.log("[VenueMap] ✓ Found category type accordion via fallback:", triggerText.trim());
                  }
                  break;
                }
              }
            }
            current = current.parentElement;
          }
        }
      }
      
      if (!categoryTypeAccordionItem && process.env.NODE_ENV === "development") {
        console.log("[VenueMap] Could not find category type accordion for category:", categoryId);
        console.log("[VenueMap] Category card:", card);
        console.log("[VenueMap] Category card parent:", card.parentElement);
      }
      
      // Open the category type accordion if it's closed
      if (categoryTypeAccordionItem) {
        const isTypeOpen = categoryTypeAccordionItem.getAttribute("data-state") === "open";
        if (!isTypeOpen) {
          const typeTrigger = categoryTypeAccordionItem.querySelector(
            'button[type="button"], [role="button"]'
          ) as HTMLElement;
          if (typeTrigger) {
            if (process.env.NODE_ENV === "development") {
              console.log("[VenueMap] Opening category type accordion:", typeTrigger.textContent);
            }
            // Open the category type accordion first
            setTimeout(() => {
              typeTrigger.click();
            }, 200);
          }
        } else {
          if (process.env.NODE_ENV === "development") {
            console.log("[VenueMap] Category type accordion already open");
          }
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log("[VenueMap] Could not find category type accordion");
        }
      }
      
      // Then open the category accordion itself
      // Find the AccordionItem inside the Card (not the category type one)
      let categoryAccordionItem: HTMLElement | null = null;
      
      // Find the AccordionItem inside the Card
      const accordionItem = card.querySelector('[data-state]') as HTMLElement;
      if (accordionItem) {
        const trigger = accordionItem.querySelector('button[type="button"], [role="button"]');
        if (trigger) {
          const text = trigger.textContent || '';
          // Category accordions don't have "per person"
          if (!text.includes('per person')) {
            categoryAccordionItem = accordionItem;
          }
        }
      }
      
      // Fallback: if not found, look for AccordionItem by finding the button inside Card
      if (!categoryAccordionItem) {
        const trigger = card.querySelector('button[type="button"], [role="button"]');
        if (trigger) {
          const text = trigger.textContent || '';
          if (!text.includes('per person')) {
            let parent = trigger.parentElement;
            while (parent && parent !== card) {
              if (parent.hasAttribute('data-state')) {
                categoryAccordionItem = parent as HTMLElement;
                break;
              }
              parent = parent.parentElement;
            }
          }
        }
      }
      
      if (categoryAccordionItem) {
        const isOpen = categoryAccordionItem.getAttribute("data-state") === "open";
        
        if (!isOpen) {
          // Find the accordion trigger button and click it to open
          const trigger = categoryAccordionItem.querySelector(
            'button[type="button"], [role="button"]'
          ) as HTMLElement;
          
          if (trigger) {
            if (process.env.NODE_ENV === "development") {
              console.log("[VenueMap] Opening category accordion:", trigger.textContent);
            }
            // Small delay to ensure category type accordion opens first and scroll happens
            setTimeout(() => {
              trigger.click();
            }, 400);
          }
        } else {
          if (process.env.NODE_ENV === "development") {
            console.log("[VenueMap] Category accordion already open");
          }
        }
      } else {
        // Fallback: try to find any button in the card
        const trigger = card.querySelector(
          'button'
        ) as HTMLElement;
        if (trigger) {
          setTimeout(() => trigger.click(), 400);
        }
      }
      
      // Close the card
      isCardOpenRef.current = false;
      setIsCardOpen(false);
    };
    
    let categoryCard = findCategoryCard();
    
    // If not found, wait a bit and try again (DOM might still be loading)
    if (!categoryCard) {
      if (process.env.NODE_ENV === "development") {
        // Debug: show all category cards to see what IDs are actually in the DOM
        console.log("[VenueMap] Category card NOT found. Searched for:", normalizedCategoryId, "or", categoryId);
        
        // Try without eventId filter first
        const allCardsAnyEvent = document.querySelectorAll(`[data-category-id]`);
        console.log("[VenueMap] Total category cards (any event):", allCardsAnyEvent.length);
        
        // Try with eventId
        const allCards = document.querySelectorAll(`[data-event-id="${eventId}"][data-category-id]`);
        console.log("[VenueMap] Total category cards (with eventId):", allCards.length);
        
        // Show sample of what's in the DOM
        if (allCardsAnyEvent.length > 0) {
          console.log("[VenueMap] Sample category cards (first 5):");
          Array.from(allCardsAnyEvent).slice(0, 5).forEach((card, idx) => {
            const cardEventId = card.getAttribute("data-event-id");
            const cardCategoryId = card.getAttribute("data-category-id");
            console.log(`[VenueMap] Card ${idx}: eventId="${cardEventId}", categoryId="${cardCategoryId}"`);
          });
        } else {
          console.log("[VenueMap] No category cards found at all in the DOM!");
          console.log("[VenueMap] Checking if tickets section exists...");
          const ticketsSection = document.querySelector('[id="tickets"]');
          console.log("[VenueMap] Tickets section found:", !!ticketsSection);
        }
      }
      
      // Retry multiple times with increasing delays (accordions might need to be opened first)
      const retryAttempts = [300, 600, 1000];
      retryAttempts.forEach((delay, index) => {
        setTimeout(() => {
          const retryCard = findCategoryCard();
          if (retryCard) {
            if (process.env.NODE_ENV === "development") {
              console.log(`[VenueMap] Category card found on retry attempt ${index + 1} after ${delay}ms`);
            }
            processCategoryCard(retryCard);
          } else if (process.env.NODE_ENV === "development" && index === retryAttempts.length - 1) {
            // Last attempt failed - try to find and open the specific category type accordion
            // First, find which category type this categoryId belongs to from the categories prop
            const category = categories.find((c: CategoryInfo) => {
              const cId = String(c.category_id ?? c.id ?? "");
              return cId === normalizedCategoryId || cId === categoryId || 
                     cId === categoryId.replace("_ctg", "") || 
                     cId === normalizedCategoryId.replace("_ctg", "");
            });
            
            if (category) {
              // Get the category type from the category object
              const categoryType = (category as any).category_type?.toLowerCase() || "other";
              console.log(`[VenueMap] Category belongs to type: "${categoryType}"`);
              
              // Find category type accordion by looking for the label text
              // The labels are: "Grandstands", "Hospitality", etc.
              const labelMap: Record<string, string> = {
                grandstand: "Grandstands",
                hospitality: "Hospitality",
                generaladmission: "General Admission",
                camping: "Camping",
                carparking: "Car Parking",
                busparking: "Bus Parking",
                transfer: "Transfers",
                extras: "Extras",
                offsite_hospitality: "Offsite Hospitality",
                other: "Other",
              };
              const labelText = labelMap[categoryType] || categoryType;
              
              // Helper function to open the category accordion
              const openCategoryAccordion = (card: HTMLElement) => {
                // Find the AccordionItem inside the Card
                let categoryAccordionItem: HTMLElement | null = null;
                
                const accordionItem = card.querySelector('[data-state]') as HTMLElement;
                if (accordionItem) {
                  const trigger = accordionItem.querySelector('button[type="button"], [role="button"]');
                  if (trigger) {
                    const text = trigger.textContent || '';
                    if (!text.includes('per person')) {
                      categoryAccordionItem = accordionItem;
                      if (process.env.NODE_ENV === "development") {
                        console.log(`[VenueMap] Found category accordion item:`, text.trim());
                      }
                    }
                  }
                }
                
                // Fallback: if not found, look for AccordionItem by finding the button inside Card
                if (!categoryAccordionItem) {
                  const trigger = card.querySelector('button[type="button"], [role="button"]');
                  if (trigger) {
                    const text = trigger.textContent || '';
                    if (!text.includes('per person')) {
                      let parent = trigger.parentElement;
                      while (parent && parent !== card) {
                        if (parent.hasAttribute('data-state')) {
                          categoryAccordionItem = parent as HTMLElement;
                          if (process.env.NODE_ENV === "development") {
                            console.log(`[VenueMap] Found category accordion item via trigger:`, text.trim());
                          }
                          break;
                        }
                        parent = parent.parentElement;
                      }
                    }
                  }
                }
                
                if (categoryAccordionItem) {
                  const trigger = categoryAccordionItem.querySelector('button[type="button"], [role="button"]') as HTMLElement;
                  if (trigger) {
                    const currentState = categoryAccordionItem.getAttribute("data-state");
                    if (process.env.NODE_ENV === "development") {
                      console.log(`[VenueMap] Opening category accordion (state: ${currentState})...`);
                    }
                    trigger.click();
                    setTimeout(() => {
                      processCategoryCard(card);
                    }, 300);
                  } else {
                    if (process.env.NODE_ENV === "development") {
                      console.log(`[VenueMap] Could not find category accordion trigger`);
                    }
                    processCategoryCard(card);
                  }
                } else {
                  if (process.env.NODE_ENV === "development") {
                    console.log(`[VenueMap] Could not find category accordion item`);
                  }
                  processCategoryCard(card);
                }
              };
              
              // Find all accordion items with "per person" text (category type accordions)
              const allCategoryTypeItems = Array.from(document.querySelectorAll('[data-state]')).filter((item) => {
                const trigger = item.querySelector('button[type="button"], [role="button"]');
                if (trigger) {
                  const text = trigger.textContent || '';
                  return text.includes('per person');
                }
                return false;
              }) as HTMLElement[];
              
              console.log(`[VenueMap] Found ${allCategoryTypeItems.length} category type accordions`);
              
              // Find the one that matches the label text
              let targetAccordion: HTMLElement | null = null;
              for (const item of allCategoryTypeItems) {
                const trigger = item.querySelector('button[type="button"], [role="button"]');
                if (trigger) {
                  const text = trigger.textContent || '';
                  if (text.includes(labelText)) {
                    targetAccordion = item;
                    console.log(`[VenueMap] Found matching category type accordion: "${labelText}"`);
                    break;
                  }
                }
              }
              
              if (targetAccordion) {
                const isOpen = targetAccordion.getAttribute("data-state") === "open";
                if (!isOpen) {
                  const trigger = targetAccordion.querySelector('button[type="button"], [role="button"]') as HTMLElement;
                  if (trigger) {
                    console.log(`[VenueMap] Opening category type accordion: "${labelText}"`);
                    trigger.click();
                    
                    // Wait for accordion to open, then check for card and open category accordion
                    setTimeout(() => {
                      const card = findCategoryCard();
                      if (card) {
                        console.log(`[VenueMap] ✓ Category card found after opening category type accordion!`);
                        openCategoryAccordion(card);
                      } else {
                        console.log("[VenueMap] Card still not found after opening category type accordion");
                        // Try again after a longer delay
                        setTimeout(() => {
                          const retryCard = findCategoryCard();
                          if (retryCard) {
                            console.log(`[VenueMap] ✓ Category card found on second retry!`);
                            openCategoryAccordion(retryCard);
                          } else {
                            console.log("[VenueMap] Card still not found after second retry");
                          }
                        }, 500);
                      }
                    }, 400);
                  }
                } else {
                  // Category type accordion is already open - just find and open the category accordion
                  console.log(`[VenueMap] Category type accordion "${labelText}" already open, finding category accordion...`);
                  const card = findCategoryCard();
                  if (card) {
                    openCategoryAccordion(card);
                  } else {
                    // Retry after a short delay - card might not be in DOM yet
                    setTimeout(() => {
                      const retryCard = findCategoryCard();
                      if (retryCard) {
                        console.log(`[VenueMap] ✓ Category card found on retry!`);
                        openCategoryAccordion(retryCard);
                      }
                    }, 200);
                  }
                }
              } else {
                console.log(`[VenueMap] Could not find category type accordion with label "${labelText}"`);
                // Debug: show all category type accordions
                allCategoryTypeItems.forEach((item, idx) => {
                  const trigger = item.querySelector('button[type="button"], [role="button"]');
                  console.log(`[VenueMap] Category type accordion ${idx}:`, trigger?.textContent?.trim());
                });
              }
            } else {
              console.log("[VenueMap] Could not find category in categories prop");
            }
          }
        }, delay);
      });
      return;
    }
    
    // Process the category card
    processCategoryCard(categoryCard);
  }, [eventId]);

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
      
      /* SVG hover highlighting */
      [data-venue-map-id="${eventId}"] .svg-hover-highlight {
        fill: var(--primary-400) !important;
        stroke: var(--primary-600) !important;
        stroke-width: 2px !important;
        opacity: 0.85 !important;
        transition: fill 0.15s ease, opacity 0.15s ease, stroke 0.15s ease !important;
        filter: brightness(1.15) drop-shadow(0 0 3px var(--primary-400)) !important;
        cursor: pointer !important;
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
      
      // Find all SVG elements and check if they have the matching class
      const allElements = container.querySelectorAll("svg *");
      
      allElements.forEach((el) => {
        const classList = el.classList;
        // Check for both class name formats (with and without leading underscore)
        if (classList.contains(className1) || classList.contains(className2)) {
          el.classList.add("category-highlight");
        }
      });
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

    // Find categories matching an SVG element's classes (including parent elements)
    const findCategoriesForElement = (element: Element): CategoryInfo[] => {
      const foundCategories: CategoryInfo[] = [];
      const seenIds = new Set<string>();
      
      // Check the element and all its parents up to the SVG root
      let current: Element | null = element;
      const elementsToCheck: Element[] = [];
      
      while (current && current !== svgElement && current !== container) {
        elementsToCheck.push(current);
        current = current.parentElement;
      }
      
      // Check all collected elements
      for (const el of elementsToCheck) {
        const classList = Array.from(el.classList);
        
        // Check each class to see if it matches a category ID
        for (const className of classList) {
          // Category classes are in format: {categoryId}_ctg or _{categoryId}_ctg
          let categoryId: string | null = null;
          let baseId: string | null = null;
          
          if (className.endsWith("_ctg")) {
            // Remove _ctg suffix
            baseId = className.replace(/_ctg$/, "");
            // Remove leading underscore if present
            categoryId = baseId.startsWith("_") ? baseId.slice(1) : baseId;
          }
          
          // Try multiple matching strategies
          const possibleIds = [
            categoryId,
            baseId,
            className,
            categoryId ? `${categoryId}_ctg` : null,
            baseId ? `${baseId}_ctg` : null,
          ].filter(Boolean) as string[];
          
          for (const testId of possibleIds) {
            if (categoryMap.has(testId)) {
              const category = categoryMap.get(testId)!;
              const originalId = String(category.category_id ?? category.id ?? "");
              
              // Avoid duplicates using Set
              if (!seenIds.has(originalId)) {
                seenIds.add(originalId);
                // Only include categories that have tickets with stock > 0
                if (categoriesWithTickets.has(originalId)) {
                  foundCategories.push(category);
                }
              }
            }
          }
        }
      }
      
      return foundCategories;
    };

    // Highlight SVG element on hover
    const highlightSvgElement = (element: Element) => {
      // Clear previous highlight
      if (currentHoveredSvgElementRef.current) {
        currentHoveredSvgElementRef.current.classList.remove("svg-hover-highlight");
      }
      
      // Add highlight to current element and all its parent elements up to SVG root
      let current: Element | null = element;
      while (current && current !== svgElement && current !== container) {
        current.classList.add("svg-hover-highlight");
        current = current.parentElement;
      }
      
      currentHoveredSvgElementRef.current = element;
    };

    const clearSvgHoverHighlight = () => {
      if (currentHoveredSvgElementRef.current) {
        // Clear from element and all parents
        let current: Element | null = currentHoveredSvgElementRef.current;
        while (current && current !== svgElement && current !== container) {
          current.classList.remove("svg-hover-highlight");
          current = current.parentElement;
        }
        currentHoveredSvgElementRef.current = null;
      }
    };

    // Hover handler for SVG elements
    const handleSvgMouseOver = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target || !container.contains(target)) return;
      
      // Don't highlight if hovering over a category card (to avoid conflicts)
      const cardElement = (target as HTMLElement).closest(`[data-event-id="${eventId}"][data-category-id]`);
      if (cardElement) {
        clearSvgHoverHighlight();
        return;
      }
      
      // Skip if it's a text element or other non-path elements
      if (target.tagName === "text" || target.tagName === "title") return;
      
      // Only highlight if the element has categories with available tickets
      const categories = findCategoriesForElement(target);
      if (categories.length > 0) {
        // Highlight the SVG element
        highlightSvgElement(target);
      } else {
        // Clear highlight if no categories with tickets
        clearSvgHoverHighlight();
      }
    };

    const handleSvgMouseOut = (e: MouseEvent) => {
      const target = e.target as Element;
      const relatedTarget = e.relatedTarget as Element;
      if (!target || !container.contains(target)) return;
      
      // Don't clear if moving to a child element
      if (relatedTarget && container.contains(relatedTarget)) {
        return;
      }
      
      clearSvgHoverHighlight();
    };

    // Click handler - show card on SVG click
    const handleSvgClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target || !container.contains(target)) return;
      
      // Don't show card if clicking on a category card (to avoid conflicts)
      const cardElement = (target as HTMLElement).closest(`[data-event-id="${eventId}"][data-category-id]`);
      if (cardElement) {
        return;
      }
      
      // Skip if it's a text element or other non-path elements
      if (target.tagName === "text" || target.tagName === "title") return;
      
      const categories = findCategoriesForElement(target);
      if (categories.length > 0) {
        // CRITICAL: Stop ALL propagation immediately
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();
        
        // Set ref FIRST (synchronous) - this prevents any other handlers from closing it
        isCardOpenRef.current = true;
        
        // Update state immediately
        setClickedCategories(categories);
        setCardPosition({ x: e.clientX, y: e.clientY });
        setIsCardOpen(true);
      }
    };

    // Add event listeners
    // SVG hover handlers for highlighting
    container.addEventListener("mouseover", handleSvgMouseOver, true);
    container.addEventListener("mouseout", handleSvgMouseOut, true);
    // SVG click handler - use capture phase to run FIRST and stop propagation
    container.addEventListener("click", handleSvgClick, true);


    // Use event delegation on the document (capture phase for better reliability)
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
      container.removeEventListener("mouseover", handleSvgMouseOver, true);
      container.removeEventListener("mouseout", handleSvgMouseOut, true);
      container.removeEventListener("click", handleSvgClick, true);
      clearHighlights();
      clearSvgHoverHighlight();
      currentHighlightedCategoryRef.current = null;
      // Don't reset card state here - it causes the card to close when dependencies change
      // Only reset on actual unmount
    };
  }, [svgMarkup, eventId, categoryIds, categoryMap, scrollToCategory]);
  
  // Separate effect to clean up on unmount only
  useEffect(() => {
    return () => {
      isCardOpenRef.current = false;
      setIsCardOpen(false);
    };
  }, []);

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
    <>
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
      
      {/* Category card for showing categories on SVG click */}
      {isCardOpen && clickedCategories.length > 0 && (
        <Card
          ref={cardRef}
          className="fixed z-50 w-80 max-w-[calc(100vw-2rem)] pointer-events-auto shadow-lg"
          style={{
            left: `${cardPosition.x}px`,
            top: `${cardPosition.y}px`,
            transform: "translate(-50%, calc(-100% - 12px))",
          }}
          onClick={(e) => {
            // Prevent card clicks from bubbling to document
            e.stopPropagation();
          }}
        >
          <CardContent className="">
            <div className="space-y-4">
              {/* Header with close button */}
              <div className="flex items-start justify-between gap-3 pb-2 border-b">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">
                    Available Categories
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {clickedCategories.length} {clickedCategories.length === 1 ? "category" : "categories"} available
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={() => {
                    isCardOpenRef.current = false;
                    setIsCardOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Category list */}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {clickedCategories.map((category) => {
                  const categoryId = String(category.category_id ?? category.id ?? "");
                  const categoryName = String(
                    category.category_name ?? category.name ?? "Category"
                  );
                  return (
                    <Button
                      key={categoryId}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2.5 px-3 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                      onClick={() => scrollToCategory(categoryId)}
                    >
                      <span className="text-sm font-medium">{categoryName}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}


