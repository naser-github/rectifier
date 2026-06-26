import { useCallback } from "react";
import type { WorkerClient } from "./useWorkerClient";

export interface ProcessingActions {
  readonly beautify: () => void;
  readonly minify: () => void;
  readonly convertToYaml: () => void;
  readonly convertToXml: () => void;
  readonly convertToCsv: () => void;
  readonly validateSchema: (schemaText: string) => void;
}

/**
 * Provides action callbacks for processing actions (format, convert, schema).
 * These actions require an up-to-date source revision to operate on.
 */
export function useProcessingActions(
  client: WorkerClient,
  revision: number,
): ProcessingActions {
  const beautify = useCallback((): void => {
    client.format(revision, "beautify");
  }, [client, revision]);

  const minify = useCallback((): void => {
    client.format(revision, "minify");
  }, [client, revision]);

  const convertToYaml = useCallback((): void => {
    client.convert(revision, "yaml");
  }, [client, revision]);

  const convertToXml = useCallback((): void => {
    client.convert(revision, "xml");
  }, [client, revision]);

  const convertToCsv = useCallback((): void => {
    client.convert(revision, "csv");
  }, [client, revision]);

  const validateSchema = useCallback(
    (schemaText: string): void => {
      client.validateSchema(revision, schemaText);
    },
    [client, revision],
  );

  return {
    beautify,
    minify,
    convertToYaml,
    convertToXml,
    convertToCsv,
    validateSchema,
  };
}
