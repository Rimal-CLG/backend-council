export interface Context {
  framework?: string;

  database?: string;

  orm?: string;

  error?: string;

  logs?: string;

  stackTrace?: string;

  code?: string;

  metadata?: any;

  repositorySummaryText?: string;

  executionMetadata?: any;

  files?: Array<{
    filename: string;
    extension: string;
    content: string;
    lineCount: number;
    score?: number;
    selectionReason?: string;
  }>;
}
