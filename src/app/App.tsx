import { useEffect, useRef, useState, type ReactNode } from "react";

import type { Diagnostic, SourcePosition } from "../domain/diagnostics";
import type { WorkerRequest, WorkerResponse } from "../domain/workerProtocol";
import { InputEditor, type InputEditorHandle } from "../components/editor/InputEditor";
import { ErrorTray } from "../components/errors/ErrorTray";
import { useAutoValidation } from "../hooks/useAutoValidation";
import {
  createWorkerClient,
  type WorkerClient,
  type WorkerLike,
} from "../hooks/useWorkerClient";
import { cn } from "../lib/cn";

const sampleJson = `{
  "name": "Rectifier",
  "private": true,
  "status": "example"
}`;

export interface AppProps {
  readonly workerClient?: WorkerClient;
}

export function App({ workerClient }: AppProps) {
  if (workerClient !== undefined) {
    return <RectifierWorkspace workerClient={workerClient} />;
  }

  return <ProductionRectifierWorkspace />;
}

function ProductionRectifierWorkspace() {
  const [workerClient] = useState<WorkerClient>(() =>
    createWorkerClient(createJsonWorker(), () => undefined),
  );

  useEffect(() => {
    return () => {
      workerClient.dispose();
    };
  }, [workerClient]);

  return <RectifierWorkspace workerClient={workerClient} />;
}

function RectifierWorkspace({ workerClient }: { readonly workerClient: WorkerClient }) {
  const [input, setInput] = useState(sampleJson);
  const editorRef = useRef<InputEditorHandle>(null);
  const { diagnostics, eligibility, setSource, sizeError } = useAutoValidation({
    client: workerClient,
    initialRevision: 0,
  });
  const confirmedDiagnostics = diagnostics.filter(
    (diagnostic) => diagnostic.reliability === "confirmed",
  );
  const inputStatus = getInputStatus({
    confirmedDiagnostics,
    hasEligibility: eligibility !== null,
    sizeError,
  });

  useEffect(() => {
    setSource(sampleJson, true);
  }, [setSource]);

  const handleInputChange = (text: string): void => {
    setInput(text);
    setSource(text, false);
  };

  const handleFocusLocation = (position: SourcePosition): void => {
    editorRef.current?.focusLocation(position);
  };

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
            <WorkspacePanel title="Input JSON" status={inputStatus}>
              <div className="min-h-[420px] bg-white/50">
                <InputEditor
                  ref={editorRef}
                  value={input}
                  onChange={handleInputChange}
                  diagnostics={diagnostics}
                />
              </div>
            </WorkspacePanel>

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

            <WorkspacePanel title="Result" status="No result yet">
              <div className="grid min-h-[320px] place-items-center bg-white/50 p-6 text-center">
                <div>
                  <p className="text-sm font-extrabold">No result yet</p>
                  <p className="mt-2 max-w-64 text-xs leading-5 text-muted">
                    Use an action to create formatted or repaired JSON.
                  </p>
                </div>
              </div>
            </WorkspacePanel>
          </main>

          <section
            aria-label="Validation status"
            className="border-t border-line bg-white/45 px-5 py-3"
          >
            {sizeError !== null ? (
              <p className="text-sm font-semibold text-red-accent">{sizeError}</p>
            ) : confirmedDiagnostics.length > 0 ? (
              <ErrorTray
                diagnostics={confirmedDiagnostics}
                onFocusLocation={handleFocusLocation}
              />
            ) : (
              <p className="text-sm font-semibold text-muted">
                {eligibility === null
                  ? "Checking JSON..."
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

const getInputStatus = ({
  confirmedDiagnostics,
  hasEligibility,
  sizeError,
}: {
  readonly confirmedDiagnostics: readonly Diagnostic[];
  readonly hasEligibility: boolean;
  readonly sizeError: string | null;
}): string => {
  if (sizeError !== null) {
    return "Input too large";
  }

  if (confirmedDiagnostics.length > 0) {
    return `${String(confirmedDiagnostics.length)} validation error${
      confirmedDiagnostics.length === 1 ? "" : "s"
    }`;
  }

  return hasEligibility ? "Valid JSON" : "Checking JSON";
};

interface WorkspacePanelProps {
  readonly children: ReactNode;
  readonly status: string;
  readonly title: string;
}

function WorkspacePanel({ children, status, title }: WorkspacePanelProps) {
  const headingId = `${title.toLowerCase().replaceAll(" ", "-")}-title`;

  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-[8px] border border-line bg-white/70"
    >
      <div className="flex min-h-13 items-center justify-between gap-3 border-b border-line px-4">
        <div>
          <h2 id={headingId} className="text-sm font-extrabold">
            {title}
          </h2>
          <p className="mt-1 text-[11px] font-semibold text-muted">{status}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
