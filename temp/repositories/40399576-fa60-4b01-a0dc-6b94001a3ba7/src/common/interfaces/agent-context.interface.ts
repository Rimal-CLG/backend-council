export class AgentContext {
  framework?: string;
  database?: string;
  orm?: string;
  queueSystem?: string;
  cacheLayer?: string;
  authenticationMethod?: string;
  projectType?: string;
  fingerprint?: string;
  error?: string;
  logs?: string;
  stackTrace?: string;
  code?: string;
  repositorySummaryText?: string;

  files?: Array<{
    filename: string;
    extension: string;
    content: string;
    lineCount: number;
    score?: number;
    selectionReason?: string;
  }>;

  executionMetadata?: {
    filesSelected: number;
    filesRejected: number;
    averageScore: number;
    totalContextSize: number;
  };
}
