import { Injectable, Logger, Inject } from '@nestjs/common';
import type { SandboxRunner } from './interfaces/sandbox-runner.interface';
import { VerifiedPatchResult } from './interfaces/verified-patch-result.interface';
import { PatchApplicationService } from './patch-application/patch-application.service';
import { VerificationPipelineService } from './validators/verification-pipeline.service';
import { PatchResult } from '../patch/interfaces/patch-result.interface';
import { sanitizeForLog } from '@Common';

@Injectable()
export class SandboxService {
  private readonly logger = new Logger(SandboxService.name);

  constructor(
    @Inject('SandboxRunner') private readonly runner: SandboxRunner,
    private readonly patchApplication: PatchApplicationService,
    private readonly verificationPipeline: VerificationPipelineService,
  ) {}

  /**
   * Orchestrates the patch verification process in an isolated sandbox.
   *
   * 1. Creates a new sandbox workspace.
   * 2. Copies the original repository into the workspace.
   * 3. Applies the generated patch.
   * 4. Runs the build/lint/test pipeline.
   * 5. Cleans up the workspace.
   *
   * @param repositoryId The ID of the original repository.
   * @param patch The generated patch to test.
   * @returns The results of the verification pipeline, or null if setup/patching failed.
   */
  async verifyPatch(
    repositoryId: string,
    patch: PatchResult,
  ): Promise<VerifiedPatchResult | null> {
    this.logger.log(
      `Beginning sandbox verification for repository ${sanitizeForLog(repositoryId)}`,
    );

    let workspaceId: string | undefined;

    try {
      // 1. Create Workspace
      workspaceId = await this.runner.createWorkspace(repositoryId);

      // 2. Copy Repository
      await this.runner.copyRepository(repositoryId, workspaceId);

      // 3. Apply Patch
      await this.patchApplication.applyPatch(workspaceId, patch);

      // 4. Run Verification
      const result =
        await this.verificationPipeline.runVerification(workspaceId);

      this.logger.log(
        `Sandbox verification finished for repository ${sanitizeForLog(repositoryId)}. Success: ${String(result.success)}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Sandbox verification failed for repository ${sanitizeForLog(repositoryId)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    } finally {
      // 5. Cleanup
      if (workspaceId) {
        await this.runner.cleanup(workspaceId);
      }
    }
  }
}
