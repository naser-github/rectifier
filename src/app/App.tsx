import { useCallback, useEffect, useRef, useState } from "react";

import type { SourcePosition } from "../domain/diagnostics";
import type { WorkerRequest, WorkerResponse } from "../domain/workerProtocol";
import { ErrorTray } from "../components/errors/ErrorTray";
import { useWorkspaceController } from "../hooks/useWorkspaceController";
import {
  createWorkerClient,
  type WorkerClient,
  type WorkerLike,
} from "../hooks/useWorkerClient";
import { InputPanel } from "../components/editor/InputPanel";
import type { InputEditorHandle } from "../components/editor/InputEditor";
import { Panel } from "../components/ui/Panel";
import { TooltipProvider } from "../components/ui/Tooltip";
import { readJsonFile } from "../lib/files";
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

function RectifierApp({ workerClient }: { readonly workerClient: WorkerClient }) {
  const controller = useWorkspaceController(workerClient);
  const editorRef = useRef<InputEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            <p className="text-xs font-semibold text-muted">
              Your JSON stays in this browser
            </p>
          </header>

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
                {["Beautify", "Minify", "Convert", "Repair JSON"].map((label) => (
                  <button
                    className={cn(
                      "min-h-11 rounded-[6px] border border-line bg-white px-3 text-left text-xs font-extrabold",
                      label === "Repair JSON" &&
                        "mt-2 border-red-accent bg-red-accent text-white",
                    )}
                    key={label}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>

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
          </main>

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
