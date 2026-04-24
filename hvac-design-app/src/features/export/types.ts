export type ExportFormat = "pdf" | "png" | "svg";
export type PngQuality = "low" | "medium" | "high";
export type PdfPageSize = "letter" | "a4" | "custom";

export interface ExportIncludeOptions {
  grid: boolean;
  dimensions: boolean;
  labels: boolean;
}

export interface ExportOptions {
  format: ExportFormat;
  quality?: PngQuality;
  pageSize?: PdfPageSize;
  customDimensions?: { width: number; height: number };
  include: ExportIncludeOptions;
}

export type PrintOrientation = "portrait" | "landscape";
export type PrintScale = "fit" | "actual" | "custom";
export type PrintMargins = "normal" | "narrow" | "wide";

export interface PrintOptions {
  orientation: PrintOrientation;
  scale: PrintScale;
  customScale?: number;
  margins: PrintMargins;
}

export interface ExportResult {
  success: boolean;
  data?: Blob | Uint8Array;
  error?: string;
  fileSize?: number;
}
