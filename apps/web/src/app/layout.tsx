import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "../components/QueryProvider";
import { TaxInvoiceModal } from "../components/TaxInvoiceModal";
import { AICopilotWidget } from "../components/AICopilotWidget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "VANNTAGE CFO Suite - Enterprise Operations & Financial Advisory",
  description: "Centralized operational command center and Virtual CFO advisory platform for VANNTAGE consultancy services, managing client financial statements, ratios, audits, compliance timelines, and billing milestones.",
  keywords: "Virtual CFO, CFO Dashboard, Financial Analytics, Balance Sheet Ingestion, P&L MIS, Compliance Management, Audit checklist, Enterprise SaaS, Milestone invoicing",
  authors: [{ name: "VANNTAGE CFO Advisory LLP" }],
  creator: "VANNTAGE CFO Advisory",
  publisher: "VANNTAGE",
  metadataBase: new URL("https://vanntagge.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VANNTAGE CFO Suite - Enterprise Operations & Financial Advisory",
    description: "Enterprise operational command center and Virtual CFO financial analytics platform.",
    url: "https://vanntagge.com",
    siteName: "VANNTAGE CFO Suite",
    images: [
      {
        url: "/vanntagge-logo.png",
        width: 1200,
        height: 630,
        alt: "VANNTAGE CFO Suite",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VANNTAGE CFO Suite",
    description: "Enterprise operational command center and Virtual CFO analytics platform.",
    images: ["/vanntagge-logo.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/vanntagge-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] font-sans" suppressHydrationWarning>
        <QueryProvider>
          {children}
          <TaxInvoiceModal />
          <AICopilotWidget />
        </QueryProvider>
      </body>
    </html>
  );
}
