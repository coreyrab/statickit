import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/providers/theme-provider";
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
  metadataBase: new URL("https://statickit.ai"),
  title: "Free AI photo editor - StaticKit",
  description: "Free, open-source AI image editor. Edit images with natural language, generate variations, resize intelligently. Bring your own API key.",
  keywords: ["AI image editor", "free AI image editor", "image editing", "AI photo editor", "Gemini image editor", "open source"],
  openGraph: {
    title: "Free AI photo editor - StaticKit",
    description: "Edit images with AI using natural language. Generate variations, swap backgrounds, resize intelligently. Free and open source.",
    url: "https://statickit.ai",
    siteName: "StaticKit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI photo editor - StaticKit",
    description: "Edit images with AI using natural language. Generate variations, swap backgrounds, resize intelligently. Free and open source.",
    creator: "@coreyrab",
  },
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
          <Toaster position="bottom-left" />
        </ThemeProvider>
        <Script
          src="https://cdn.usefathom.com/script.js"
          data-site="GPULAWRW"
          strategy="afterInteractive"
        />
        <Script id="openpanel-init" strategy="afterInteractive">
          {`
            window.op=window.op||function(){var n=[];return new Proxy(function(){arguments.length&&n.push([].slice.call(arguments))},{get:function(t,r){return"q"===r?n:function(){n.push([r].concat([].slice.call(arguments)))}},has:function(t,r){return"q"===r}})}();
            window.op('init', {
              clientId: '1b309e8f-6811-4f70-b2a3-efe533fbacc9',
              trackScreenViews: true,
              trackOutgoingLinks: true,
              trackAttributes: true,
            });
          `}
        </Script>
        <Script
          src="https://openpanel.dev/op1.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
