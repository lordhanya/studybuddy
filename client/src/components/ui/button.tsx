import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

function buttonVariant(variant?: ButtonProps["variant"]) {
  switch (variant) {
    case "destructive":
      return "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive))]/90";
    case "outline":
      return "border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]";
    case "secondary":
      return "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/80";
    case "ghost":
      return "hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--secondary-foreground))]";
    case "link":
      return "text-[hsl(var(--primary))] underline-offset-4 hover:underline";
    default:
      return "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-hover))]";
  }
}

function buttonSize(size?: ButtonProps["size"]) {
  switch (size) {
    case "sm":
      return "h-9 rounded-md px-3 text-sm";
    case "lg":
      return "h-11 rounded-md px-8 text-sm";
    case "icon":
      return "h-10 w-10 rounded-md";
    default:
      return "h-10 px-4 py-2 text-sm";
  }
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariant(variant),
          buttonSize(size),
          className
        )}
        {...(asChild ? props : { type: "button", ...props })}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
