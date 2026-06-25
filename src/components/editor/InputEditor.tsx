/**
 * Controlled CodeMirror 6 editor for JSON input.
 *
 * Features:
 * - JSON syntax highlighting via @codemirror/lang-json
 * - Line numbers and code folding for objects / arrays
 * - Controlled value + onChange (never mutates caller's value)
 * - Error decorations from `diagnostics` prop (confirmed only)
 * - Auto-focus + scroll to first confirmed error; red caret + red highlight
 *   while an error is focused (PRD §7.3)
 * - Imperative `focusLocation` handle so ErrorTray can move caret to any error
 *
 * Design token: the CodeMirror theme references `var(--color-red)` defined in
 * src/styles/global.css :root — no edit to global.css is needed and no raw hex
 * is duplicated here.
 *
 * Non-color error cue (PRD §16): `.cm-error-mark` applies a wavy red underline
 * in addition to the red color, so errors are distinguishable without relying
 * on color alone.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

import { StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  lineNumbers,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import {
  codeFolding,
  defaultHighlightStyle,
  foldGutter,
  syntaxHighlighting,
} from "@codemirror/language";
import { json } from "@codemirror/lang-json";
import { EditorState, type Extension } from "@codemirror/state";

import type { SourcePosition } from "../../domain/diagnostics";
import type { Diagnostic } from "../../domain/diagnostics";
import {
  buildErrorDecorations,
  errorTokenRange,
  firstConfirmedError,
} from "./errorDecorations";

// CSS variable holding the red accent — defined in src/styles/global.css :root.
// Using the variable keeps the token in one place and avoids a global.css edit.
const RED_ACCENT_VAR = "var(--color-red)";

// Translucent red for the focused-error selection highlight. Derived from the
// single red design token via color-mix (28% over transparent) so no raw hex is
// duplicated and global.css stays untouched — matches the approved prototype's
// selection background (rgba(234,66,66,.28)).
const ERROR_SELECTION_BACKGROUND = `color-mix(in srgb, ${RED_ACCENT_VAR} 28%, transparent)`;

// CSS class applied to the .cm-editor element when the editor has errors.
const ERROR_FOCUSED_CLASS = "cm-error-focused";

// ---------------------------------------------------------------------------
// CodeMirror theme extension
// ---------------------------------------------------------------------------
const errorFocusTheme = EditorView.theme({
  // Red caret when the editor has confirmed errors.
  [`&.${ERROR_FOCUSED_CLASS} .cm-cursor`]: {
    borderLeftColor: RED_ACCENT_VAR,
  },
  // Visible red highlight over the focused error selection (PRD §7.3).
  [`&.${ERROR_FOCUSED_CLASS} .cm-selectionBackground`]: {
    backgroundColor: ERROR_SELECTION_BACKGROUND,
  },
  // Error mark: red text color + underline (non-color cue, PRD §16).
  "& .cm-error-mark": {
    color: RED_ACCENT_VAR,
    textDecoration: `underline wavy ${RED_ACCENT_VAR}`,
  },
});

// ---------------------------------------------------------------------------
// StateEffect + StateField for controlled error decorations.
// ---------------------------------------------------------------------------
const setErrorDecorationsEffect = StateEffect.define<DecorationSet>();

const errorDecorationsField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    let updated = value.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setErrorDecorationsEffect)) {
        updated = effect.value;
      }
    }
    return updated;
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});

// ---------------------------------------------------------------------------
// ViewPlugin that forwards document changes to the onChange callback.
// ---------------------------------------------------------------------------
const makeOnChangePlugin = (onChange: (text: string) => void): Extension =>
  ViewPlugin.fromClass(
    class {
      update(update: ViewUpdate): void {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }
    },
  );

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface InputEditorProps {
  readonly value: string;
  readonly onChange: (text: string) => void;
  readonly diagnostics: readonly Diagnostic[];
}

export interface InputEditorHandle {
  /** Move the editor caret and focus to the given source position. */
  focusLocation(position: SourcePosition): void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const InputEditor = forwardRef<InputEditorHandle, InputEditorProps>(
  function InputEditor({ value, onChange, diagnostics }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    // Track whether the editor currently has confirmed errors.
    const [hasConfirmedError, setHasConfirmedError] = useState(false);

    // Keep onChange in a ref so the ViewPlugin closure is always current.
    const onChangeRef = useRef(onChange);
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    // -----------------------------------------------------------------------
    // Mount the EditorView once and destroy it on unmount.
    // -----------------------------------------------------------------------
    useEffect(() => {
      const container = containerRef.current;
      if (container === null) return;

      const view = new EditorView({
        state: EditorState.create({
          doc: value,
          extensions: [
            lineNumbers(),
            foldGutter(),
            codeFolding(),
            json(),
            syntaxHighlighting(defaultHighlightStyle),
            errorDecorationsField,
            errorFocusTheme,
            makeOnChangePlugin((text) => {
              onChangeRef.current(text);
            }),
            EditorView.lineWrapping,
          ],
        }),
        parent: container,
      });

      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: mount once
    }, []);

    // -----------------------------------------------------------------------
    // Sync controlled value into the editor when it changes externally.
    // -----------------------------------------------------------------------
    useEffect(() => {
      const view = viewRef.current;
      if (view === null) return;

      const current = view.state.doc.toString();
      if (current === value) return;

      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }, [value]);

    // -----------------------------------------------------------------------
    // Sync diagnostics → decorations + error-focused state.
    // -----------------------------------------------------------------------
    useEffect(() => {
      const view = viewRef.current;
      if (view === null) return;

      const decos = buildErrorDecorations(diagnostics, view.state);
      view.dispatch({ effects: setErrorDecorationsEffect.of(decos) });

      const first = firstConfirmedError(diagnostics);
      const hasError = first !== undefined;
      setHasConfirmedError(hasError);

      // Toggle the red-caret class directly on view.dom (.cm-editor).
      if (hasError) {
        view.dom.classList.add(ERROR_FOCUSED_CLASS);
        // Select the error token (non-collapsed) so a visible red highlight is
        // shown — not just a caret (PRD §7.3) — and scroll it into view.
        const { from, to } = errorTokenRange(
          view.state.doc.toString(),
          first.position.offset,
        );
        view.dispatch({
          selection: { anchor: from, head: to },
          scrollIntoView: true,
        });
      } else {
        view.dom.classList.remove(ERROR_FOCUSED_CLASS);
      }
    }, [diagnostics]);

    // -----------------------------------------------------------------------
    // Imperative handle — focusLocation.
    // -----------------------------------------------------------------------
    useImperativeHandle(
      ref,
      () => ({
        focusLocation(position: SourcePosition): void {
          const view = viewRef.current;
          if (view === null) return;

          // Select the error token (non-collapsed) so the focused error shows a
          // visible red highlight, consistent with the auto-focus path (PRD §7.3).
          const { from, to } = errorTokenRange(
            view.state.doc.toString(),
            position.offset,
          );
          view.dispatch({
            selection: { anchor: from, head: to },
            scrollIntoView: true,
          });
          view.focus();
        },
      }),
      [],
    );

    // -----------------------------------------------------------------------
    // Render.
    // -----------------------------------------------------------------------
    return (
      <div
        role="region"
        aria-label="Input JSON editor"
        data-has-error={hasConfirmedError ? "" : undefined}
        className="h-full w-full overflow-hidden"
      >
        <div ref={containerRef} className="h-full w-full font-mono text-sm" />
      </div>
    );
  },
);
