import { useCallback, useEffect, useRef, useState } from "react";

import type { SourcePosition } from "../domain/diagnostics";
import type { WorkerRequest, WorkerResponse } from "../domain/workerProtocol";
import { ResultPanel } from "../components/result/ResultPanel";
import { SchemaDrawer } from "../components/schema/SchemaDrawer";
import { ErrorTray } from "../components/errors/ErrorTray";
import { RepairChoiceDialog } from "../components/errors/RepairChoiceDialog";
import { RepairManualGuidance } from "../components/errors/RepairManualGuidance";
import { RepairPreviewDialog } from "../components/errors/RepairPreviewDialog";
import { useProcessingActions } from "../hooks/useProcessingActions";
import { useRepairFlow } from "../hooks/useRepairFlow";
import { useWorkspaceController } from "../hooks/useWorkspaceController";
import {
  createWorkerClient,
  type WorkerClient,
  type WorkerLike,
} from "../hooks/useWorkerClient";
import { InputPanel } from "../components/editor/InputPanel";
import type { InputEditorHandle } from "../components/editor/InputEditor";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { DisabledReason } from "../components/ui/DisabledReason";
import { TooltipProvider } from "../components/ui/Tooltip";
import { readJsonFile } from "../lib/files";
import { getActionEligibility, type ActionId } from "../state/actionEligibility";
import { cn } from "../lib/cn";

export interface AppProps {
  readonly workerClient?: WorkerClient;
}

export function App({ workerClient }: AppProps) {
  if (workerClient !== undefined) {
    return (
      <TooltipProvider>
        <RectifierApp workerClient={workerClient} />
      </TooltipProvider>
    );
  }

  return <ProductionRectifierApp />;
}

function ProductionRectifierApp() {
  const [workerClient] = useState<WorkerClient>(() =>
    createWorkerClient(createJsonWorker(), () => undefined),
  );

  useEffect(() => {
    return () => {
      workerClient.dispose();
    };
  }, [workerClient]);

  return (
    <TooltipProvider>
      <RectifierApp workerClient={workerClient} />
    </TooltipProvider>
  );
}

const ACTIONS: { readonly id: ActionId; readonly label: string }[] = [
  { id: "beautify", label: "Beautify" },
  { id: "minify", label: "Minify" },
  { id: "convert", label: "Convert" },
  { id: "repair-json", label: "Repair JSON" },
];

function RectifierApp({ workerClient }: { readonly workerClient: WorkerClient }) {
  const controller = useWorkspaceController(workerClient);
  const editorRef = useRef<InputEditorHandle>(null);

  const handleEditManually = useCallback((): void => {
    const firstError = controller.state.diagnostics.find(
      (d) => d.reliability === "confirmed",
    );
    if (firstError && editorRef.current) {
      editorRef.current.focusLocation(firstError.position);
    }
  }, [controller.state.diagnostics]);

  const repairFlow = useRepairFlow(
    controller.state,
    workerClient,
    controller.dispatch,
    handleEditManually,
  );

  const processing = useProcessingActions(workerClient, controller.state.revision);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storagePopoverOpen, setStoragePopoverOpen] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [schemaText, setSchemaText] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);

  const confirmedDiagnostics = controller.state.diagnostics.filter(
    (d) => d.reliability === "confirmed",
  );

  const handleFocusLocation = useCallback((position: SourcePosition): void => {
    editorRef.current?.focusLocation(position);
  }, []);

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (!file) return;

      void readJsonFile(file).then((result) => {
        if (result.kind === "accepted") {
          controller.handleUpload(result.text);
        }
      });

      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [controller],
  );

  const handleUploadClick = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const handleClearSaved = useCallback((): void => {
    void controller.clearSaved().then(() => {
      setStoragePopoverOpen(false);
    });
  }, [controller]);

  return (
    <div className="min-h-screen bg-neutral-800 p-4 text-black sm:p-6">
      <div className="mx-auto max-w-[1500px] rounded-[8px] bg-black p-3">
        <div className="min-h-[calc(100vh-3.5rem)] overflow-hidden rounded-[7px] border border-black bg-paper bg-paper-texture">
          <header className="flex min-h-16 items-center justify-between gap-4 border-b border-line px-5">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-[5px] bg-red-accent font-code text-xs font-black text-white">
                {"{ }"}
              </span>
              <span className="text-lg font-extrabold">Rectifier</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStoragePopoverOpen(true);
              }}
              className="text-xs font-semibold text-muted hover:text-black focus-visible:outline-2 focus-visible:outline-red-accent focus-visible:outline-offset-2"
            >
              Your JSON stays in this browser
            </button>
          </header>

          <Dialog
            open={storagePopoverOpen}
            onClose={() => {
              setStoragePopoverOpen(false);
            }}
            title="Browser storage"
            actions={
              <Button variant="danger" onClick={handleClearSaved}>
                Clear saved workspace
              </Button>
            }
          >
            <p className="text-sm leading-relaxed text-muted">
              Rectifier saves only your latest workspace locally in this browser. No
              data is sent to a server. Clearing saved data removes persisted work
              without clearing your currently open workspace.
            </p>
          </Dialog>

          <main className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_142px_minmax(0,1fr)]">
            <InputPanel
              input={controller.state.input}
              diagnostics={controller.state.diagnostics}
              validationState={controller.state.validationState}
              isExample={controller.state.isExample}
              sizeError={controller.state.sizeError}
              editorRef={editorRef}
              onInputChange={controller.handleInputChange}
              onUpload={handleUploadClick}
              onClear={controller.handleClear}
              onFocusLocation={handleFocusLocation}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelected}
            />

            <section
              aria-labelledby="actions-title"
              className="flex flex-col rounded-[8px] border border-line bg-white/45"
            >
              <div className="border-b border-line px-3 py-3 text-center">
                <h2 id="actions-title" className="text-sm font-extrabold">
                  Actions
                </h2>
                <p className="mt-1 text-[11px] font-semibold text-muted">
                  Validation runs automatically
                </p>
              </div>
              <div className="flex flex-col gap-2 p-3">
                {ACTIONS.map(({ id, label }) => {
                  const { enabled, reason } = getActionEligibility(
                    controller.state,
                    id,
                  );

                  return (
                    <DisabledReason key={id} reason={reason}>
                      <button
                        type="button"
                        disabled={!enabled}
                        onClick={
                          id === "beautify"
                            ? processing.beautify
                            : id === "minify"
                              ? processing.minify
                              : id === "convert"
                                ? () => {
                                    setConvertOpen(true);
                                  }
                                : id === "repair-json"
                                  ? repairFlow.startRepairAnalysis
                                  : undefined
                        }
                        className={cn(
                          "min-h-11 w-full rounded-[6px] border px-3 text-left text-xs font-extrabold transition-colors",
                          enabled && id === "repair-json"
                            ? "border-red-accent bg-red-accent text-white hover:brightness-110"
                            : enabled
                              ? "border-line bg-white hover:bg-paper"
                              : "pointer-events-none border-line bg-white opacity-40",
                        )}
                      >
                        {label}
                      </button>
                    </DisabledReason>
                  );
                })}
              </div>

              {convertOpen && (
                <div className="border-t border-line p-3">
                  <div className="mb-2 text-[11px] font-semibold text-muted">
                    Convert to:
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {(["yaml", "xml", "csv"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => {
                          if (fmt === "yaml") processing.convertToYaml();
                          else if (fmt === "xml") processing.convertToXml();
                          else processing.convertToCsv();
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
            </section>

            <div className="relative">
              <ResultPanel
                result={controller.state.result}
                resultError={controller.state.resultError}
                onJsonResultEdit={controller.handleResultEdit}
              />

              <SchemaDrawer
                open={schemaOpen}
                schemaText={schemaText}
                schemaDiagnostics={controller.state.schemaDiagnostics}
                eligible={
                  getActionEligibility(controller.state, "schema-check").enabled
                }
                eligibilityReason={
                  getActionEligibility(controller.state, "schema-check").reason
                }
                onToggle={() => {
                  setSchemaOpen(!schemaOpen);
                }}
                onSchemaTextChange={setSchemaText}
                onCheckSchema={() => {
                  processing.validateSchema(schemaText);
                }}
                onClear={() => {
                  setSchemaText("");
                }}
              />
            </div>
          </main>

          {repairFlow.showSafePreview && repairFlow.safeCandidate && (
            <RepairPreviewDialog
              candidate={repairFlow.safeCandidate}
              open={true}
              onAccept={repairFlow.acceptRepair}
              onReject={repairFlow.rejectRepair}
            />
          )}

          {repairFlow.showAmbiguousChoices && (
            <RepairChoiceDialog
              choices={repairFlow.ambiguousChoices}
              manualGuidance=""
              open={true}
              onApply={repairFlow.applyAmbiguousChoice}
              onEditManually={repairFlow.editManually}
              onClose={repairFlow.rejectRepair}
            />
          )}

          {repairFlow.showManualGuidance && repairFlow.manualGuidance && (
            <RepairManualGuidance
              open={true}
              guidance={repairFlow.manualGuidance}
              onEditManually={repairFlow.editManually}
              onClose={repairFlow.rejectRepair}
            />
          )}

          <section
            aria-label="Validation status"
            className="border-t border-line bg-white/45 px-5 py-3"
          >
            {controller.state.sizeError !== null ? (
              <p className="text-sm font-semibold text-red-accent">
                {controller.state.sizeError}
              </p>
            ) : confirmedDiagnostics.length > 0 ? (
              <ErrorTray
                diagnostics={confirmedDiagnostics}
                onFocusLocation={handleFocusLocation}
              />
            ) : (
              <p className="text-sm font-semibold text-muted">
                {controller.state.eligibility === null
                  ? "Checking JSON…"
                  : "JSON is valid. Validation runs automatically."}
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const createJsonWorker = (): WorkerLike => {
  const worker = new Worker(new URL("../worker/json.worker.ts", import.meta.url), {
    type: "module",
  });
  const workerLike: WorkerLike = {
    onmessage: null,
    post(request: WorkerRequest): void {
      worker.postMessage(request);
    },
    terminate(): void {
      worker.terminate();
    },
  };

  worker.onmessage = (event: MessageEvent<WorkerResponse>): void => {
    workerLike.onmessage?.({ data: event.data });
  };

  return workerLike;
};
