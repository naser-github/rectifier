export interface TreeRow {
  readonly id: string;
  readonly depth: number;
  readonly key: string;
  readonly value: string;
  readonly isCollapsed: boolean;
  readonly isObject: boolean;
  readonly isArray: boolean;
  readonly childrenCount: number;
}

type CollapsedSet = ReadonlySet<string>;

export function jsonToTreeRows(data: unknown, collapsed: CollapsedSet): TreeRow[] {
  const rows: TreeRow[] = [];
  const stack: { value: unknown; depth: number; key: string; path: string }[] = [
    { value: data, depth: 0, key: "", path: "$" },
  ];

  while (stack.length > 0) {
    const entry = stack.pop();
    if (!entry) continue;
    const { value, depth, key, path } = entry;

    if (typeof value !== "object" || value === null) {
      rows.push({
        id: path,
        depth,
        key,
        value: JSON.stringify(value),
        isCollapsed: false,
        isObject: false,
        isArray: false,
        childrenCount: 0,
      });
      continue;
    }

    const isArray = Array.isArray(value);
    const entries = isArray
      ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
      : Object.entries(value as Record<string, unknown>);

    const collapsedId = path;
    const isCollapsed = collapsed.has(collapsedId);

    rows.push({
      id: collapsedId,
      depth,
      key,
      value: isArray
        ? "Array(" + String(entries.length) + ")"
        : "Object(" + String(entries.length) + ")",
      isCollapsed,
      isObject: true,
      isArray,
      childrenCount: entries.length,
    });

    if (!isCollapsed) {
      for (let i = entries.length - 1; i >= 0; i--) {
        const pair = entries[i];
        if (!pair) continue;
        const [subKey, subValue] = pair;
        const childPath = path + "." + subKey;
        stack.push({ value: subValue, depth: depth + 1, key: subKey, path: childPath });
      }
    }
  }

  return rows;
}
