"use client";

import { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { CivicStreamProvider } from "@/context/CivicStreamContext";
import { TopBar } from "@/components/nav/TopBar";
import { BottomNav } from "@/components/nav/BottomNav";
import { usePathname } from "next/navigation";
import { LevelUpOverlay } from "@/components/levelup/LevelUpModal";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [showDemo, setShowDemo] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") {
        setShowDemo((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showBottomNav = pathname !== "/" && pathname !== "/onboarding";
  const showTopBar = pathname === "/feed";

  return (
    <html lang="en">
      <head>
        <title>CivicStream - Canadian Civic Engagement</title>
        <meta
          name="description"
          content="From the House of Commons to City Hall — In Your Pocket"
        />
      </head>
      <body className={`${inter.variable} antialiased bg-white font-sans`}>
        <CivicStreamProvider>
          {showTopBar && <TopBar />}
          <main
            className={
              showBottomNav
                ? showTopBar
                  ? "pt-[60px] pb-24 min-h-screen"
                  : "pb-24 min-h-screen"
                : "min-h-screen"
            }>
            {children}
          </main>
          {showBottomNav && <BottomNav />}

          {/* Demo Watermark */}
          {showDemo && (
            <div className="fixed bottom-28 right-5 text-[10px] text-gray-300 pointer-events-none z-50 font-medium">
              DEMO
            </div>
          )}
          <LevelUpOverlay />
        </CivicStreamProvider>
      </body>
    </html>
  );
}
