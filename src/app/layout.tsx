import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ConvexClerkProvider } from "@/providers/ConvexClerkProvider";
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
  title: "StaticKit - AI Ad Iteration Tool",
  description: "Iterate on your winning ads. Change one variable at a time. New locations, new people, same message.",
  keywords: ["ad iteration", "AI advertising", "ad testing", "A/B testing", "meta ads", "google ads", "ad creative"],
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
        <ConvexClerkProvider>
          {children}
        </ConvexClerkProvider>
        <Toaster />
      </body>
    </html>
  );
}
