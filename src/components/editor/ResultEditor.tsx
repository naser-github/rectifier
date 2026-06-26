import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { EditorView, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { json } from "@codemirror/lang-json";
import {
  codeFolding,
  foldGutter,
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";

export interface ResultEditorProps {
  readonly value: string;
  readonly language: "json" | "text";
  readonly readOnly?: boolean;
  readonly onChange?: ((text: string) => void) | undefined;
}

export interface ResultEditorHandle {
  focus(): void;
}

export const ResultEditor = forwardRef<ResultEditorHandle, ResultEditorProps>(
  function ResultEditor({ value, language, readOnly = false, onChange }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useImperativeHandle(ref, () => ({
      focus() {
        viewRef.current?.focus();
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (container === null) return;

      const extensions = [
        lineNumbers(),
        foldGutter(),
        codeFolding(),
        syntaxHighlighting(defaultHighlightStyle),
        EditorView.lineWrapping,
        EditorView.editable.of(!readOnly),
      ];

      if (language === "json") {
        extensions.push(json());
      }

      if (onChange && !readOnly) {
        extensions.push(
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current?.(update.state.doc.toString());
            }
          }),
        );
      }

      const view = new EditorView({
        state: EditorState.create({ doc: value, extensions }),
        parent: container,
      });

      viewRef.current = view;
      return () => {
        view.destroy();
        viewRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync external value changes into the editor
    useEffect(() => {
      const view = viewRef.current;
      if (view === null) return;
      const current = view.state.doc.toString();
      if (current === value) return;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    }, [value]);

    return <div ref={containerRef} className="h-full w-full font-code text-sm" />;
  },
);
