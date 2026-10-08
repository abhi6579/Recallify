import type { Metadata } from "next";
import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Alex from "@/components/Alex";
import NavigationProgress from "@/components/NavigationProgress";
import PageFrame from "@/components/PageFrame";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoApply — Find the right job, apply with evidence",
  description:
    "AutoApply recommends roles across every industry, tailors truthful resumes and cover letters, flags ghost jobs and scams, tracks your pipeline, and follows up automatically.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <NavigationProgress />
        <SiteHeader />
        <PageFrame>{children}</PageFrame>
        <Alex />
        <SiteFooter />
      </body>
    </html>
  );
}
