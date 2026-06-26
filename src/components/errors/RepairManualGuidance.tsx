import type { ReactNode } from "react";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";

interface RepairManualGuidanceProps {
  readonly open: boolean;
  readonly guidance: string;
  readonly onEditManually: () => void;
  readonly onClose: () => void;
}

/**
 * Shows manual guidance when the repair engine cannot produce a verified
 * candidate. Provides an Edit manually button that closes the dialog and
 * lets the user fix the JSON by hand.
 */
export function RepairManualGuidance({
  open,
  guidance,
  onEditManually,
  onClose,
}: RepairManualGuidanceProps): ReactNode {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Manual Editing Required"
      actions={
        <Button variant="primary" onClick={onEditManually}>
          Edit manually
        </Button>
      }
    >
      <p className="mb-3 text-sm leading-relaxed text-muted">{guidance}</p>
      <p className="text-xs leading-relaxed text-muted">
        Auto-repair is not available for this JSON. Please edit the input JSON directly
        in the left panel. Once the JSON is valid, formatting and conversion actions
        will become available.
      </p>
    </Dialog>
  );
}
