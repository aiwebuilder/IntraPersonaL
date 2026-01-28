
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";
import { Orbitron, Roboto } from "next/font/google";
import { cn } from "@/lib/utils";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import ThreeBackground from "@/components/ui/three-background";

const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-headline" });
const roboto = Roboto({ subsets: ["latin"], weight: "400", variable: "--font-body" });

export const metadata: Metadata = {
  title: "IntraPersonaL",
  description: "Unlock your potential with AI-powered personality analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-body antialiased text-slate-300 selection:bg-primary selection:text-white", orbitron.variable, roboto.variable)}>
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
