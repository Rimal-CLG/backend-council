import { DatabaseResponse } from '../../agents/database-agent/schemas';
import { SecurityResponse } from '../../agents/security-agent/schemas';
import { DebugResponse } from '../../agents/debug-agent/schemas';
import { JudgeResponse } from '../../agents/judge-agent/schemas';
import { AgentExecution } from '../../common/interfaces/agent-execution.interface';
import { PatchResult } from '../../patch/interfaces/patch-result.interface';

/**
 * The fully typed result returned by OrchestratorService.orchestrate().
 * This is the shape of the POST /council/analyze response body.
 */
export interface OrchestrationResult {
  /** UUID identifying this specific orchestration run — useful for log correlation. */
  executionId: string;

  /** Result from the Database specialist agent (null if it failed). */
  databaseAnalysis: DatabaseResponse | null;

  /** Result from the Security specialist agent (null if it failed). */
  securityAnalysis: SecurityResponse | null;

  /** Result from the Debug specialist agent (null if it failed). */
  debugAnalysis: DebugResponse | null;

  /** Final synthesized verdict from the Judge agent. */
  finalAnalysis: JudgeResponse;

  /** Generated code patch if requested and available. */
  patch?: PatchResult | null;

  /** Aggregate execution statistics for this orchestration run. */
  metadata: {
    /** Total wall-clock time from start to finish in milliseconds. */
    totalDurationMs: number;

    /** Number of specialist agents that completed successfully. */
    successfulAgents: number;

    /** Number of specialist agents that failed. */
    failedAgents: number;

    /** Per-agent timing and outcome details. */
    agentExecutions: AgentExecution[];
  };
}
