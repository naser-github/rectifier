import { useEffect, useState } from "react";

import type { ResultDocument } from "../domain/result";
import type {
  ConversionFormat,
  FormatOperation,
  WorkerRequest,
  WorkerResponse,
  WorkerSourceRevision,
} from "../domain/workerProtocol";

/**
 * Minimal injectable boundary for the background worker so tests can substitute
 * a fake without a real browser Worker.
 */
export interface WorkerLike {
  onmessage: ((event: { data: WorkerResponse }) => void) | null;
  post(request: WorkerRequest): void;
  terminate(): void;
}

export type WorkerResponseHandler = (response: WorkerResponse) => void;

export interface WorkerClient {
  analyzeRepair(source: WorkerSourceRevision): string;
  convert(revision: number, format: ConversionFormat): string;
  dispose(): void;
  format(revision: number, operation: FormatOperation): string;
  setResponseHandler(handler: WorkerResponseHandler): void;
  setSource(source: WorkerSourceRevision): string;
  validateResult(result: ResultDocument): string;
  validateSchema(revision: number, schemaText: string): string;
}

/**
 * Creates a job- and revision-tracked client over an injected {@link WorkerLike}.
 * It assigns monotonically increasing job ids, tracks the current revision, and
 * drops responses from superseded jobs or revisions so only the latest result is
 * surfaced.
 */
export const createWorkerClient = (
  worker: WorkerLike,
  onResponse: WorkerResponseHandler,
): WorkerClient => {
  let nextJobSequence = 0;
  let latestJobId: string | null = null;
  let currentRevision = -1;
  let responseHandler = onResponse;

  const allocateJobId = (): string => {
    nextJobSequence += 1;
    const jobId = `job-${String(nextJobSequence)}`;
    latestJobId = jobId;
    return jobId;
  };

  worker.onmessage = (event: { data: WorkerResponse }): void => {
    const response = event.data;

    if (response.id !== latestJobId) {
      return;
    }

    if ("revision" in response && response.revision < currentRevision) {
      return;
    }

    responseHandler(response);
  };

  return {
    setSource(source: WorkerSourceRevision): string {
      currentRevision = source.revision;
      const id = allocateJobId();
      worker.post({ id, kind: "set-source", source });
      return id;
    },
    analyzeRepair(source: WorkerSourceRevision): string {
      const id = allocateJobId();
      worker.post({ id, kind: "analyze-repair", source });
      return id;
    },
    validateResult(result: ResultDocument): string {
      const id = allocateJobId();
      worker.post({ id, kind: "validate-result", result });
      return id;
    },
    format(revision: number, operation: FormatOperation): string {
      const id = allocateJobId();
      worker.post({ id, kind: "format", operation, revision });
      return id;
    },
    convert(revision: number, conversionFormat: ConversionFormat): string {
      const id = allocateJobId();
      worker.post({ id, kind: "convert", format: conversionFormat, revision });
      return id;
    },
    validateSchema(revision: number, schemaText: string): string {
      const id = allocateJobId();
      worker.post({ id, kind: "validate-schema", revision, schemaText });
      return id;
    },
    setResponseHandler(handler: WorkerResponseHandler): void {
      responseHandler = handler;
    },
    dispose(): void {
      worker.onmessage = null;
      worker.terminate();
    },
  };
};

export interface UseWorkerClientOptions {
  readonly createWorker: () => WorkerLike;
  readonly onResponse: WorkerResponseHandler;
}

/**
 * React binding around {@link createWorkerClient}. It creates one worker for the
 * component lifetime, keeps the response handler current, and terminates the
 * worker on unmount.
 */
export const useWorkerClient = ({
  createWorker,
  onResponse,
}: UseWorkerClientOptions): WorkerClient => {
  // Lazy initializer runs once, giving one worker for the component lifetime.
  const [client] = useState<WorkerClient>(() =>
    createWorkerClient(createWorker(), onResponse),
  );

  // Keep the latest handler on the client without recreating the worker.
  useEffect(() => {
    client.setResponseHandler(onResponse);
  }, [client, onResponse]);

  useEffect(() => {
    return () => {
      client.dispose();
    };
  }, [client]);

  return client;
};
