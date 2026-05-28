export interface VerifiedPatchResult {
  success: boolean;
  buildPassed: boolean;
  lintPassed: boolean;
  testsPassed: boolean;
  errors: string[];
  warnings: string[];
  executionTimeMs: number;
}
