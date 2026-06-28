import { useState, type ReactNode } from "react";
import { ArrowLeftRight, Hammer, Shrink, WandSparkles } from "lucide-react";
import { DisabledReason } from "../ui/DisabledReason";
import { cn } from "../../lib/cn";
import { getActionEligibility, type ActionId } from "../../state/actionEligibility";
import type { WorkspaceState } from "../../domain/workspace";

interface ActionDockProps {
  readonly state: WorkspaceState;
  readonly onBeautify: () => void;
  readonly onMinify: () => void;
  readonly onConvertToYaml: () => void;
  readonly onConvertToXml: () => void;
  readonly onConvertToCsv: () => void;
  readonly onRepair: () => void;
}

const TOP_ACTIONS: {
  readonly id: Extract<ActionId, "beautify" | "minify" | "convert">;
  readonly label: string;
  readonly Icon: typeof WandSparkles;
}[] = [
  { id: "beautify", label: "Beautify", Icon: WandSparkles },
  { id: "minify", label: "Minify", Icon: Shrink },
  { id: "convert", label: "Convert", Icon: ArrowLeftRight },
];

export function ActionDock({
  state,
  onBeautify,
  onMinify,
  onConvertToYaml,
  onConvertToXml,
  onConvertToCsv,
  onRepair,
}: ActionDockProps): ReactNode {
  const [convertOpen, setConvertOpen] = useState(false);

  return (
    <section
      aria-labelledby="actions-title"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[8px] border border-line bg-white/45"
    >
      <div className="border-b border-line px-3 py-3 text-center">
        <h2 id="actions-title" className="text-sm font-extrabold">
          Actions
        </h2>
        <p className="mt-1 text-[11px] font-semibold text-muted">
          Validation runs automatically
        </p>
      </div>
      <div className="flex min-h-0 flex-col gap-2 overflow-auto p-3">
        {TOP_ACTIONS.map(({ id, label, Icon }) => {
          const { enabled, reason } = getActionEligibility(state, id);

          return (
            <DisabledReason key={id} reason={reason}>
              <button
                type="button"
                disabled={!enabled}
                onClick={
                  id === "beautify"
                    ? onBeautify
                    : id === "minify"
                      ? onMinify
                      : () => {
                          setConvertOpen(true);
                        }
                }
                className={cn(
                  "flex min-h-11 w-full items-center gap-2 rounded-[6px] border px-3 text-xs font-extrabold transition-colors",
                  enabled
                    ? "border-line bg-white hover:bg-paper"
                    : "pointer-events-none border-line bg-white opacity-40",
                )}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            </DisabledReason>
          );
        })}
      </div>

      {convertOpen && (
        <div className="border-t border-line p-3">
          <div className="mb-2 text-[11px] font-semibold text-muted">Convert to:</div>
          <div className="flex flex-col gap-1.5">
            {(["yaml", "xml", "csv"] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => {
                  if (fmt === "yaml") onConvertToYaml();
                  else if (fmt === "xml") onConvertToXml();
                  else onConvertToCsv();
                  setConvertOpen(false);
                }}
                className="w-full rounded-sm border border-line bg-white px-3 py-1.5 text-left text-xs font-extrabold hover:bg-paper"
              >
                Convert to {fmt.toUpperCase()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setConvertOpen(false);
              }}
              className="w-full rounded-sm border border-line bg-white px-3 py-1.5 text-left text-xs text-muted hover:bg-paper"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-auto border-t border-line px-3 pt-2 pb-3">
        {(() => {
          const { enabled, reason } = getActionEligibility(state, "repair-json");
          return (
            <DisabledReason reason={reason}>
              <button
                type="button"
                disabled={!enabled}
                onClick={onRepair}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2 rounded-[6px] border px-3 text-xs font-extrabold transition-colors",
                  enabled
                    ? "border-red-accent bg-red-accent text-white hover:brightness-110"
                    : "pointer-events-none border-line bg-white opacity-40",
                )}
              >
                <Hammer size={16} aria-hidden="true" />
                Repair JSON
              </button>
            </DisabledReason>
          );
        })()}
      </div>

      <div className="border-t border-line px-3 py-2 text-center">
        <p className="text-[11px] font-semibold text-muted">
          Validation runs automatically
        </p>
      </div>
    </section>
  );
}
