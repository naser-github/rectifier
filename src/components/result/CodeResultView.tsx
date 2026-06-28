import type { ReactNode } from "react";
import { ResultEditor } from "../editor/ResultEditor";

interface CodeResultViewProps {
  readonly text: string;
  readonly format: string;
  readonly readOnly?: boolean;
  readonly onChange?: (text: string) => void;
}

export function CodeResultView({
  text,
  format,
  readOnly = false,
  onChange,
}: CodeResultViewProps): ReactNode {
  return (
    <div className="h-full min-h-0 w-full bg-white/50">
      <ResultEditor
        value={text}
        language={format === "json" ? "json" : "text"}
        readOnly={readOnly}
        onChange={onChange}
      />
    </div>
  );
}
