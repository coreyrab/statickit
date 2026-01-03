import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Free AI Image Editor - StaticKit",
  description: "Free, open-source AI image editor. Edit images with natural language, generate variations, resize intelligently. Bring your own API key.",
  keywords: ["AI image editor", "free AI image editor", "image editing", "AI photo editor", "Gemini image editor", "open source"],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StaticKit",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
        <Script
          src="https://cdn.usefathom.com/script.js"
          data-site="GPULAWRW"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
