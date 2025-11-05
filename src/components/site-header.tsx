"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger,
	NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ShoppingCart, User, Menu, Search, ChevronRight, Calendar, Users, Trophy } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { Badge } from "@/components/ui/badge";

const staticSports = [
	{ href: "/formula-1", label: "Formula 1", id: "formula1" },
	{ href: "/football", label: "Football", id: "football" },
	{ href: "/motogp", label: "MotoGP", id: "motogp" },
	{ href: "/tennis", label: "Tennis", id: "tennis" },
];

const countryNameMap: Record<string, string> = {
	GBR: "United Kingdom",
	ESP: "Spain",
	ITA: "Italy",
	DEU: "Germany",
	FRA: "France",
	NLD: "Netherlands",
	SCO: "Scotland",
	PRT: "Portugal",
	AUT: "Austria",
	BEL: "Belgium",
	DNK: "Denmark",
	SWE: "Sweden",
	NOR: "Norway",
	IRL: "Ireland",
	POL: "Poland",
	TUR: "Turkey",
	USA: "United States",
	CAN: "Canada",
	AUS: "Australia",
	JPN: "Japan",
	AND: "Andorra",
};

import { iso3ToIso2 } from "@/lib/country-flags";
import { CountryFlag } from "@/components/country-flag";

function formatCountryName(code: string): string {
	return countryNameMap[code.toUpperCase()] ?? code;
}

export function SiteHeader() {
	const pathname = usePathname();
	const router = useRouter();
	const [query, setQuery] = useState("");
	const cartItems = useCartStore((s) => s.items);
	const cartItemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
	const [fetchedSports, setFetchedSports] = useState<string[]>([]);
	const [footballCountries, setFootballCountries] = useState<string[]>([]);
	const [activeFootballCountry, setActiveFootballCountry] = useState<string | null>(null);
	const [countryTeams, setCountryTeams] = useState<Record<string, any[]>>({});
	const [countryTournaments, setCountryTournaments] = useState<Record<string, any[]>>({});
	const [countryLoading, setCountryLoading] = useState(false);
	const [activeOtherSport, setActiveOtherSport] = useState<string | null>(null);
	const [otherSportEvents, setOtherSportEvents] = useState<Record<string, any[]>>({});
	const [otherSportLoading, setOtherSportLoading] = useState(false);
	// Tennis state
	const [tennisTournaments, setTennisTournaments] = useState<any[]>([]);
	const [activeTennisTournament, setActiveTennisTournament] = useState<string | null>(null);
	const [tennisEventsByTournament, setTennisEventsByTournament] = useState<Record<string, any[]>>({});
	const [tennisLoading, setTennisLoading] = useState(false);
	// Mobile navigation state
	const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

	// Reset expanded states when mobile menu closes
	useEffect(() => {
		if (!mobileMenuOpen) {
			setMobileExpanded({});
		}
	}, [mobileMenuOpen]);

	// Auto-focus search input when mobile search opens
	useEffect(() => {
		if (mobileSearchOpen) {
			// Small delay to ensure Sheet is fully rendered
			const timer = setTimeout(() => {
				const input = document.querySelector('input[type="search"]') as HTMLInputElement;
				if (input) {
					input.focus();
					input.select();
				}
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [mobileSearchOpen]);

	useEffect(() => {
		fetch("/api/xs2/sports")
			.then((r) => r.json())
			.then((d) => {
				const s = (d.sports ?? d.results ?? []) as any[];
				const ids = s.map((x) => String(x.sport_type ?? x.sport_id ?? "").toLowerCase()).filter(Boolean);
				setFetchedSports(ids);
			});
		// Fetch countries that actually have football tournaments/events
		Promise.all([
			fetch("/api/xs2/tournaments?sport_type=soccer&page_size=100"),
			fetch("/api/xs2/events?sport_type=soccer&page_size=100"),
		])
			.then(async ([tournamentsRes, eventsRes]) => {
				const [tournamentsData, eventsData] = await Promise.all([
					tournamentsRes.json(),
					eventsRes.json(),
				]);
				const tournaments = tournamentsData.tournaments ?? tournamentsData.results ?? [];
				const events = eventsData.events ?? eventsData.results ?? [];
				const countrySet = new Set<string>();
				// Extract countries from tournaments
				tournaments.forEach((t: any) => {
					const code = String(t.country ?? t.iso_country ?? "").trim();
					if (code) countrySet.add(code);
				});
				// Extract countries from events
				events.forEach((e: any) => {
					const code = String(e.iso_country ?? e.country ?? "").trim();
					if (code) countrySet.add(code);
				});
				const codes = Array.from(countrySet).slice(0, 20).sort();
				if (codes.length) setFootballCountries(codes);
			})
			.catch(() => {
				// Fallback to countries API if tournaments/events fetch fails
				fetch("/api/xs2/countries?page_size=50")
					.then((r) => r.json())
					.then((d) => {
						const arr = (d.countries ?? d.results ?? []) as any[];
						const codes = arr.map((c) => String(c.country ?? c.iso_country ?? "")).filter(Boolean).slice(0, 15);
						if (codes.length) setFootballCountries(codes);
					});
			});
	}, []);

	const mainIds = new Set(["football", "formula1", "motogp", "tennis"]);
	const mainSports = useMemo(() => {
		const byId: Record<string, { href: string; label: string }> = {
			football: { href: "/football", label: "Football" },
			formula1: { href: "/formula-1", label: "Formula 1" },
			motogp: { href: "/motogp", label: "MotoGP" },
			tennis: { href: "/tennis", label: "Tennis" },
		};
		return ["football", "formula1", "motogp", "tennis"].filter((id) => fetchedSports.includes(id) || id).map((id) => byId[id]);
	}, [fetchedSports]);

	const otherSports = useMemo(() => {
		const ids = fetchedSports.filter((id) => !mainIds.has(id));
		const humanize = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
		return ids.map((id) => ({ id, label: humanize(id), href: `/events?sport_type=${encodeURIComponent(id)}` })).slice(0, 20);
	}, [fetchedSports]);

	function onSearchSubmit(e: React.FormEvent, closeSheet?: () => void) {
		e.preventDefault();
		if (query.trim()) {
			router.push(`/events?query=${encodeURIComponent(query.trim())}`);
			closeSheet?.();
		}
	}

	async function loadCountryData(countryCode: string) {
		if (countryTeams[countryCode] && countryTournaments[countryCode]) return;
		setCountryLoading(true);
		const [teamsRes, tournamentsRes] = await Promise.all([
			fetch(`/api/xs2/teams?popular=true&sport_type=soccer&iso_country=${encodeURIComponent(countryCode)}&page_size=12`),
			fetch(`/api/xs2/tournaments?sport_type=soccer&region=${encodeURIComponent(countryCode)}&page_size=10`),
		]);
		const teamsData = await teamsRes.json();
		const tournamentsData = await tournamentsRes.json();
		const teams = (teamsData.teams ?? teamsData.results ?? []) as any[];
		const tournaments = (tournamentsData.tournaments ?? tournamentsData.results ?? []) as any[];
		setCountryTeams((prev) => ({ ...prev, [countryCode]: teams }));
		setCountryTournaments((prev) => ({ ...prev, [countryCode]: tournaments }));
		setCountryLoading(false);
	}

	async function loadEventsForSport(id: string) {
		if (otherSportEvents[id]) return;
		setOtherSportLoading(true);
		const today = new Date().toISOString().split("T")[0];
		const res = await fetch(`/api/xs2/events?sport_type=${encodeURIComponent(id)}&date_stop=ge:${today}&page_size=50`);
		const data = await res.json();
		const items = (data.events ?? data.results ?? data.items ?? []) as any[];
		setOtherSportEvents((prev) => ({ ...prev, [id]: items }));
		setOtherSportLoading(false);
	}

	async function loadTennisTournaments() {
		if (tennisTournaments.length) return;
		setTennisLoading(true);
		const currentYear = new Date().getFullYear();
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		// Helper to fetch all pages
		const fetchAllPages = async (baseUrl: string): Promise<any[]> => {
			const all: any[] = [];
			let url: string | null = baseUrl;
			let pageCount = 0;
			const maxPages = 50; // safety limit
			
			while (url && pageCount < maxPages) {
				try {
					const res: Response = await fetch(url);
					if (!res.ok) {
						console.warn("[tennis:pagination] non-OK response", res.status);
						break;
					}
					const data: any = await res.json();
					const items = (data.tournaments ?? data.results ?? []) as any[];
					if (items.length === 0) break; // no more items
					all.push(...items);
					
					// Check for next page
					const pagination: any = data.pagination;
					const nextPage: string | undefined = pagination?.next_page;
					if (!nextPage || nextPage === "string" || nextPage === url) {
						url = null; // no more pages
					} else if (nextPage.startsWith("http")) {
						url = nextPage; // full URL
					} else {
						// Try to construct URL from next_page
						try {
							const nextUrl: URL = new URL(nextPage, "https://api.xs2event.com/v1/");
							url = `/api/xs2/tournaments?${nextUrl.searchParams.toString()}`;
						} catch {
							// If next_page is just query params, use it directly
							if (nextPage.includes("=")) {
								url = `/api/xs2/tournaments?${nextPage}`;
							} else {
								url = null;
							}
						}
					}
					pageCount++;
				} catch (e) {
					console.error("[tennis:pagination] error", e);
					break;
				}
			}
			console.log("[tennis:pagination] fetched", pageCount, "pages,", all.length, "total items");
			return all;
		};
		
		// Fetch all tennis tournaments (handle pagination)
		const all = await fetchAllPages(`/api/xs2/tournaments?sport_type=tennis&page_size=200`);
		
		// Dedupe by id and normalized name
		const seenIds = new Set<string>();
		const seenNames = new Set<string>();
		const merged: any[] = [];
		for (const t of all) {
			const id = String(t.tournament_id ?? t.id ?? "");
			const nameRaw = String(t.official_name ?? t.tournament_name ?? t.name ?? "");
			const nameKey = nameRaw.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
			if (id && !seenIds.has(id) && nameKey && !seenNames.has(nameKey)) {
				seenIds.add(id);
				seenNames.add(nameKey);
				merged.push(t);
			}
		}
		
		// Minimal filtering: keep if date_stop >= today OR season >= currentYear - 1 OR no date info (include by default)
		const keep = merged.filter((t: any) => {
			const stopRaw = t.date_stop ?? t.end_date ?? null;
			if (stopRaw) {
				const stop = new Date(stopRaw);
				stop.setHours(0, 0, 0, 0);
				if (!isNaN(stop.getTime())) {
					// Keep if ended within last 6 months (might have events) or in the future
					const sixMonthsAgo = new Date(today);
					sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
					if (stop >= sixMonthsAgo) return true;
				}
			}
			const seasonNum = parseInt(String(t.season ?? ""), 10);
			if (!Number.isNaN(seasonNum) && seasonNum >= currentYear - 1) return true;
			// If no date info, include it (better to show than hide)
			if (!stopRaw && !seasonNum) return true;
			return false;
		});
		
		// Sort: grand slams first, then current season, then A–Z
		keep.sort((a: any, b: any) => {
			const aGS = String(a.tournament_type ?? "").toLowerCase().includes("grand") ? 1 : 0;
			const bGS = String(b.tournament_type ?? "").toLowerCase().includes("grand") ? 1 : 0;
			if (aGS !== bGS) return bGS - aGS;
			
			const aSeason = parseInt(String(a.season ?? ""), 10);
			const bSeason = parseInt(String(b.season ?? ""), 10);
			if (!Number.isNaN(aSeason) && !Number.isNaN(bSeason)) {
				if (aSeason === currentYear && bSeason !== currentYear) return -1;
				if (aSeason !== currentYear && bSeason === currentYear) return 1;
			}
			
			const aName = String(a.official_name ?? a.tournament_name ?? a.name ?? "");
			const bName = String(b.official_name ?? b.tournament_name ?? b.name ?? "");
			return aName.localeCompare(bName);
		});
		
		console.log("[tennis:tournaments] fetched=", all.length, "deduped=", merged.length, "filtered=", keep.length, "sample:", keep.slice(0, 10).map((t: any) => ({ name: t.official_name ?? t.tournament_name, season: t.season, type: t.tournament_type, date_stop: t.date_stop })));
		setTennisTournaments(keep);
		setTennisLoading(false);
	}

	async function loadEventsForTournament(tournamentId: string) {
		if (tennisEventsByTournament[tournamentId]) return;
		const today = new Date().toISOString().split("T")[0];
		const qs = new URLSearchParams({
			page_size: "50",
			date_stop: `ge:${today}`,
			sport_type: "tennis",
			tournament_id: tournamentId,
		});
		const res = await fetch(`/api/xs2/events?${qs.toString()}`);
		const data = await res.json();
		const items = (data.events ?? data.results ?? data.items ?? []) as any[];
		// Sort by date ascending
		items.sort((a: any, b: any) => new Date(a.date_start ?? a.date_start_main_event ?? 0).getTime() - new Date(b.date_start ?? b.date_start_main_event ?? 0).getTime());
		setTennisEventsByTournament((prev) => ({ ...prev, [tournamentId]: items }));
	}

	function formatEventDate(e: any): string {
		const startRaw = e.date_start ?? e.date_start_main_event ?? e.start_date ?? null;
		const endRaw = e.date_stop ?? e.date_stop_main_event ?? e.end_date ?? null;
		if (!startRaw) return "";
		const startDate = new Date(startRaw);
		if (isNaN(startDate.getTime())) return "";
		const startStr = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(startDate);
		if (endRaw) {
			const endDate = new Date(endRaw);
			if (!isNaN(endDate.getTime())) {
				const endStr = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(endDate);
				if (startDate.toDateString() !== endDate.toDateString()) return `${startStr} - ${endStr}`;
			}
		}
		return startStr;
	}

	function getEventYear(e: any): number {
		const raw = e.date_start ?? e.date_start_main_event ?? e.start_date ?? null;
		if (!raw) return 0;
		const d = new Date(raw);
		return isNaN(d.getTime()) ? 0 : d.getFullYear();
	}

	function groupEventsByYear(events: any[]): Record<number, any[]> {
		const grouped: Record<number, any[]> = {};
		for (const e of events) {
			const year = getEventYear(e);
			if (!year) continue;
			if (!grouped[year]) grouped[year] = [];
			grouped[year].push(e);
		}
		for (const year in grouped) {
			grouped[Number(year)].sort((a, b) => new Date(a.date_start ?? a.date_start_main_event ?? 0).getTime() - new Date(b.date_start ?? b.date_start_main_event ?? 0).getTime());
		}
		return grouped;
	}

	return (
		<header className="sticky top-0 z-50 border-b bg-card">
			{/* Top row: Logo, Search, Account & Cart */}
			<div className="mx-auto container px-4 py-2 sm:py-1 flex items-center justify-between gap-2 sm:gap-3">
				{/* Logo - Far Left */}
				<Link href="/" className="flex items-center gap-2 flex-shrink-0">
					<Image 
						src="/APEX-TICKETS.svg" 
						alt="Apex Tickets" 
						width={160} 
						height={26} 
						priority 
						className="h-12 sm:h-18 w-auto"
					/>
				</Link>

				{/* Desktop Search */}
				<form onSubmit={onSearchSubmit} className="hidden sm:flex flex-1 max-w-lg mx-4">
					<Input placeholder="Find your next event" value={query} onChange={(e) => setQuery(e.target.value)} className="bg-background" />
				</form>

				{/* Right side - Mobile Icons & Menu, Desktop Account & Cart */}
				<div className="flex items-center gap-1 sm:gap-2 ml-auto">
					{/* Mobile Account Button */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button className="sm:hidden p-2 rounded-md hover:bg-accent transition-colors active:scale-95" aria-label="Account">
								<User className="w-5 h-5" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuItem asChild>
								<Link href="#">Sign in</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link href="#">Orders</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Mobile Cart Button */}
					<Link 
						href="/cart" 
						className="sm:hidden relative p-2 rounded-md hover:bg-accent transition-colors active:scale-95"
						aria-label="Cart"
					>
						<ShoppingCart className="w-5 h-5" />
						{cartItemCount > 0 && (
							<Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground rounded-full border border-background">
								{cartItemCount > 99 ? "99+" : cartItemCount}
							</Badge>
						)}
					</Link>

					{/* Mobile Search Button */}
					<Sheet open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
						<SheetTrigger asChild>
							<button className="sm:hidden p-2 rounded-md hover:bg-accent transition-colors active:scale-95" aria-label="Search">
								<Search className="w-5 h-5" />
							</button>
						</SheetTrigger>
						<SheetContent 
							side="top" 
							className="h-auto p-0 border-b data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top [&>button]:hidden"
						>
							<div className="p-4 sm:p-6 bg-card border-b">
								<div className="max-w-2xl mx-auto">
									<div className="relative group">
										<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-200 z-10 pointer-events-none" />
										<form
											onSubmit={(e) => {
												e.preventDefault();
												if (query.trim()) {
													router.push(`/events?query=${encodeURIComponent(query.trim())}`);
													setMobileSearchOpen(false);
												}
											}}
											className="w-full"
										>
											<Input
												type="search"
												placeholder="Search for events, teams, venues..."
												value={query}
												onChange={(e) => setQuery(e.target.value)}
												className="w-full h-14 pl-12 pr-4 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-primary/20 border-2"
												autoFocus
												onKeyDown={(e) => {
													if (e.key === "Escape") {
														setMobileSearchOpen(false);
													}
												}}
											/>
										</form>
									</div>
									<div className="mt-3 flex items-center justify-between">
										{query.trim() ? (
											<div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in-0 duration-200">
												<span>Ready to search</span>
												<span className="text-muted-foreground/50">•</span>
												<span className="text-xs">Press Enter or Escape to close</span>
											</div>
										) : (
											<div className="text-xs text-muted-foreground/70 animate-in fade-in-0 duration-200">
												Start typing to search events, teams, and venues
											</div>
										)}
										<button
											onClick={() => setMobileSearchOpen(false)}
											className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent"
											aria-label="Close search"
										>
											ESC
										</button>
									</div>
								</div>
							</div>
						</SheetContent>
					</Sheet>

					{/* Mobile Menu */}
					<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
						<SheetTrigger asChild>
							<button className="sm:hidden p-2 rounded-md hover:bg-accent transition-colors" aria-label="Open menu">
								<Menu className="w-6 h-6" />
							</button>
						</SheetTrigger>
					<SheetContent side="right" className="w-80 sm:w-96 p-0 overflow-y-auto">
						{/* Header */}
						<div className="p-6 border-b bg-gradient-to-b from-card to-card/95 sticky top-0 z-10">
							<div className="flex items-center justify-between mb-4">
								<Image src="/APEX-TICKETS.svg" alt="Apex Tickets" width={140} height={22} />
							</div>
							<button
								onClick={() => {
									setMobileSearchOpen(true);
									setMobileMenuOpen(false);
								}}
								className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border bg-background hover:bg-accent transition-colors text-left"
							>
								<Search className="w-4 h-4 text-muted-foreground" />
								<span className="text-sm text-muted-foreground">Search events...</span>
							</button>
						</div>

						{/* Navigation */}
						<nav className="p-4 pb-20">
							<div className="mb-2">
								<div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
									Popular Sports
								</div>
								
								{/* Football - Expandable with countries */}
								<div className="mb-1">
									<button
										onClick={() => {
											setMobileExpanded((p) => ({ ...p, football: !p.football }));
											if (!footballCountries.length && !mobileExpanded.football) {
												// Fetch countries that actually have football tournaments/events
												Promise.all([
													fetch("/api/xs2/tournaments?sport_type=football&page_size=100"),
													fetch("/api/xs2/events?sport_type=football&page_size=100"),
												])
													.then(async ([tournamentsRes, eventsRes]) => {
														const [tournamentsData, eventsData] = await Promise.all([
															tournamentsRes.json(),
															eventsRes.json(),
														]);
														const tournaments = tournamentsData.tournaments ?? tournamentsData.results ?? [];
														const events = eventsData.events ?? eventsData.results ?? [];
														const countrySet = new Set<string>();
														// Extract countries from tournaments
														tournaments.forEach((t: any) => {
															const code = String(t.country ?? t.iso_country ?? "").trim();
															if (code) countrySet.add(code);
														});
														// Extract countries from events
														events.forEach((e: any) => {
															const code = String(e.iso_country ?? e.country ?? "").trim();
															if (code) countrySet.add(code);
														});
														const codes = Array.from(countrySet).slice(0, 20).sort();
														if (codes.length) setFootballCountries(codes);
													})
													.catch(() => {
														// Fallback to countries API if tournaments/events fetch fails
														fetch("/api/xs2/countries?page_size=50")
															.then((r) => r.json())
															.then((d) => {
																const arr = (d.countries ?? d.results ?? []) as any[];
																const codes = arr.map((c) => String(c.country ?? c.iso_country ?? "")).filter(Boolean).slice(0, 15);
																if (codes.length) setFootballCountries(codes);
															});
													});
											}
										}}
										className="w-full text-left flex items-center justify-between px-4 py-2 text-base font-medium hover:bg-accent rounded-lg transition-colors group"
									>
										<span className="flex items-center gap-3">
											<Trophy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
											<span className="text-sm">Football</span>
										</span>
										<ChevronRight 
											className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${mobileExpanded.football ? "rotate-90" : ""}`} 
										/>
									</button>
									{mobileExpanded.football && (
										<div className="mt-2 ml-8 space-y-1 animate-in fade-in-0 slide-in-from-top-2 duration-200">
											{footballCountries.length ? (
												<>
													{footballCountries.map((code) => (
														<Link
															key={code}
															href={`/events?sport_type=football&iso_country=${encodeURIComponent(code)}`}
															className="block px-3 py-2.5 rounded-lg hover:bg-accent active:bg-muted transition-colors"
															onClick={() => {
																setMobileExpanded((p) => ({ ...p, football: false }));
																setMobileMenuOpen(false);
															}}
														>
															<div className="flex items-center gap-2.5">
																<CountryFlag countryCode={code} size={18} className="shrink-0" />
																<span className="text-sm">{formatCountryName(code)}</span>
															</div>
														</Link>
													))}
													<Link
														href="/football"
														className="block px-3 py-2.5 rounded-lg hover:bg-accent active:bg-muted font-medium text-sm border-t border-border/50 mt-2 pt-2"
														onClick={() => {
															setMobileExpanded((p) => ({ ...p, football: false }));
															setMobileMenuOpen(false);
														}}
													>
														View All Football
													</Link>
												</>
											) : (
												<div className="px-3 py-2 text-sm text-muted-foreground">Loading countries…</div>
											)}
										</div>
									)}
								</div>

								{/* Formula 1 - Expandable with events */}
								<div className="mb-1">
									<button
										onClick={() => {
											setMobileExpanded((p) => ({ ...p, formula1: !p.formula1 }));
											if (!otherSportEvents["formula1"] && !mobileExpanded.formula1) {
												loadEventsForSport("formula1");
											}
										}}
										className="w-full text-left flex items-center justify-between px-4 py-2 text-base font-medium hover:bg-accent rounded-lg transition-colors group"
									>
										<span className="flex items-center gap-3">
											<Calendar className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
											<span className="text-sm">Formula 1</span>
										</span>
										<ChevronRight 
											className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${mobileExpanded.formula1 ? "rotate-90" : ""}`} 
										/>
									</button>
									{mobileExpanded.formula1 && (
										<div className="mt-2 ml-8 max-h-[60vh] overflow-y-auto space-y-1 animate-in fade-in-0 slide-in-from-top-2 duration-200">
											{(otherSportEvents["formula1"] ?? []).length ? (
												(() => {
													const f1Events = otherSportEvents["formula1"] ?? [];
													const grouped = groupEventsByYear(f1Events);
													const years = Object.keys(grouped).map(Number).sort((a, b) => a - b);
													return years.map((year) => (
														<div key={year} className="mb-3">
															<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">{year}</div>
															{grouped[year].slice(0, 8).map((e: any) => (
																<Link
																	key={e.event_id ?? e.id}
																	href={`/events/${encodeURIComponent(e.event_id ?? e.id)}`}
																	className="block px-3 py-2.5 rounded-lg hover:bg-accent active:bg-muted transition-colors"
																	onClick={() => {
																		setMobileExpanded((p) => ({ ...p, formula1: false }));
																		setMobileMenuOpen(false);
																	}}
																>
																	<div className="flex items-center gap-2.5">
																		<CountryFlag countryCode={e.iso_country ?? e.country} size={18} className="shrink-0" />
																		<span className="flex-1 truncate text-sm">{e.event_name ?? e.name}</span>
																	</div>
																	<div className="text-xs text-muted-foreground mt-1 ml-7">{formatEventDate(e)}</div>
																</Link>
															))}
														</div>
													));
												})()
											) : otherSportLoading ? (
												<div className="px-3 py-2 text-sm text-muted-foreground">Loading events…</div>
											) : (
												<div className="px-3 py-2 text-sm text-muted-foreground">No upcoming events</div>
											)}
											<Link
												href="/formula-1"
												className="block px-3 py-2.5 rounded-lg hover:bg-accent active:bg-muted font-medium text-sm border-t border-border/50 mt-2 pt-2"
												onClick={() => {
													setMobileExpanded((p) => ({ ...p, formula1: false }));
													setMobileMenuOpen(false);
												}}
											>
												View All Formula 1
											</Link>
										</div>
									)}
								</div>

								{/* MotoGP */}
								<div className="mb-1">
									<button
										onClick={() => {
											setMobileExpanded((p) => ({ ...p, motogp: !p.motogp }));
											if (!otherSportEvents["motogp"] && !mobileExpanded.motogp) {
												loadEventsForSport("motogp");
											}
										}}
										className="w-full text-left flex items-center justify-between px-4 py-2 text-base font-medium hover:bg-accent rounded-lg transition-colors group"
									>
										<span className="flex items-center gap-3">
											<Calendar className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
											<span className="text-sm">MotoGP</span>
										</span>
										<ChevronRight 
											className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${mobileExpanded.motogp ? "rotate-90" : ""}`} 
										/>
									</button>
									{mobileExpanded.motogp && (
										<div className="mt-2 ml-8 max-h-[60vh] overflow-y-auto space-y-1 animate-in fade-in-0 slide-in-from-top-2 duration-200">
											{(otherSportEvents["motogp"] ?? []).length ? (
												<>
													{(otherSportEvents["motogp"] ?? [])
														.slice()
														.sort((a: any, b: any) => new Date(a.date_start ?? 0).getTime() - new Date(b.date_start ?? 0).getTime())
														.slice(0, 10)
														.map((e: any) => (
															<Link
																key={e.event_id ?? e.id}
																href={`/events/${encodeURIComponent(e.event_id ?? e.id)}`}
																className="block px-3 py-2.5 rounded-lg hover:bg-accent active:bg-muted transition-colors"
																onClick={() => {
																	setMobileExpanded((p) => ({ ...p, motogp: false }));
																	setMobileMenuOpen(false);
																}}
															>
																<div className="flex items-center gap-2.5">
																	<CountryFlag countryCode={e.iso_country ?? e.country} size={18} className="shrink-0" />
																	<span className="flex-1 truncate text-sm">{e.event_name ?? e.name}</span>
																</div>
																<div className="text-xs text-muted-foreground mt-1 ml-7">{formatEventDate(e)}</div>
															</Link>
														))}
													<Link
														href="/motogp"
														className="block px-3 py-2.5 rounded-lg hover:bg-accent active:bg-muted font-medium text-sm border-t border-border/50 mt-2 pt-2"
														onClick={() => {
															setMobileExpanded((p) => ({ ...p, motogp: false }));
															setMobileMenuOpen(false);
														}}
													>
														View All MotoGP
													</Link>
												</>
											) : otherSportLoading ? (
												<div className="px-3 py-2 text-sm text-muted-foreground">Loading events…</div>
											) : (
												<div className="px-3 py-2 text-sm text-muted-foreground">No upcoming events</div>
											)}
										</div>
									)}
								</div>

								{/* Tennis - Expandable with tournaments */}
								<div className="mb-1">
									<button
										onClick={() => {
											setMobileExpanded((p) => ({ ...p, tennis: !p.tennis }));
											if (!tennisTournaments.length && !mobileExpanded.tennis) {
												loadTennisTournaments();
											}
										}}
										className="w-full text-left flex items-center justify-between px-4 py-2 text-base font-medium hover:bg-accent rounded-lg transition-colors group"
									>
										<span className="flex items-center gap-3">
											<Trophy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
											<span className="text-sm">Tennis</span>
										</span>
										<ChevronRight 
											className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${mobileExpanded.tennis ? "rotate-90" : ""}`} 
										/>
									</button>
									{mobileExpanded.tennis && (
										<div className="mt-2 ml-8 max-h-[60vh] overflow-y-auto space-y-1 animate-in fade-in-0 slide-in-from-top-2 duration-200">
											{tennisTournaments.length ? (
												<>
													{tennisTournaments.slice(0, 20).map((t: any) => (
														<Link
															key={t.tournament_id ?? t.id}
															href={`/events?tournament_id=${encodeURIComponent(String(t.tournament_id ?? t.id))}`}
															className="block px-3 py-2.5 rounded-lg hover:bg-accent active:bg-muted transition-colors"
															onClick={() => {
																setMobileExpanded((p) => ({ ...p, tennis: false }));
																setMobileMenuOpen(false);
															}}
														>
															<span className="text-sm">{t.official_name ?? t.tournament_name ?? t.name}</span>
														</Link>
													))}
													<Link
														href="/tennis"
														className="block px-3 py-2.5 rounded-lg hover:bg-accent active:bg-muted font-medium text-sm border-t border-border/50 mt-2 pt-2"
														onClick={() => {
															setMobileExpanded((p) => ({ ...p, tennis: false }));
															setMobileMenuOpen(false);
														}}
													>
														View All Tennis
													</Link>
												</>
											) : tennisLoading ? (
												<div className="px-3 py-2 text-sm text-muted-foreground">Loading tournaments…</div>
											) : (
												<div className="px-3 py-2 text-sm text-muted-foreground">No tournaments found</div>
											)}
										</div>
									)}
								</div>
							</div>

							{/* Other Sports */}
							<div className="mt-6 pt-4 border-t">
								<div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
									More Sports
								</div>
								<div className="">
									{otherSports.slice(0, 12).map((s) => (
										<Link
											key={s.href}
											href={s.href}
											className="block px-4 py-2 rounded-lg hover:bg-accent active:bg-muted transition-colors text-sm"
											onClick={() => setMobileMenuOpen(false)}
										>
											{s.label}
										</Link>
									))}
								</div>
							</div>

							{/* Quick Links */}
							<div className="mt-6 pt-4 border-t">
								<Link 
									href="/events?origin=allevents" 
									className="block px-4 py-3 rounded-lg active:bg-muted text-sm transition-colors bg-primary hover:bg-primary/90 text-white"
									onClick={() => setMobileMenuOpen(false)}
								>
									View All Events
								</Link>
							</div>
						</nav>
					</SheetContent>
				</Sheet>

					{/* Desktop Account & Cart */}
					<div className="hidden sm:flex items-center gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger className="rounded-md px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 transition-colors">
								<User className="w-4 h-4" />
								<span>Account</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Link href="#">Sign in</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link href="#">Orders</Link>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						<Link 
							href="/cart" 
							className="relative rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
						>
							<ShoppingCart className="w-4 h-4" />
							<span>Cart</span>
							{cartItemCount > 0 && (
								<Badge className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground rounded-full border-2 border-background">
									{cartItemCount > 99 ? "99+" : cartItemCount}
								</Badge>
							)}
						</Link>
					</div>
				</div>
			</div>

			{/* Second row: Desktop Navigation */}
			<div className="hidden sm:block border-t bg-card">
				<div className="mx-auto container px-4 py-2">
					<NavigationMenu>
						<NavigationMenuList>
								{/* Football mega-menu */}
								<NavigationMenuItem>
									<NavigationMenuTrigger onMouseEnter={() => {
										// Load football countries when hovering over the trigger
										if (footballCountries.length === 0) {
											Promise.all([
												fetch("/api/xs2/tournaments?sport_type=soccer&page_size=100"),
												fetch("/api/xs2/events?sport_type=soccer&page_size=100"),
											])
												.then((responses) => Promise.all(responses.map((r) => r.json())))
												.then(([tournamentsData, eventsData]) => {
													const tournaments = tournamentsData.tournaments ?? tournamentsData.results ?? [];
													const events = eventsData.events ?? eventsData.results ?? [];
													
													const codes = new Set<string>();
													tournaments.forEach((t: any) => {
														if (t.region && typeof t.region === "string" && t.region.length === 3) {
															codes.add(t.region);
														}
													});
													events.forEach((e: any) => {
														if (e.iso_country && typeof e.iso_country === "string" && e.iso_country.length === 3) {
															codes.add(e.iso_country);
														}
													});
													
													if (codes.size) setFootballCountries(Array.from(codes).sort());
												})
												.catch((err) => {
													console.error("[SiteHeader] Error fetching football countries:", err);
												});
										}
									}}>Football</NavigationMenuTrigger>
								<NavigationMenuContent className="p-0">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-0 min-w-[720px] max-w-[720px]">
										<div className="border-r p-2 max-h-[420px] overflow-y-auto">
											{footballCountries.length === 0 ? (
												<div className="text-sm text-muted-foreground px-3 py-2">Loading countries...</div>
											) : (
												footballCountries.map((code) => (
													<button
														key={code}
														onMouseEnter={() => { setActiveFootballCountry(code); loadCountryData(code); }}
														className={`w-full text-left flex items-center justify-between px-3 py-2 rounded hover:bg-accent ${activeFootballCountry === code ? "bg-accent" : ""}`}
													>
														<span className="flex items-center gap-2">
															<CountryFlag countryCode={code} size={18} className="flex-shrink-0" />
															{formatCountryName(code)}
														</span>
														<span>›</span>
													</button>
												))
											)}
										</div>
										<div className="p-3 max-h-[420px] overflow-y-auto">
											{activeFootballCountry ? (
												<>
													<div className="text-sm font-semibold mb-2">Popular teams in {formatCountryName(activeFootballCountry)}</div>
													{countryLoading && !countryTeams[activeFootballCountry] && <div className="text-sm text-muted-foreground">Loading…</div>}
													{(countryTeams[activeFootballCountry] ?? []).slice(0, 10).map((t: any) => (
														<Link key={t.team_id ?? t.id} href={`/events?team_id=${encodeURIComponent(t.team_id ?? t.id)}`} className="block rounded px-3 py-2 hover:bg-accent">
															{t.official_name ?? t.team_name ?? t.slug}
														</Link>
													))}
													<div className="text-sm font-semibold pt-4 mt-2 mb-2">Tournaments</div>
													{(countryTournaments[activeFootballCountry] ?? []).slice(0, 8).map((t: any) => (
														<Link key={t.tournament_id ?? t.id} href={`/events?tournament_id=${encodeURIComponent(t.tournament_id ?? t.id)}`} className="block rounded px-3 py-2 hover:bg-accent">
															{t.official_name ?? t.tournament_name ?? t.name}
														</Link>
													))}
												</>
											) : (
												<div className="text-sm text-muted-foreground">Hover over a country to see teams and tournaments</div>
											)}
										</div>
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>

							{/* Formula 1 dropdown (events by date, grouped by year, with flags) */}
							<NavigationMenuItem>
								<NavigationMenuTrigger onMouseEnter={() => loadEventsForSport("formula1")}>Formula 1</NavigationMenuTrigger>
								<NavigationMenuContent className="p-0">
									<div className="min-w-[520px] max-h-[420px] overflow-y-auto p-2">
										{(() => {
											const f1Events = otherSportEvents["formula1"] ?? [];
											const grouped = groupEventsByYear(f1Events);
											const years = Object.keys(grouped).map(Number).sort((a, b) => a - b);
											if (!f1Events.length && otherSportLoading) return <div className="text-sm text-muted-foreground py-2">Loading upcoming Grands Prix…</div>;
											if (!f1Events.length) return <div className="text-sm text-muted-foreground px-3 py-2">No upcoming events</div>;
											return years.map((year) => (
												<div key={year} className="mb-3">
													<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 py-2">{year}</div>
													{grouped[year].slice(0, 30).map((e: any) => (
														<Link key={e.event_id ?? e.id} href={`/events/${encodeURIComponent(e.event_id ?? e.id)}`} className="block rounded px-3 py-2 hover:bg-accent">
															<div className="flex items-center justify-between gap-3">
																<span className="truncate flex items-center gap-2">
																	<CountryFlag countryCode={e.iso_country ?? e.country} size={18} className="flex-shrink-0" />
																	{e.event_name ?? e.name}
																</span>
															<span className="text-xs text-muted-foreground whitespace-nowrap">{formatEventDate(e)}</span>
														</div>
													</Link>
													))}
												</div>
											));
										})()}
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>

							{/* MotoGP dropdown (events by date, with flags) */}
							<NavigationMenuItem>
								<NavigationMenuTrigger onMouseEnter={() => loadEventsForSport("motogp")}>MotoGP</NavigationMenuTrigger>
								<NavigationMenuContent className="p-0">
									<div className="min-w-[520px] max-h-[420px] overflow-y-auto p-2">
										{(otherSportEvents["motogp"] ?? [])
											.slice().sort((a: any, b: any) => new Date(a.date_start ?? 0).getTime() - new Date(b.date_start ?? 0).getTime())
											.map((e: any) => (
												<Link key={e.event_id ?? e.id} href={`/events/${encodeURIComponent(e.event_id ?? e.id)}`} className="block rounded px-3 py-2 hover:bg-accent">
													<div className="flex items-center justify-between gap-3">
														<span className="truncate flex items-center gap-2">
															<CountryFlag countryCode={e.iso_country ?? e.country} size={18} className="flex-shrink-0" />
															{e.event_name ?? e.name}
														</span>
														<span className="text-xs text-muted-foreground whitespace-nowrap">{formatEventDate(e)}</span>
													</div>
												</Link>
											))}
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>

							{/* Tennis dropdown (tournaments only; click-through to events page) */}
							<NavigationMenuItem>
								<NavigationMenuTrigger onMouseEnter={() => loadTennisTournaments()}>Tennis</NavigationMenuTrigger>
								<NavigationMenuContent className="p-0">
									<div className="min-w-[520px] max-h-[420px] overflow-y-auto p-2">
										{(tennisTournaments ?? []).map((t: any) => (
											<Link
												key={t.tournament_id ?? t.id}
												href={`/events?tournament_id=${encodeURIComponent(String(t.tournament_id ?? t.id))}`}
												className="block rounded px-3 py-2 hover:bg-accent"
											>
												<span className="truncate">{t.official_name ?? t.tournament_name ?? t.name}</span>
											</Link>
										))}
										{!tennisTournaments.length && (
											<div className="text-sm text-muted-foreground px-3 py-2">{tennisLoading ? "Loading tournaments…" : "No tournaments found"}</div>
										)}
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>

							{/* Main direct sports */}
							{mainSports
								.filter((s) => s.label !== "Football" && s.label !== "Formula 1" && s.label !== "MotoGP" && s.label !== "Tennis")
								.map((s) => (
									<NavigationMenuItem key={s.href}>
										<Link href={s.href} className="px-3 py-2 rounded-md hover:bg-accent text-sm">
											{s.label}
										</Link>
									</NavigationMenuItem>
								))}

							{/* Other events mega-menu with hover-to-preview */}
							<NavigationMenuItem>
								<NavigationMenuTrigger>Other events</NavigationMenuTrigger>
								<NavigationMenuContent className="p-0">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-0 min-w-[720px]">
										<div className="border-r p-2 max-h-[420px] overflow-y-auto">
											{otherSports.map((s) => (
												<button
													key={s.id}
													onMouseEnter={() => { setActiveOtherSport(s.id); loadEventsForSport(s.id); }}
													className={`w-full text-left flex items-center justify-between px-3 py-2 rounded hover:bg-accent ${activeOtherSport === s.id ? "bg-accent" : ""}`}
												>
													<span>{s.label}</span>
													<span>›</span>
												</button>
											))}
										</div>
										<div className="p-3 max-h-[420px] overflow-y-auto">
											<div className="text-sm font-semibold mb-2">{activeOtherSport ? `Top ${activeOtherSport} events` : "Browse a sport"}</div>
											{activeOtherSport && otherSportLoading && !otherSportEvents[activeOtherSport] && (
												<div className="text-sm text-muted-foreground">Loading…</div>
											)}
											{activeOtherSport && (otherSportEvents[activeOtherSport] ?? []).slice(0, 20).map((e: any) => (
												<Link key={e.event_id ?? e.id} href={`/events/${encodeURIComponent(e.event_id ?? e.id)}`} className="block rounded px-3 py-2 hover:bg-accent">
													<div className="flex items-center justify-between gap-3">
														<span className="truncate flex items-center gap-2">
															<CountryFlag countryCode={e.iso_country ?? e.country} size={18} className="flex-shrink-0" />
															{e.event_name ?? e.name}
														</span>
														<span className="text-xs text-muted-foreground whitespace-nowrap">{formatEventDate(e)}</span>
													</div>
												</Link>
											))}
										</div>
									</div>
								</NavigationMenuContent>
							</NavigationMenuItem>

							<NavigationMenuItem>
								<Link href="/events?origin=allevents" className={`px-2 py-1 rounded-md hover:bg-accent text-sm ${pathname === "/events" ? "bg-accent" : ""}`}>All events</Link>
							</NavigationMenuItem>
							</NavigationMenuList>
						</NavigationMenu>
					</div>
				</div>
		</header>
	);
}

