import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
  readonly variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-red-accent text-white hover:brightness-110 active:brightness-90",
  secondary: "bg-white text-black border border-line hover:bg-paper active:bg-line/20",
  ghost: "bg-transparent text-black hover:bg-black/5 active:bg-black/10",
  danger:
    "bg-white text-red-accent border border-red-accent hover:bg-red-accent/5 active:bg-red-accent/10",
};

export function Button({
  children,
  variant = "secondary",
  className,
  disabled,
  ...rest
}: ButtonProps): ReactNode {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-red-accent focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-40",
        variantStyles[variant],
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
