import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { RealtimeProvider } from "@/components/RealtimeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DLMM Screener — Realtime Solana LP Opportunity Engine",
  description: "Realtime Solana Meteora DLMM screener: fee opportunity, risk-adjusted ranking, anti-rug filters, bin analytics, range optimizer, backtesting. Never guaranteed profit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-screen flex flex-col bg-[#050507] text-white antialiased">
        <RealtimeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-zinc-900 bg-black py-4">
            <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex flex-col md:flex-row gap-2 justify-between text-xs text-zinc-600">
              <div>© 2026 DLMM Screener — Analytics & decision-support only. No guaranteed profit or safety. DYOR.</div>
              <div className="flex gap-4">
                <span>Program: LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo</span>
                <span>API: dlmm-api.meteora.ag</span>
              </div>
            </div>
          </footer>
        </RealtimeProvider>
      </body>
    </html>
  );
}
