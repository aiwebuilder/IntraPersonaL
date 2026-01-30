"use client";

import IntraPersonalApp from "@/components/innapersonal/intrapersonal-app";
import IntraPersonalLogo from "@/components/innapersonal/intrapersonal-logo";
import Script from "next/script";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Google AdSense Script */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6675484914269982"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      <div className="flex flex-col items-center justify-center text-center mb-12 z-10">
        <IntraPersonalLogo />
        <h1 className="text-5xl md:text-7xl font-bold text-scramble mt-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          IntraPersonaL
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-foreground/80">
          Unlock your potential. AI-powered personality and communication analysis.
        </p>
      </div>
      <IntraPersonalApp />
    </main>
  );
}
