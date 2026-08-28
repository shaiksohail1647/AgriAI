import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AgriAI — Intelligent Agriculture",
  description: "Agricultural decision-support workspace"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
