export type RepairDataTokenKind = "boolean" | "null" | "number" | "string";

export interface RepairSyntaxToken {
  readonly endOffset: number;
  readonly kind: "syntax";
  readonly source: string;
  readonly startOffset: number;
}

export interface RepairDataToken {
  readonly decodedValue: boolean | null | number | string;
  readonly endOffset: number;
  readonly kind: RepairDataTokenKind;
  readonly order: number;
  readonly source: string;
  readonly startOffset: number;
}

export type RepairToken = RepairDataToken | RepairSyntaxToken;

const JSON_SYNTAX_CHARS = new Set(["{", "}", "[", "]", ":", ","]);
const WHITESPACE_PATTERN = /\s/u;
const NUMBER_START_PATTERN = /[-0-9]/u;
const NUMBER_PATTERN = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/uy;

export const tokenizeRepairInput = (input: string): readonly RepairToken[] => {
  const tokens: RepairToken[] = [];
  let offset = 0;
  let dataOrder = 0;

  while (offset < input.length) {
    const char = input[offset];

    if (char === undefined) {
      break;
    }

    if (WHITESPACE_PATTERN.test(char)) {
      offset += 1;
      continue;
    }

    if (JSON_SYNTAX_CHARS.has(char)) {
      tokens.push(createSyntaxToken(char, offset, offset + 1));
      offset += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      const stringToken = readStringToken(input, offset, char, dataOrder);
      tokens.push(createSyntaxToken(char, offset, offset + 1));
      tokens.push(stringToken.token);

      if (stringToken.hasClosingDelimiter) {
        tokens.push(
          createSyntaxToken(char, stringToken.endOffset - 1, stringToken.endOffset),
        );
      }

      dataOrder += 1;
      offset = stringToken.endOffset;
      continue;
    }

    const keywordToken = readKeywordToken(input, offset, dataOrder);

    if (keywordToken !== null) {
      tokens.push(keywordToken.token);
      dataOrder += 1;
      offset = keywordToken.endOffset;
      continue;
    }

    if (NUMBER_START_PATTERN.test(char)) {
      const numberToken = readNumberToken(input, offset, dataOrder);

      if (numberToken !== null) {
        tokens.push(numberToken.token);
        dataOrder += 1;
        offset = numberToken.endOffset;
        continue;
      }
    }

    tokens.push(createSyntaxToken(char, offset, offset + 1));
    offset += 1;
  }

  return tokens;
};

const createSyntaxToken = (
  source: string,
  startOffset: number,
  endOffset: number,
): RepairSyntaxToken => ({
  endOffset,
  kind: "syntax",
  source,
  startOffset,
});

const readStringToken = (
  input: string,
  quote: number,
  delimiter: "'" | '"',
  order: number,
): {
  readonly endOffset: number;
  readonly hasClosingDelimiter: boolean;
  readonly token: RepairDataToken;
} => {
  let offset = quote + 1;
  let isEscaped = false;

  while (offset < input.length) {
    const char = input[offset];

    if (char === undefined) {
      break;
    }

    if (isEscaped) {
      isEscaped = false;
      offset += 1;
      continue;
    }

    if (char === "\\") {
      isEscaped = true;
      offset += 1;
      continue;
    }

    if (char === delimiter) {
      const source = input.slice(quote + 1, offset);

      return {
        endOffset: offset + 1,
        hasClosingDelimiter: true,
        token: {
          decodedValue: decodeStringSource(source),
          endOffset: offset,
          kind: "string",
          order,
          source,
          startOffset: quote + 1,
        },
      };
    }

    offset += 1;
  }

  const source = input.slice(quote + 1);

  return {
    endOffset: input.length,
    hasClosingDelimiter: false,
    token: {
      decodedValue: decodeStringSource(source),
      endOffset: input.length,
      kind: "string",
      order,
      source,
      startOffset: quote + 1,
    },
  };
};

const decodeStringSource = (source: string): string => {
  try {
    return JSON.parse(`"${source}"`) as string;
  } catch {
    return source;
  }
};

const readKeywordToken = (
  input: string,
  offset: number,
  order: number,
): { readonly endOffset: number; readonly token: RepairDataToken } | null => {
  if (input.startsWith("true", offset)) {
    return {
      endOffset: offset + 4,
      token: createDataToken("boolean", true, input, offset, offset + 4, order),
    };
  }

  if (input.startsWith("false", offset)) {
    return {
      endOffset: offset + 5,
      token: createDataToken("boolean", false, input, offset, offset + 5, order),
    };
  }

  if (input.startsWith("null", offset)) {
    return {
      endOffset: offset + 4,
      token: createDataToken("null", null, input, offset, offset + 4, order),
    };
  }

  return null;
};

const readNumberToken = (
  input: string,
  offset: number,
  order: number,
): { readonly endOffset: number; readonly token: RepairDataToken } | null => {
  NUMBER_PATTERN.lastIndex = offset;

  const match = NUMBER_PATTERN.exec(input);
  const source = match?.[0];

  if (source === undefined) {
    return null;
  }

  const endOffset = offset + source.length;

  return {
    endOffset,
    token: createDataToken("number", Number(source), input, offset, endOffset, order),
  };
};

const createDataToken = (
  kind: RepairDataTokenKind,
  decodedValue: RepairDataToken["decodedValue"],
  input: string,
  startOffset: number,
  endOffset: number,
  order: number,
): RepairDataToken => ({
  decodedValue,
  endOffset,
  kind,
  order,
  source: input.slice(startOffset, endOffset),
  startOffset,
});
