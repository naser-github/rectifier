import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Tooltip } from "./Tooltip";

interface DisabledReasonProps {
  readonly children: ReactNode;
  readonly reason: string;
  readonly className?: string;
}

/**
 * Wraps a disabled control so its disabled reason is visible on focus and
 * hover. Native disabled buttons do not receive pointer or focus events, so
 * this renders a focusable span that surfaces the reason through a tooltip.
 *
 * When `reason` is empty the children render without a wrapper — use this for
 * enabled controls that need no explanation.
 */
export function DisabledReason({
  children,
  reason,
  className,
}: DisabledReasonProps): ReactNode {
  if (!reason) {
    return <>{children}</>;
  }

  return (
    <Tooltip content={reason}>
      <span
        tabIndex={0}
        role="button"
        aria-disabled="true"
        className={cn(
          "inline-flex focus-visible:outline-2 focus-visible:outline-red-accent focus-visible:outline-offset-2",
          className,
        )}
      >
        {children}
      </span>
    </Tooltip>
  );
}
