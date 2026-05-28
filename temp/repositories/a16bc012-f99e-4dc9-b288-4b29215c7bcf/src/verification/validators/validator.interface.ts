export interface ValidationResult {
  passed: boolean;
  output: string;
  durationMs: number;
}

export interface Validator {
  validate(repositoryId: string): Promise<ValidationResult>;
}
