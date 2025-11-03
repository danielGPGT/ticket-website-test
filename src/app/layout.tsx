import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/top-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Apex Tickets",
  description: "Sports tickets marketplace powered by XS2",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
          <body className={`${montserrat.variable} font-sans antialiased`}>
            <TopBar />
            <SiteHeader />
        {children}
            <SiteFooter />
      </body>
    </html>
  );
}
