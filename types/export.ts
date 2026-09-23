export type ExportLanguage = "css" | "scss" | "json" | "ts" | "tsx" | "js" | "html" | "svg" | "xml";

export type ExportFormat = {
  id: string;
  label: string;
  filename: string;
  language: ExportLanguage;
  code: string;
};
