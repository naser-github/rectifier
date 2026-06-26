import { Upload, X } from "lucide-react";
import { useCallback, useRef, type ReactNode } from "react";
import type { Diagnostic } from "../../domain/diagnostics";
import { DisabledReason } from "../ui/DisabledReason";
import { IconButton } from "../ui/IconButton";
import { readJsonFile } from "../../lib/files";
import { cn } from "../../lib/cn";

interface SchemaDrawerProps {
  readonly open: boolean;
  readonly schemaText: string;
  readonly schemaDiagnostics: readonly Diagnostic[];
  readonly eligible: boolean;
  readonly eligibilityReason: string;
  readonly onToggle: () => void;
  readonly onSchemaTextChange: (text: string) => void;
  readonly onCheckSchema: () => void;
  readonly onClear: () => void;
}

export function SchemaDrawer({
  open,
  schemaText,
  schemaDiagnostics,
  eligible,
  eligibilityReason,
  onToggle,
  onSchemaTextChange,
  onCheckSchema,
  onClear,
}: SchemaDrawerProps): ReactNode {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (!file) return;

      void readJsonFile(file).then((result) => {
        if (result.kind === "accepted") {
          onSchemaTextChange(result.text);
        }
      });

      e.target.value = "";
    },
    [onSchemaTextChange],
  );

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 -mr-[1px] min-h-24 rounded-l-[5px] border border-line bg-paper px-2.5 text-[11px] font-extrabold uppercase tracking-wider text-muted transition-colors hover:bg-white hover:text-black",
          open && "bg-white text-black",
        )}
        style={{ writingMode: "vertical-rl" }}
      >
        Schema
      </button>

      {open && (
        <div className="flex w-72 flex-col border-l border-line bg-paper p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-muted">
              JSON Schema
            </span>
            <IconButton
              icon={<X size={14} />}
              label="Close schema drawer"
              onClick={onToggle}
            />
          </div>

          <textarea
            value={schemaText}
            onChange={(e) => {
              onSchemaTextChange(e.target.value);
            }}
            placeholder="Paste or upload a JSON Schema..."
            className="min-h-[120px] flex-1 resize-none rounded-sm border border-line bg-white p-2 font-code text-xs leading-relaxed focus-visible:outline-2 focus-visible:outline-red-accent"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelected}
          />

          <div className="mt-2 flex items-center gap-1">
            <IconButton
              icon={<Upload size={14} />}
              label="Upload schema"
              tooltip="Upload a .json schema"
              onClick={handleUpload}
            />
            <IconButton
              icon={<X size={14} />}
              label="Clear schema"
              tooltip="Clear schema"
              onClick={onClear}
            />
          </div>

          <div className="mt-3">
            <DisabledReason reason={eligibilityReason}>
              <button
                type="button"
                disabled={!eligible}
                onClick={onCheckSchema}
                className={cn(
                  "w-full rounded-sm border px-3 py-1.5 text-xs font-extrabold transition-colors",
                  eligible
                    ? "border-line bg-white hover:bg-paper"
                    : "pointer-events-none border-line bg-white opacity-40",
                )}
              >
                Check Schema
              </button>
            </DisabledReason>
          </div>

          {schemaDiagnostics.length > 0 && (
            <div className="mt-3 space-y-1">
              {schemaDiagnostics.map((d, i) => (
                <p key={i} className="text-[11px] leading-relaxed text-red-accent">
                  {d.message}
                </p>
              ))}
            </div>
          )}

          {schemaDiagnostics.length === 0 && schemaText && (
            <p className="mt-3 text-[11px] text-muted">
              JSON is valid against the schema.
            </p>
          )}
        </div>
      )}
    </>
  );
}
