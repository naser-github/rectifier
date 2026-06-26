import { useCallback, useState, type ReactNode } from "react";
import type { RepairCandidate } from "../../domain/repair";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

interface RepairChoiceDialogProps {
  readonly choices: readonly RepairCandidate[];
  readonly manualGuidance: string;
  readonly open: boolean;
  readonly onApply: (selected: RepairCandidate) => void;
  readonly onEditManually: () => void;
  readonly onClose: () => void;
}

/**
 * Shows multiple verified repair candidates when the engine could not
 * determine the intended meaning. The user must select one choice before
 * Apply is enabled. No candidate is pre-selected. Uses a `key` from the
 * choices to force a fresh component mount (and thus fresh state) whenever
 * the choices or open state change.
 */
export function RepairChoiceDialog({
  choices,
  manualGuidance,
  open,
  onApply,
  onEditManually,
  onClose,
}: RepairChoiceDialogProps): ReactNode {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleApply = useCallback((): void => {
    const selected = choices.find((c) => c.id === selectedId);
    if (selected) {
      onApply(selected);
    }
  }, [choices, selectedId, onApply]);

  if (!open) return null;

  // Use a key based on choices so the component remounts with fresh state
  const dialogKey = choices.map((c) => c.id).join(",");

  return (
    <Dialog
      key={dialogKey}
      open={open}
      onClose={onClose}
      title="Ambiguous Repair"
      actions={
        <>
          <Button variant="ghost" onClick={onEditManually}>
            Edit manually
          </Button>
          <Button
            variant="primary"
            disabled={selectedId === null}
            onClick={handleApply}
          >
            Apply selected fix
          </Button>
        </>
      }
    >
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Rectifier found more than one way to fix this JSON and cannot safely choose the
        intended meaning. Select the correct structure below.
      </p>

      <div className="space-y-3">
        {choices.map((choice) => {
          const isSelected = choice.id === selectedId;

          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => {
                setSelectedId(choice.id);
              }}
              className={`w-full rounded-sm border p-3 text-left transition-colors ${
                isSelected
                  ? "border-red-accent bg-red-accent/5 ring-1 ring-red-accent"
                  : "border-line bg-white hover:bg-paper"
              }`}
            >
              <p className="text-sm font-semibold">{choice.summary}</p>
              <pre className="mt-2 overflow-auto rounded-sm bg-paper p-2 font-code text-xs leading-relaxed">
                {choice.repairedText}
              </pre>
              {choice.edits.length > 0 && (
                <div className="mt-2 text-[11px] text-muted">
                  {choice.edits.length} syntax change
                  {choice.edits.length === 1 ? "" : "s"}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {manualGuidance && (
        <p className="mt-4 text-xs leading-relaxed text-muted">{manualGuidance}</p>
      )}
    </Dialog>
  );
}
