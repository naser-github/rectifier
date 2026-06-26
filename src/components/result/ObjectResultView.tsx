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

interface ObjectResultViewProps {
  readonly json: string;
}

export function ObjectResultView({ json }: ObjectResultViewProps): ReactNode {
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

  const rows = useMemo<TreeRow[]>(() => {
    try {
      return jsonToTreeRows(JSON.parse(json), collapsed);
    } catch {
      return [];
    }
  }, [json, collapsed]);

  // TanStack Virtual returns mutable instance functions; React Compiler cannot safely memoize this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 10,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const visibleItems =
    virtualItems.length > 0
      ? virtualItems
      : rows.map((_, index) => ({
          index,
          size: 32,
          start: index * 32,
        }));

  return (
    <div ref={parentRef} className="h-full min-h-[320px] overflow-auto bg-white/50 p-2">
      <div
        style={{
          height: String(virtualizer.getTotalSize()) + "px",
          position: "relative" as const,
        }}
      >
        {visibleItems.map((virtualRow) => {
          const row = rows[virtualRow.index];
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
              className="flex items-start gap-2 px-2 py-1"
            >
              <span
                style={{ paddingLeft: String(row.depth * 20) + "px", minWidth: "20px" }}
                className="flex-shrink-0 select-none"
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
                    className="size-4 rounded-sm border border-line text-xs leading-none hover:bg-paper focus-visible:outline-2 focus-visible:outline-red-accent"
                    aria-label={row.isCollapsed ? "Expand" : "Collapse"}
                  >
                    {row.isCollapsed ? "+" : "\u2212"}
                  </button>
                ) : (
                  <span className="inline-block size-4" />
                )}
              </span>

              <div className="flex-1 overflow-hidden rounded-sm border border-line/30 bg-white px-2 py-1">
                {row.key ? (
                  <span className="mr-2 text-xs font-semibold text-muted">
                    {row.key}
                  </span>
                ) : null}
                <span
                  className={cn("text-xs", row.isObject ? "text-muted" : "text-black")}
                >
                  {row.isObject
                    ? row.isCollapsed
                      ? "{ " +
                        String(row.childrenCount) +
                        " item" +
                        (row.childrenCount === 1 ? "" : "s") +
                        " }"
                      : ""
                    : row.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
