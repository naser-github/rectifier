import { type ReactNode, useEffect, useState } from "react";
import { cn } from "../../lib/cn";

export type ToastType = "success" | "error";

interface ToastProps {
  readonly message: string;
  readonly type?: ToastType;
  readonly duration?: number;
  readonly onClose: () => void;
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-black text-white",
  error: "bg-red-accent text-white",
};

export function Toast({
  message,
  type = "success",
  duration = 2500,
  onClose,
}: ToastProps): ReactNode {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on next frame
    const enterTimer = requestAnimationFrame(() => {
      setVisible(true);
    });

    const closeTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 200); // wait for exit animation
    }, duration);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 transition-all duration-200",
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto rounded-sm px-4 py-2 text-sm shadow-sm",
          typeStyles[type],
        )}
      >
        {message}
      </div>
    </div>
  );
}
