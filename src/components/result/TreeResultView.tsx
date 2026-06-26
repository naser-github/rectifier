import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { jsonToTreeRows, type TreeRow } from "./treeRows";
import { cn } from "../../lib/cn";

interface TreeResultViewProps {
  readonly json: string;
}

export function TreeResultView({ json }: TreeResultViewProps): ReactNode {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback((id: string): void => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, id: string): void => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      toggle(id);
    },
    [toggle],
  );

  const data = useMemo<TreeRow[]>(() => {
    try {
      return jsonToTreeRows(JSON.parse(json), collapsed);
    } catch {
      return [];
    }
  }, [json, collapsed]);

  // TanStack Virtual returns mutable instance functions; React Compiler cannot safely memoize this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 10,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const visibleItems =
    virtualItems.length > 0
      ? virtualItems
      : data.map((_, index) => ({
          index,
          size: 24,
          start: index * 24,
        }));

  return (
    <div
      ref={parentRef}
      className="h-full min-h-[320px] overflow-auto bg-white/50 font-code text-xs"
    >
      <div
        style={{
          height: String(virtualizer.getTotalSize()) + "px",
          position: "relative" as const,
        }}
      >
        {visibleItems.map((virtualRow) => {
          const row = data[virtualRow.index];
          if (!row) return null;
          return (
            <div
              key={row.id}
              style={{
                position: "absolute" as const,
                top: 0,
                left: 0,
                width: "100%",
                height: String(virtualRow.size) + "px",
                transform: "translateY(" + String(virtualRow.start) + "px)",
              }}
              className="flex items-center gap-1 border-b border-line/20 px-2 hover:bg-black/5"
            >
              <span
                style={{ paddingLeft: String(row.depth * 16) + "px" }}
                className="min-w-[16px] text-center text-muted select-none"
              >
                {row.isObject ? (
                  <button
                    type="button"
                    onClick={function () {
                      toggle(row.id);
                    }}
                    onKeyDown={(event) => {
                      handleToggleKeyDown(event, row.id);
                    }}
                    className="size-4 text-xs hover:text-black focus-visible:outline-2 focus-visible:outline-red-accent"
                    aria-label={row.isCollapsed ? "Expand" : "Collapse"}
                  >
                    {row.isCollapsed ? "\u25B6" : "\u25BC"}
                  </button>
                ) : (
                  <span className="inline-block size-4" />
                )}
              </span>
              {row.key ? (
                <span className="font-semibold text-muted">{row.key}:</span>
              ) : null}
              <span
                className={cn("truncate", row.isObject ? "text-muted" : "text-black")}
              >
                {row.isObject
                  ? row.isCollapsed
                    ? row.isArray
                      ? "[...]"
                      : "{...}"
                    : ""
                  : row.value}
                {row.isCollapsed && row.isObject
                  ? " " + String(row.childrenCount) + " items"
                  : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
