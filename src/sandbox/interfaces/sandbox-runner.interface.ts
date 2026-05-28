export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface SandboxRunner {
  createWorkspace(repositoryId: string): Promise<string>;
  copyRepository(sourceId: string, workspaceId: string): Promise<void>;
  executeCommand(workspaceId: string, command: string): Promise<CommandResult>;
  cleanup(workspaceId: string): Promise<void>;
}
