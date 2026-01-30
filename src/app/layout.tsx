import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";
import { Orbitron, Roboto } from "next/font/google";
import { cn } from "@/lib/utils";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import ThreeBackground from "@/components/ui/three-background";
import Script from "next/script";

const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-headline" });
const roboto = Roboto({ subsets: ["latin"], weight: "400", variable: "--font-body" });

export const metadata: Metadata = {
  title: "IntraPersonaL",
  description: "Unlock your potential with AI-powered personality analysis.",
  other: {
    "google-adsense-account": "ca-pub-6675484914269982",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-body antialiased text-slate-300 selection:bg-primary selection:text-white", orbitron.variable, roboto.variable)}>
        {/* Google AdSense Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6675484914269982"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        
        <ThreeBackground />
        <FirebaseClientProvider>
          <FirebaseErrorListener />
          <main className="relative z-10">{children}</main>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
