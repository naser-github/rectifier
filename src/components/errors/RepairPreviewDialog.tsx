import type { ReactNode } from "react";
import type { RepairCandidate } from "../../domain/repair";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

const REPAIR_PREVIEW_CHARACTER_LIMIT = 20_000;

interface RepairPreviewDialogProps {
  readonly candidate: RepairCandidate;
  readonly open: boolean;
  readonly onAccept: () => void;
  readonly onReject: () => void;
}

/**
 * Shows a before-and-after preview of a single verified safe repair.
 * The user must Accept or Reject the proposed syntax changes.
 */
export function RepairPreviewDialog({
  candidate,
  open,
  onAccept,
  onReject,
}: RepairPreviewDialogProps): ReactNode {
  const isPreviewTruncated =
    candidate.repairedText.length > REPAIR_PREVIEW_CHARACTER_LIMIT;
  const repairedPreview = isPreviewTruncated
    ? `${candidate.repairedText.slice(0, REPAIR_PREVIEW_CHARACTER_LIMIT)}\n\nPreview truncated. Accept applies the full repaired JSON.`
    : candidate.repairedText;

  return (
    <Dialog
      open={open}
      onClose={onReject}
      title="Repair Preview"
      actions={
        <>
          <Button variant="secondary" onClick={onReject}>
            Reject
          </Button>
          <Button variant="primary" onClick={onAccept}>
            Accept
          </Button>
        </>
      }
    >
      <p className="mb-3 text-sm font-semibold">{candidate.summary}</p>

      <div className="mb-2 text-xs font-semibold text-muted">Repaired JSON:</div>
      <pre className="max-h-60 overflow-auto rounded-sm border border-line bg-paper p-3 font-code text-xs leading-relaxed">
        {repairedPreview}
      </pre>

      {candidate.edits.length > 0 && (
        <div className="mt-3 space-y-1">
          <div className="text-xs font-semibold text-muted">Syntax changes:</div>
          {candidate.edits.map((edit, i) => (
            <div
              key={i}
              className="rounded-sm bg-red-accent/5 px-2 py-1 text-xs text-red-accent"
            >
              <span className="font-semibold">{edit.type}</span>
              {" at offset "}
              <span className="font-mono">{edit.startOffset}</span>
              {edit.replacement && (
                <>
                  {" → "}
                  <span className="font-mono">{edit.replacement}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}
