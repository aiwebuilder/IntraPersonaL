"use client";

import { BrainCircuit } from 'lucide-react';

export default function IntraPersonalLogo() {
  return (
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-full blur-lg opacity-75 animate-pulse"></div>
      <div className="relative w-24 h-24 bg-background rounded-full flex items-center justify-center">
        <BrainCircuit className="w-16 h-16 text-primary" />
      </div>
    </div>
  );
}
