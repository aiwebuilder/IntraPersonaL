import { cn } from "@/lib/utils";

const AuraLogo = ({ className }: { className?: string }) => {
  return (
    <h1 className={cn("text-6xl font-bold text-primary font-headline", className)}>
      AURA+
    </h1>
  );
};

export default AuraLogo;
