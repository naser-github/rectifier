import { type MouseEvent, type ReactNode, useEffect, useRef } from "react";
import { cn } from "../../lib/cn";

interface DialogProps {
  readonly children: ReactNode;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly actions?: ReactNode;
}

export function Dialog({
  children,
  open,
  onClose,
  title,
  actions,
}: DialogProps): ReactNode {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (e: MouseEvent): void => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          "mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-sm border border-line bg-white shadow-lg",
        )}
      >
        {title && (
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
        )}
        <div className="px-4 py-4">{children}</div>
        {actions && (
          <div className="flex items-center justify-end gap-2 border-t border-line px-4 py-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
