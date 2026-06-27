import { useCallback, useEffect, useRef, useState } from "react";

import type { SourcePosition } from "../domain/diagnostics";
import type { WorkerRequest, WorkerResponse } from "../domain/workerProtocol";
import { ActionDock } from "../components/actions/ActionDock";
import { ErrorTray } from "../components/errors/ErrorTray";
import { RepairChoiceDialog } from "../components/errors/RepairChoiceDialog";
import { RepairManualGuidance } from "../components/errors/RepairManualGuidance";
import { RepairPreviewDialog } from "../components/errors/RepairPreviewDialog";
import { Header } from "../components/layout/Header";
import { MobileWorkspaceTabs } from "../components/layout/MobileWorkspaceTabs";
import type { MobileTab } from "../components/layout/MobileWorkspaceTabs";
import { Workspace } from "../components/layout/Workspace";
import { ResultPanel } from "../components/result/ResultPanel";
import { SchemaDrawer } from "../components/schema/SchemaDrawer";
import { readJsonFile } from "../lib/files";
import { InputPanel } from "../components/editor/InputPanel";
import type { InputEditorHandle } from "../components/editor/InputEditor";
import { TooltipProvider } from "../components/ui/Tooltip";
import { useProcessingActions } from "../hooks/useProcessingActions";
import { useRepairFlow } from "../hooks/useRepairFlow";
import { useWorkspaceController } from "../hooks/useWorkspaceController";
import {
  createWorkerClient,
  type WorkerClient,
  type WorkerLike,
} from "../hooks/useWorkerClient";
import { getActionEligibility } from "../state/actionEligibility";

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
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [schemaText, setSchemaText] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("input");

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

      e.target.value = "";
    },
    [controller],
  );

  const handleUploadClick = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const handleClearSaved = useCallback((): void => {
    void controller.clearSaved();
  }, [controller]);

  return (
    <div className="min-h-screen bg-neutral-800 p-4 text-black sm:p-6">
      <div className="mx-auto max-w-[1500px] rounded-[8px] bg-black p-3">
        <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden rounded-[7px] border border-black bg-paper bg-paper-texture">
          <Header onClearSaved={handleClearSaved} />

          <MobileWorkspaceTabs
            activeTab={mobileTab}
            onTabChange={setMobileTab}
            hasResult={controller.state.result !== null}
          />

          <Workspace
            input={
              <div className={`${mobileTab === "input" ? "block" : "hidden"} lg:block`}>
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
              </div>
            }
            actions={
              <div className={`${mobileTab === "input" ? "block" : "hidden"} lg:block`}>
                <ActionDock
                  state={controller.state}
                  onBeautify={processing.beautify}
                  onMinify={processing.minify}
                  onConvertToYaml={processing.convertToYaml}
                  onConvertToXml={processing.convertToXml}
                  onConvertToCsv={processing.convertToCsv}
                  onRepair={repairFlow.startRepairAnalysis}
                />
              </div>
            }
            result={
              <div
                className={`${mobileTab === "result" ? "block" : "hidden"} lg:block`}
              >
                <ResultPanel
                  result={controller.state.result}
                  resultError={controller.state.resultError}
                  onJsonResultEdit={controller.handleResultEdit}
                />
              </div>
            }
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileSelected}
          />

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
                  ? "Checking JSON\u2026"
                  : "JSON is valid. Validation runs automatically."}
              </p>
            )}
          </section>

          <SchemaDrawer
            open={schemaOpen}
            schemaText={schemaText}
            schemaDiagnostics={controller.state.schemaDiagnostics}
            eligible={getActionEligibility(controller.state, "schema-check").enabled}
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
