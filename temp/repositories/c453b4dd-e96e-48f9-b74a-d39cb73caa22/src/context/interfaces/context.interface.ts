export interface Context {
  framework?: string;

  database?: string;

  orm?: string;

  error?: string;

  logs?: string;

  stackTrace?: string;

  code?: string;

  metadata?: Record<string, any>;

  files?: Array<{
    filename: string;
    extension: string;
    content: string;
  }>;
}
