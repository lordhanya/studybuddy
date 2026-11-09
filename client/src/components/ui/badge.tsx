import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

function badgeVariant(variant?: BadgeProps["variant"]) {
  switch (variant) {
    case "secondary":
      return "border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]";
    case "destructive":
      return "border-transparent bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]";
    case "outline":
      return "text-[hsl(var(--foreground))] border-[hsl(var(--border))]";
    default:
      return "border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]";
  }
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        badgeVariant(variant),
        className
      )}
      {...props}
    />
  );
}

export { Badge };
