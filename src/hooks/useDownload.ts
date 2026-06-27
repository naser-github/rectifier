import { useCallback } from "react";

const EXTENSIONS: Record<string, string> = {
  json: ".json",
  yaml: ".yaml",
  xml: ".xml",
  csv: ".csv",
};

/**
 * Returns a download handler that creates a blob URL for the given text,
 * triggers a download, and revokes the URL.
 */
export function useDownload(): (text: string, format: string) => void {
  return useCallback((text: string, format: string): void => {
    const ext = EXTENSIONS[format] ?? ".txt";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `result${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);
}
