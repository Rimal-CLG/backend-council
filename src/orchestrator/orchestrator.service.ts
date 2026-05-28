import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { sanitizeForLog, isValidUUID } from '@Common';
import { DatabaseAgentService } from '../agents/database-agent/database-agent.service';
import { SecurityAgentService } from '../agents/security-agent/security-agent.service';
import { DebugAgentService } from '../agents/debug-agent/debug-agent.service';
import { JudgeAgentService } from '../agents/judge-agent/judge-agent.service';
import { ContextService } from '../context/context.service';
import { AgentContextBuilderService } from '../context/builders/agent-context-builder.service';
import { VerificationService } from '../verification/verification.service';
import { VerificationResult } from '../verification/interfaces/verification-result.interface';
import { PatchService } from '../patch/patch.service';
import { PatchResult } from '../patch/interfaces/patch-result.interface';
import { SandboxService } from '../sandbox/sandbox.service';
import { VerifiedPatchResult } from '../sandbox/interfaces/verified-patch-result.interface';
import { JudgePatchEvalResponse } from '../agents/judge-agent/schemas';
import { OrchestratorRequestDto } from './dto/orchestrator-request.dto';
import { OrchestrationResult } from './interfaces/orchestration-result.interface';
import { AgentExecution } from '../common/interfaces/agent-execution.interface';
import { ObservabilityService } from '../observability/observability.service';

/**
 * OrchestratorService is the single source of truth for the full
 * agent execution workflow:
 *
 *  1. Build a typed AgentContext from the incoming request.
 *  2. Run all 3 specialist agents in parallel (each handles its own errors).
 *  3. Collect per-agent execution metadata.
 *  4. Synthesize the judge verdict from available results.
 *  5. Return a fully typed OrchestrationResult.
 *
 * CouncilService is a thin wrapper that delegates here — keeping
 * the HTTP layer separate from orchestration logic.
 */
@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly databaseAgent: DatabaseAgentService,
    private readonly securityAgent: SecurityAgentService,
    private readonly debugAgent: DebugAgentService,
    private readonly judgeAgent: JudgeAgentService,
    private readonly contextService: ContextService,
    private readonly agentContextBuilderService: AgentContextBuilderService,
    private readonly verificationService: VerificationService,
    private readonly patchService: PatchService,
    private readonly sandboxService: SandboxService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async orchestrate(
    request: OrchestratorRequestDto,
  ): Promise<OrchestrationResult> {
    if (request.repositoryId && !isValidUUID(request.repositoryId)) {
      throw new BadRequestException('Invalid repositoryId');
    }

    const executionId = randomUUID();
    const orchestrationStart = Date.now();

    this.logger.log(`[${sanitizeForLog(executionId)}] Orchestration started`);

    await this.observabilityService.recordAnalysisStart({
      executionId,
      repositoryId: request.repositoryId,
    });

    // Build clean AgentContext — no JSON stringification at this layer
    const baseContext = await this.contextService.buildContext(request);

    // Build specialized contexts per agent to reduce token usage and improve precision
    const { databaseAgentContext, securityAgentContext, debugAgentContext } =
      this.agentContextBuilderService.buildContexts(baseContext);

    // Run all 3 specialist agents and verification in parallel.
    // Each agent handles its own errors and returns AgentResult<T> — never throws.
    const [dbResult, secResult, debugResult, verificationResult] =
      await Promise.all([
        this.databaseAgent.analyze(databaseAgentContext),
        this.securityAgent.analyze(securityAgentContext),
        this.debugAgent.analyze(debugAgentContext),
        request.repositoryId
          ? this.verificationService.verifyRepository(request.repositoryId)
          : Promise.resolve(null),
      ]);

    const agentExecutions: AgentExecution[] = [
      dbResult.execution,
      secResult.execution,
      debugResult.execution,
    ];

    const successfulAgents = agentExecutions.filter((e) => e.success).length;
    const failedAgents = agentExecutions.filter((e) => !e.success).length;

    this.logger.log(
      `[${sanitizeForLog(executionId)}] Specialist agents complete — success=${successfulAgents} failed=${failedAgents}`,
    );

    if (successfulAgents === 0) {
      throw new InternalServerErrorException(
        'All specialist agents failed to analyze the input. Check server logs for details.',
      );
    }

    // Synthesize the judge verdict from available results (nulls are passed for failed agents)
    const judgeResult = await this.judgeAgent.synthesize({
      databaseAnalysis: dbResult.data,
      securityAnalysis: secResult.data,
      debugAnalysis: debugResult.data,
      verificationResult: verificationResult as VerificationResult | undefined,
    });

    agentExecutions.push(judgeResult.execution);

    if (!judgeResult.data) {
      throw new InternalServerErrorException(
        'Judge agent failed to synthesize results. Check server logs for details.',
      );
    }

    let patch: PatchResult | null = null;
    let verifiedPatch: VerifiedPatchResult | null = null;
    let patchEvaluation: JudgePatchEvalResponse | null = null;

    if (request.generatePatch && request.repositoryId) {
      patch = await this.patchService.generatePatch(
        request.repositoryId,
        judgeResult.data,
      );

      if (patch) {
        verifiedPatch = await this.sandboxService.verifyPatch(
          request.repositoryId,
          patch,
        );

        if (verifiedPatch) {
          // Record verification success/failure
          await this.observabilityService.recordVerificationExecution({
            executionId,
            buildPassed: verifiedPatch.buildPassed,
            lintPassed: verifiedPatch.lintPassed,
            testsPassed: verifiedPatch.testsPassed,
            durationMs: verifiedPatch.executionTimeMs,
          });

          const evalResult = await this.judgeAgent.evaluatePatch({
            originalAnalysis: judgeResult.data,
            patch,
            verificationResult: verifiedPatch,
          });
          agentExecutions.push(evalResult.execution);
          if (evalResult.data) {
            patchEvaluation = evalResult.data;
          }
        }
      }
    }

    const totalDurationMs = Date.now() - orchestrationStart;
    this.logger.log(
      `[${sanitizeForLog(executionId)}] Orchestration complete in ${totalDurationMs}ms`,
    );

    await this.observabilityService.recordAnalysisComplete({
      executionId,
      totalDurationMs,
      finalConfidence: judgeResult.data?.confidence,
      finalRecommendation: judgeResult.data?.finalRootCause,
    });

    // Record all agent executions to DB at the end to include evaluatePatch
    for (const agent of agentExecutions) {
      await this.observabilityService.recordAgentExecution({
        executionId,
        agentName: agent.agentName,
        durationMs: agent.durationMs,
        confidence: agent.confidence,
        success: agent.success,
      });
    }

    return {
      executionId,
      databaseAnalysis: dbResult.data,
      securityAnalysis: secResult.data,
      debugAnalysis: debugResult.data,
      finalAnalysis: judgeResult.data,
      patch,
      verifiedPatch,
      patchEvaluation,
      metadata: {
        totalDurationMs,
        successfulAgents,
        failedAgents,
        agentExecutions,
      },
    };
  }
}
