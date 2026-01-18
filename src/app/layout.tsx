import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AppProviders } from '@/components/providers/AppProviders';
import { PopupAd } from '@/components/ui/PopupAd';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter", // Define CSS variable for Tailwind
});

export const metadata: Metadata = {
  title: "CanopyCheck",
  description: "UCSC Campus Ecosystem Monitoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <AppProviders>
          {children}
          <Toaster position="top-center" richColors />
          <PopupAd />
        </AppProviders>
      </body>
    </html>
  );
}
