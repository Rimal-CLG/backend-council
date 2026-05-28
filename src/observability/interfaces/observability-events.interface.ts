export interface StartAnalysisEvent {
  executionId: string;
  repositoryId?: string;
}

export interface CompleteAnalysisEvent {
  executionId: string;
  totalDurationMs: number;
  finalConfidence?: number;
  finalRecommendation?: string;
}

export interface AgentExecutionEvent {
  executionId: string;
  agentName: string;
  durationMs: number;
  confidence?: number;
  tokensUsed?: number;
  success: boolean;
  accepted?: boolean;
}

export interface VerificationExecutionEvent {
  executionId: string;
  buildPassed: boolean;
  lintPassed: boolean;
  testsPassed: boolean;
  durationMs: number;
}
