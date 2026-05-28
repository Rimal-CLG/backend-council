export class ContextResponseDto {
  framework?: string;

  database?: string;

  orm?: string;

  contextSummary: string;

  contextSize: number;

  generatedAt: Date;
}
