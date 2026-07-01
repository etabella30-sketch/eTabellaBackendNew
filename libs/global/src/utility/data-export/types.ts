/** Shared case-data export types (used by the export app + downloadapi package builder). */

export const DATA_EXPORT_TYPES = [
  'facts', 'qfacts', 'doclinks', 'tags', 'tasks',
  'evidence_index', 'transcript_index', 'full_workspace',
] as const;
export type DataExportType = (typeof DATA_EXPORT_TYPES)[number];

export const DATA_EXPORT_FORMATS = ['pdf', 'docx', 'xlsx', 'csv'] as const;
export type DataExportFormat = (typeof DATA_EXPORT_FORMATS)[number];

/** One named table of rows in an export (full_workspace produces several). */
export interface Dataset {
  name: string;
  rows: Record<string, any>[];
}
