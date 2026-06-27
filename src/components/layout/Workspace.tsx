import type { ReactNode } from "react";

interface WorkspaceProps {
  readonly input: ReactNode;
  readonly actions: ReactNode;
  readonly result: ReactNode;
}

export function Workspace({ input, actions, result }: WorkspaceProps): ReactNode {
  return (
    <main className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_142px_minmax(0,1fr)]">
      {input}
      {actions}
      {result}
    </main>
  );
}
