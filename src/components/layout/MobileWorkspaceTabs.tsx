import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type MobileTab = "input" | "result";

interface MobileWorkspaceTabsProps {
  readonly activeTab: MobileTab;
  readonly onTabChange: (tab: MobileTab) => void;
  readonly hasResult: boolean;
}

export function MobileWorkspaceTabs({
  activeTab,
  onTabChange,
  hasResult,
}: MobileWorkspaceTabsProps): ReactNode {
  const tabs: { id: MobileTab; label: string }[] = [
    { id: "input", label: "Input" },
    { id: "result", label: "Result" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Workspace tabs"
      className="flex border-b border-line lg:hidden"
    >
      {tabs.map(({ id, label }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            disabled={id === "result" && !hasResult}
            onClick={() => {
              onTabChange(id);
            }}
            className={cn(
              "flex-1 px-4 py-2.5 text-center text-xs font-extrabold transition-colors",
              active
                ? "border-b-2 border-red-accent text-black"
                : "text-muted hover:text-black",
              id === "result" && !hasResult && "pointer-events-none opacity-40",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
