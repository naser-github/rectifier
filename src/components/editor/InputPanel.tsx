import { Upload, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Diagnostic, SourcePosition } from "../../domain/diagnostics";
import type { ValidationState } from "../../domain/workspace";
import { DisabledReason } from "../ui/DisabledReason";
import { IconButton } from "../ui/IconButton";
import { Panel } from "../ui/Panel";
import { InputEditor, type InputEditorHandle } from "./InputEditor";

interface InputPanelProps {
  readonly input: string;
  readonly diagnostics: readonly Diagnostic[];
  readonly validationState: ValidationState;
  readonly isExample: boolean;
  readonly sizeError: string | null;
  readonly editorRef?: React.RefObject<InputEditorHandle | null>;
  readonly onInputChange: (text: string) => void;
  readonly onUpload: () => void;
  readonly onClear: () => void;
  readonly onFocusLocation?: (position: SourcePosition) => void;
}

export function InputPanel({
  input,
  diagnostics,
  validationState,
  isExample,
  sizeError,
  editorRef,
  onInputChange,
  onUpload,
  onClear,
}: InputPanelProps): ReactNode {
  const statusText = getStatusText({
    input,
    validationState,
    diagnostics,
    isExample,
    sizeError,
  });

  return (
    <Panel
      title="Input JSON"
      status={statusText}
      className="h-full min-h-0"
      actions={
        <>
          <IconButton
            icon={<Upload size={15} />}
            label="Upload JSON"
            tooltip="Upload a .json file"
            onClick={onUpload}
          />
          <IconButton
            icon={<X size={15} />}
            label="Clear input"
            tooltip="Clear input"
            onClick={onClear}
          />
        </>
      }
    >
      <div className="relative min-h-0 flex-1 bg-white/50">
        <DisabledReason reason={sizeError ?? ""} className="absolute inset-0 z-10">
          <InputEditor
            ref={editorRef}
            value={input}
            onChange={onInputChange}
            diagnostics={diagnostics}
          />
        </DisabledReason>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Status display helpers
// ---------------------------------------------------------------------------

function getStatusText({
  input,
  validationState,
  diagnostics,
  isExample,
  sizeError,
}: {
  readonly input: string;
  readonly validationState: ValidationState;
  readonly diagnostics: readonly Diagnostic[];
  readonly isExample: boolean;
  readonly sizeError: string | null;
}): string {
  if (sizeError !== null) {
    return "Input too large";
  }

  if (!input) {
    return "No input";
  }

  if (isExample) {
    return "Example JSON";
  }

  if (validationState !== "validated") {
    return "Checking JSON…";
  }

  const confirmedCount = diagnostics.filter(
    (d) => d.reliability === "confirmed",
  ).length;

  if (confirmedCount > 0) {
    return `${String(confirmedCount)} validation error${confirmedCount === 1 ? "" : "s"}`;
  }

  return "Valid JSON";
}
