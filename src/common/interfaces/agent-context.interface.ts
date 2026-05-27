/**
 * Typed context object passed to every specialist agent.
 * Replaces the previous pattern of stringifying context and passing as a raw string.
 */
export interface AgentContext {
  framework?: string;
  database?: string;
  orm?: string;
  error?: string;
  logs?: string;
  stackTrace?: string;
  code?: string;
}
