/**
 * Execution metadata produced by every agent invocation.
 * Captured regardless of success or failure.
 */
export interface AgentExecution {
  /** The agent class name, e.g. "DatabaseAgent". */
  agentName: string;

  /** Wall-clock duration of the agent call in milliseconds. */
  durationMs: number;

  /** Whether the agent completed successfully and returned valid data. */
  success: boolean;

  /** Confidence score returned by the LLM (only present on success). */
  confidence?: number;

  /** Human-readable error message (only present on failure). */
  error?: string;
}
