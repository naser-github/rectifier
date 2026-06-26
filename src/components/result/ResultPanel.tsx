import { Copy, Download } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { ResultDocument } from "../../domain/result";
import { useDownload } from "../../hooks/useDownload";
import { cn } from "../../lib/cn";
import { IconButton } from "../ui/IconButton";
import { Panel } from "../ui/Panel";
import { CodeResultView } from "./CodeResultView";
import { ObjectResultView } from "./ObjectResultView";
import { TreeResultView } from "./TreeResultView";

type ViewMode = "code" | "tree" | "object";

interface ResultPanelProps {
  readonly result: ResultDocument | null;
  readonly resultError?: string | null;
  readonly onJsonResultEdit?: (result: ResultDocument) => void;
}

/**
 * Result panel with Code, Tree, and Object views plus Copy and Download.
 * Converted formats (YAML/XML/CSV) only show the Code view.
 */
export function ResultPanel({
  result,
  resultError = null,
  onJsonResultEdit,
}: ResultPanelProps): ReactNode {
  const [viewMode, setViewMode] = useState<ViewMode>("code");
  const [copied, setCopied] = useState(false);
  const download = useDownload();

  if (!result) {
    return (
      <Panel title="Result">
        <div className="grid min-h-[320px] place-items-center bg-white/50 p-6 text-center">
          <div>
            <p className="text-sm font-extrabold">No result yet</p>
            <p className="mt-2 max-w-64 text-xs leading-5 text-muted">
              Use an action to create formatted or repaired JSON.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  const isJson = result.format === "json";

  const handleCopy = (): void => {
    navigator.clipboard.writeText(result.text).catch(() => undefined);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleDownload = (): void => {
    download(result.text, result.format);
  };

  const handleCodeChange = (text: string): void => {
    if (!isJson) return;
    onJsonResultEdit?.({ ...result, text });
  };

  return (
    <Panel
      title="Result"
      status={result.action}
      actions={
        <>
          {(["code", "tree", "object"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={!isJson && mode !== "code"}
              onClick={() => {
                setViewMode(mode);
              }}
              className={cn(
                "rounded-sm px-2 py-0.5 text-[11px] font-extrabold uppercase transition-colors",
                viewMode === mode
                  ? "bg-black text-white"
                  : "text-muted hover:bg-black/5 hover:text-black",
                !isJson && mode !== "code" && "pointer-events-none opacity-40",
              )}
              aria-label={`${mode} view`}
            >
              {mode}
            </button>
          ))}
          <IconButton
            icon={<Copy size={14} />}
            label="Copy result"
            tooltip={copied ? "Copied!" : "Copy result"}
            onClick={handleCopy}
          />
          {copied && (
            <span role="status" className="sr-only">
              Copied result
            </span>
          )}
          <IconButton
            icon={<Download size={14} />}
            label="Download result"
            tooltip="Download result"
            onClick={handleDownload}
          />
        </>
      }
    >
      {viewMode === "code" && (
        <CodeResultView
          text={result.text}
          format={result.format}
          readOnly={!isJson}
          onChange={handleCodeChange}
        />
      )}
      {viewMode === "tree" && isJson && <TreeResultView json={result.text} />}
      {viewMode === "object" && isJson && <ObjectResultView json={result.text} />}
      {resultError !== null && (
        <p className="border-t border-line bg-white/70 px-3 py-2 text-xs font-semibold text-red-accent">
          {resultError}
        </p>
      )}
    </Panel>
  );
}
