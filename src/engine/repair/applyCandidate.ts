import type { SyntaxEdit } from "../../domain/repair";

export const applySyntaxEdits = (
  input: string,
  edits: readonly SyntaxEdit[],
): string => {
  const sortedEdits = [...edits].sort(
    (first, second) => first.startOffset - second.startOffset,
  );
  let output = "";
  let currentOffset = 0;

  for (const edit of sortedEdits) {
    output += input.slice(currentOffset, edit.startOffset);
    output += edit.replacement;
    currentOffset = edit.endOffset;
  }

  output += input.slice(currentOffset);

  return output;
};
