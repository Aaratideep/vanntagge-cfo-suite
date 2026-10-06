import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "../components/QueryProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VANTAGE CFO Suite - Enterprise Operations Control Center",
  description: "Centralized operational command center for VANNTAGGE CFO consultancy services, managing leads, client onboarding, audit programs, compliance timelines, work allocation, and billing milestones.",
  keywords: "Virtual CFO, CFO Dashboard, Financial Advisory, Compliance Management, Audit checklist, Enterprise SaaS, ERP consulting, Milestone invoicing",
};

import { AICopilotWidget } from "../components/AICopilotWidget";
import { TaxInvoiceModal } from "../components/TaxInvoiceModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
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
