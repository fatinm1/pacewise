import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "PaceWise — Strava Activity Analytics",
  description: "Your pace. Your data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {/* Full-screen dark with subtle radial gradient from top-left */}
        <div
          className="fixed inset-0 bg-background bg-grid-pattern"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 20% 0%, rgba(252, 76, 2, 0.03), transparent)",
          }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
