/**
 * Error Tray — lists confirmed diagnostics with message, line, and column.
 *
 * Each item is a keyboard-activatable button. Activating it calls
 * `onFocusLocation` with the diagnostic's source position so the editor
 * can scroll to and highlight the exact error location.
 *
 * Accessibility (PRD §16, AGENTS.md §11):
 * - Error state is communicated via text (message + location), not color alone.
 * - Each button has an accessible name derived from the error message.
 * - Focus states are visible via the global button:focus-visible outline rule.
 * - The list uses <ul>/<li> for semantic structure.
 */

import type { ReactElement } from "react";

import type { Diagnostic } from "../../domain/diagnostics";
import type { SourcePosition } from "../../domain/diagnostics";

export interface ErrorTrayProps {
  /** Diagnostics to display — caller should pass only confirmed ones, but the
   *  tray filters to confirmed itself for safety. */
  readonly diagnostics: readonly Diagnostic[];
  /** Called when the user activates an error item. */
  readonly onFocusLocation: (position: SourcePosition) => void;
}

export function ErrorTray({
  diagnostics,
  onFocusLocation,
}: ErrorTrayProps): ReactElement | null {
  const confirmed = diagnostics.filter((d) => d.reliability === "confirmed");

  if (confirmed.length === 0) {
    return null;
  }

  return (
    <ul role="list" className="flex flex-col gap-1 p-2" aria-label="Validation errors">
      {confirmed.map((d, index) => (
        <li key={`${d.code}-${String(d.position.offset)}-${String(index)}`}>
          <button
            type="button"
            aria-label={`Error: ${d.message} Line ${String(d.position.line)}, Col ${String(d.position.column)}`}
            className="flex w-full items-start gap-2 rounded px-2 py-1 text-left text-sm hover:bg-black/5"
            onClick={() => {
              onFocusLocation(d.position);
            }}
          >
            {/* Non-color error indicator: text prefix (PRD §16) */}
            <span className="shrink-0 font-semibold text-red-accent" aria-hidden="true">
              ✕
            </span>
            <span className="flex flex-col">
              <span>{d.message}</span>
              <span className="text-xs text-muted">
                Line {d.position.line}, Col {d.position.column}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
