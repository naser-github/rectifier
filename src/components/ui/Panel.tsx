import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface PanelProps {
  readonly children: ReactNode;
  readonly title?: string;
  readonly status?: string;
  readonly actions?: ReactNode;
  readonly className?: string;
}

export function Panel({
  children,
  title,
  actions,
  status,
  className,
}: PanelProps): ReactNode {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-sm border border-line bg-paper",
        className,
      )}
    >
      {(title ?? status ?? actions) && (
        <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
          {(title ?? status) && (
            <div>
              {title && (
                <span className="text-xs font-medium uppercase tracking-wider text-muted">
                  {title}
                </span>
              )}
              {status && (
                <p className="mt-0.5 text-[11px] font-semibold text-muted">{status}</p>
              )}
            </div>
          )}
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
