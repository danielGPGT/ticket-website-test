"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { getSportPath } from "@/lib/sport-routes";
import { buildSportPath } from "@/lib/seo";

const sportItems = [
	{ id: "formula1", slug: "formula-1", label: "Formula 1" },
	{ id: "football", slug: "football", label: "Football" },
	{ id: "motogp", slug: "motogp", label: "MotoGP" },
	{ id: "tennis", slug: "tennis", label: "Tennis" },
];

const exploreItems = [
	{ href: "/geography", label: "Destinations" },
	{ href: "/venues", label: "Venues" },
];

export function NavBar() {
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);

	const sports = useMemo(() => {
		return sportItems.map((item) => {
			const path = getSportPath(item.id) ?? buildSportPath(item.slug);
			return { href: path, label: item.label };
		});
	}, []);

	return (
		<header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
			<div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
				<button className="sm:hidden p-2 -ml-2" aria-label="Menu" onClick={() => setMobileOpen((v) => !v)}>
					<span className="block h-0.5 w-6 bg-zinc-900 mb-1" />
					<span className="block h-0.5 w-6 bg-zinc-900 mb-1" />
					<span className="block h-0.5 w-6 bg-zinc-900" />
				</button>
				<Link href="/" className="flex items-center gap-2">
					<Image src="/APEX-TICKETS.svg" alt="Apex Tickets" width={150} height={24} priority />
				</Link>
				<nav className="ml-auto hidden sm:flex items-center gap-1 text-sm text-zinc-900">
					<details className="group relative">
						<summary className="list-none px-3 py-2 rounded-md hover:bg-zinc-100 cursor-pointer">Sports</summary>
						<div className="absolute left-0 mt-2 min-w-[200px] rounded-md border border-zinc-200 bg-white shadow-md p-1">
							{sports.map((item) => (
								<Link key={item.href} href={item.href} className="block rounded px-3 py-2 hover:bg-zinc-100">
									{item.label}
								</Link>
							))}
						</div>
					</details>
					<details className="group relative">
						<summary className="list-none px-3 py-2 rounded-md hover:bg-zinc-100 cursor-pointer">Explore</summary>
						<div className="absolute left-0 mt-2 min-w-[200px] rounded-md border border-zinc-200 bg-white shadow-md p-1">
							{exploreItems.map((item) => (
								<Link key={item.href} href={item.href} className="block rounded px-3 py-2 hover:bg-zinc-100">
									{item.label}
								</Link>
							))}
						</div>
					</details>
					<Link href="/events" className={`px-3 py-2 rounded-md hover:bg-zinc-100 ${pathname === "/events" ? "bg-zinc-100" : ""}`}>All Events</Link>
					<Link href="/cart" className="ml-2 rounded-md bg-zinc-900 text-white px-3 py-2 hover:bg-zinc-800">Cart</Link>
				</nav>
			</div>
			{mobileOpen && (
				<div className="sm:hidden border-t border-zinc-200 bg-white">
					<div className="mx-auto max-w-6xl px-4 py-4 space-y-3">
						<details>
							<summary className="cursor-pointer px-2 py-2 rounded hover:bg-zinc-100">Sports</summary>
							<div className="pl-3 pt-1 space-y-1">
								{sports.map((item) => (
									<Link key={item.href} href={item.href} className="block rounded px-2 py-2 hover:bg-zinc-100" onClick={() => setMobileOpen(false)}>
										{item.label}
									</Link>
								))}
							</div>
						</details>
						<details>
							<summary className="cursor-pointer px-2 py-2 rounded hover:bg-zinc-100">Explore</summary>
							<div className="pl-3 pt-1 space-y-1">
								{exploreItems.map((item) => (
									<Link key={item.href} href={item.href} className="block rounded px-2 py-2 hover:bg-zinc-100" onClick={() => setMobileOpen(false)}>
										{item.label}
									</Link>
								))}
							</div>
						</details>
						<Link href="/events" className="block rounded px-2 py-2 hover:bg-zinc-100" onClick={() => setMobileOpen(false)}>All Events</Link>
						<Link href="/cart" className="inline-block rounded bg-zinc-900 text-white px-3 py-2" onClick={() => setMobileOpen(false)}>Cart</Link>
					</div>
				</div>
			)}
		</header>
	);
}


