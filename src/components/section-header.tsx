import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

type SectionHeaderProps = {
	/** Main heading text */
	title: string;
	/** Optional subtitle/description */
	subtitle?: string;
	/** Optional action button (e.g., "View All") */
	action?: {
		label: string;
		href: string;
	};
	/** Optional custom right-side content */
	children?: ReactNode;
	/** Custom className for the container */
	className?: string;
	/** Variant: "light" for light background (default), "dark" for dark background */
	variant?: "light" | "dark";
};

/**
 * Premium Reusable Section Header Component
 * 
 * A flexible, consistent header for sections throughout the site.
 * Left-aligned design with optional subtitle and action button.
 * Supports both light and dark background variants.
 * Enhanced with premium styling, animations, and responsive design.
 */
export function SectionHeader({ 
	title, 
	subtitle, 
	action, 
	children,
	className = "",
	variant = "light"
}: SectionHeaderProps) {
	const isDark = variant === "dark";
	
	return (
		<div className={cn("mb-8 sm:mb-10 lg:mb-12", className)}>
			<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
				{/* Left side - Title and Subtitle */}
				<div className="flex-1 space-y-2 sm:space-y-3">
					{/* Decorative accent line */}
					<div className="flex items-center gap-3 sm:gap-4">
						<div className={cn(
							"h-1 w-12 sm:w-16 rounded-full transition-all duration-300",
							isDark 
								? "bg-primary" 
								: "bg-secondary"
						)} />
						<div className={cn(
							"h-px flex-1 opacity-20",
							isDark ? "bg-background" : "bg-foreground"
						)} />
					</div>
					
					{/* Main Title */}
					<h2 className={cn(
						"text-xl sm:text-xl lg:text-2xl font-bold tracking-tight",
						"transition-colors duration-200",
						isDark ? "text-background" : "text-foreground"
					)}>
						<span className="relative inline-block">
							{title}
							{/* Subtle underline effect on hover */}
							<span className={cn(
								"absolute -bottom-1 left-0 h-0.5 w-0",
								"transition-all duration-300 group-hover:w-full",
								isDark ? "bg-primary/40" : "bg-primary/30"
							)} />
						</span>
					</h2>
					
					{/* Subtitle */}
					{subtitle && (
						<p className={cn(
							"text-sm sm:text-base leading-relaxed max-w-2xl",
							"transition-colors duration-200",
							isDark 
								? "text-background/70 sm:text-background/80" 
								: "text-muted-foreground"
						)}>
							{subtitle}
						</p>
					)}
				</div>
				
				{/* Right side - Action Button */}
				{(action || children) && (
					<div className="flex items-center gap-3 sm:gap-4 shrink-0">
						{children}
						{action && (
							<Button 
								variant={isDark ? "secondary" : "outline"} 
								asChild
								size="default"
								className={cn(
									"group relative overflow-hidden transition-all duration-300",
									"hover:shadow-lg hover:scale-105 active:scale-100",
									isDark 
										? "bg-background/10 text-background hover:bg-background/20 border-background/20 hover:border-background/30" 
										: "hover:border-primary/50 hover:bg-primary/5"
								)}
							>
								<Link href={action.href} className="flex items-center gap-2">
									<span className="relative z-10">{action.label}</span>
									<ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
									{/* Shine effect on hover */}
									<span className={cn(
										"absolute inset-0 -translate-x-full group-hover:translate-x-full",
										"transition-transform duration-700 ease-in-out",
										isDark 
											? "bg-gradient-to-r from-transparent via-background/10 to-transparent"
											: "bg-gradient-to-r from-transparent via-primary/10 to-transparent"
									)} />
								</Link>
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

