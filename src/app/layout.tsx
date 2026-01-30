import type { Metadata } from "next";
import { Orbitron, Roboto } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import ThreeBackground from "@/components/ui/three-background";

// 1. Font Configuration
const orbitron = Orbitron({ 
  subsets: ["latin"], 
  variable: "--font-headline" 
});

const roboto = Roboto({ 
  subsets: ["latin"], 
  weight: "400", 
  variable: "--font-body" 
});

// 2. Metadata (Includes AdSense Verification Tag)
export const metadata: Metadata = {
  title: "IntraPersonaL",
  description: "Unlock your potential with AI-powered personality analysis.",
  other: {
    "google-adsense-account": "ca-pub-6675484914269982",
  },
};

// 3. Root Layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "font-body antialiased text-slate-300 selection:bg-primary selection:text-white", 
        orbitron.variable, 
        roboto.variable
      )}>
        {/* Google AdSense Script */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6675484914269982"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* Background Visuals */}
        <ThreeBackground />

        {/* Application Providers & Content */}
        <FirebaseClientProvider>
          <FirebaseErrorListener />
          <main className="relative z-10">{children}</main>
        </FirebaseClientProvider>
        
        <Toaster />
      </body>
    </html>
  );
}
