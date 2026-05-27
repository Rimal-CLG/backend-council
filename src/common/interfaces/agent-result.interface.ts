import { AgentExecution } from './agent-execution.interface';

/**
 * Generic wrapper returned by every agent's analyze/synthesize method.
 *
 * - `data` holds the typed LLM result (null if the agent failed).
 * - `execution` always contains timing and status — even on failure.
 *
 * Using a wrapper instead of throwing ensures the orchestrator can
 * continue with partial results when only some agents fail.
 */
export interface AgentResult<T> {
  data: T | null;
  execution: AgentExecution;
}
