export class AgentContext {
  framework?: string;
  database?: string;
  orm?: string;
  error?: string;
  logs?: string;
  stackTrace?: string;
  code?: string;
  files?: Array<{
    filename: string;
    extension: string;
    content: string;
  }>;
}
