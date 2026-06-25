import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn";
import { Tooltip } from "./Tooltip";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly icon: ReactNode;
  readonly label: string;
  readonly tooltip?: string;
}

export function IconButton({
  icon,
  label,
  tooltip,
  className,
  disabled,
  ...rest
}: IconButtonProps): ReactNode {
  const button = (
    <button
      aria-label={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-sm text-muted transition-colors",
        "hover:bg-black/5 hover:text-black active:bg-black/10",
        "focus-visible:outline-2 focus-visible:outline-red-accent focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {icon}
    </button>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{button}</Tooltip>;
  }

  return button;
}
