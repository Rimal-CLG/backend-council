export interface VerificationResult {
  success: boolean;
  buildPassed: boolean;
  lintPassed: boolean;
  testsPassed: boolean;
  errors: string[];
  warnings: string[];
  confidenceAdjustment: number;
  metadata: {
    buildDurationMs: number;
    lintDurationMs: number;
    testDurationMs: number;
    totalDurationMs: number;
  };
}
