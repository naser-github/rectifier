export type ResultFormat = "json" | "yaml" | "xml" | "csv";

export type ResultSourceAction =
  | "beautify"
  | "minify"
  | "repair"
  | "convert-yaml"
  | "convert-xml"
  | "convert-csv"
  | "schema-check";

export interface ResultDocument {
  readonly action: ResultSourceAction;
  readonly format: ResultFormat;
  readonly revision: number;
  readonly text: string;
}
