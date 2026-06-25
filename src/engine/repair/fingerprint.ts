import type { RepairDataToken } from "./tokenizer";
import { tokenizeRepairInput } from "./tokenizer";

export interface DataFingerprintToken {
  readonly decodedValue: RepairDataToken["decodedValue"];
  readonly kind: RepairDataToken["kind"];
  readonly order: number;
  readonly source: string;
}

export interface DataFingerprint {
  readonly tokens: readonly DataFingerprintToken[];
}

export const createDataFingerprint = (input: string): DataFingerprint => ({
  tokens: tokenizeRepairInput(input)
    .filter((token): token is RepairDataToken => token.kind !== "syntax")
    .map((token) => ({
      decodedValue: token.decodedValue,
      kind: token.kind,
      order: token.order,
      source: token.source,
    })),
});

export const fingerprintsEqual = (
  first: DataFingerprint,
  second: DataFingerprint,
): boolean => {
  if (first.tokens.length !== second.tokens.length) {
    return false;
  }

  for (let index = 0; index < first.tokens.length; index += 1) {
    const token = first.tokens[index];
    const secondToken = second.tokens[index];

    if (token === undefined || secondToken === undefined) {
      return false;
    }

    if (
      token.kind !== secondToken.kind ||
      token.order !== secondToken.order ||
      token.source !== secondToken.source ||
      !Object.is(token.decodedValue, secondToken.decodedValue)
    ) {
      return false;
    }
  }

  return true;
};
