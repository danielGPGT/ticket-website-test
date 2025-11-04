"use client";

import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
	return (
		<footer className="border-t bg-card text-foreground">
			<div className="mx-auto container px-4 sm:px-6 lg:px-8 py-12">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-10">
					<div className="space-y-4">
						<Link href="/" className="inline-flex items-center gap-2">
							<Image src="/APEX-TICKETS.svg" alt="Apex Tickets" width={160} height={26} />
						</Link>
						<p className="text-sm text-muted-foreground max-w-xs">
							Apex Tickets is your trusted marketplace for premium sports experiences worldwide. Verified inventory, secure checkout, and dedicated support.
						</p>
					</div>

					<div>
						<div className="text-sm font-semibold mb-3">Explore</div>
						<ul className="space-y-2 text-sm">
							<li><Link className="hover:underline" href="/events">All Events</Link></li>
							<li><Link className="hover:underline" href="/formula-1">Formula 1</Link></li>
							<li><Link className="hover:underline" href="/football">Football</Link></li>
							<li><Link className="hover:underline" href="/motogp">MotoGP</Link></li>
							<li><Link className="hover:underline" href="/tennis">Tennis</Link></li>
						</ul>
					</div>

					<div>
						<div className="text-sm font-semibold mb-3">Company</div>
						<ul className="space-y-2 text-sm">
							<li><Link className="hover:underline" href="#">About</Link></li>
							<li><Link className="hover:underline" href="#">Careers</Link></li>
							<li><Link className="hover:underline" href="#">Contact</Link></li>
							<li><Link className="hover:underline" href="#">Press</Link></li>
						</ul>
					</div>

					<div>
						<div className="text-sm font-semibold mb-3">Stay in the loop</div>
						<p className="text-sm text-muted-foreground mb-3">Get early access to popular events and exclusive offers.</p>
						<form
							onSubmit={(e) => { e.preventDefault(); }}
							className="flex items-center gap-2"
						>
							<Input placeholder="Your email" type="email" required className="flex-1" />
							<Button type="submit">Subscribe</Button>
						</form>
					</div>
				</div>
			</div>

			<div className="border-t bg-foreground">
				<div className="mx-auto container px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 justify-between text-xs text-background">
					<div className="space-y-1">
						<div>© {new Date().getFullYear()} Apex Tickets. All rights reserved.</div>
						<div className="">XS2Event is our official ticketing partner.</div>
					</div>
					<div className="flex items-center gap-4">
						<Link className="hover:underline" href="#">Terms</Link>
						<Link className="hover:underline" href="#">Privacy</Link>
						<Link className="hover:underline" href="#">Refund policy</Link>
						<Link className="hover:underline" href="#">Help center</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
