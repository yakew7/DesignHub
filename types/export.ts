export type ExportLanguage =
  "css" | "scss" | "json" | "ts" | "tsx" | "js" | "html" | "svg" | "xml" | "dart" | "swift" | "kotlin";

export type ExportFormat = {
  id: string;
  label: string;
  filename: string;
  language: ExportLanguage;
  code: string;
};
