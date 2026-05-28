export class CouncilAnalysisDto {
  framework?: string;

  database?: string;

  orm?: string;

  error?: string;

  logs?: string;

  stackTrace?: string;

  code?: string;

  fileIds?: string[];

  repositoryId?: string;

  generatePatch?: boolean;
}
