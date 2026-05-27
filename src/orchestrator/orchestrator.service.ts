import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseAgentService } from '../agents/database-agent/database-agent.service';
import { SecurityAgentService } from '../agents/security-agent/security-agent.service';
import { DebugAgentService } from '../agents/debug-agent/debug-agent.service';
import { JudgeAgentService } from '../agents/judge-agent/judge-agent.service';
import { ContextService } from '../context/context.service';
import { OrchestratorRequestDto } from './dto/orchestrator-request.dto';
import { OrchestrationResult } from './interfaces/orchestration-result.interface';
import { AgentExecution } from '../common/interfaces/agent-execution.interface';

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
  ) {}

  async orchestrate(
    request: OrchestratorRequestDto,
  ): Promise<OrchestrationResult> {
    const executionId = randomUUID();
    const orchestrationStart = Date.now();

    this.logger.log(`[${executionId}] Orchestration started`);

    // Build clean AgentContext — no JSON stringification at this layer
    const context = this.contextService.buildContext(request);

    // Run all 3 specialist agents in parallel.
    // Each agent handles its own errors and returns AgentResult<T> — never throws.
    const [dbResult, secResult, debugResult] = await Promise.all([
      this.databaseAgent.analyze(context),
      this.securityAgent.analyze(context),
      this.debugAgent.analyze(context),
    ]);

    const agentExecutions: AgentExecution[] = [
      dbResult.execution,
      secResult.execution,
      debugResult.execution,
    ];

    const successfulAgents = agentExecutions.filter((e) => e.success).length;
    const failedAgents = agentExecutions.filter((e) => !e.success).length;

    this.logger.log(
      `[${executionId}] Specialist agents complete — success=${successfulAgents} failed=${failedAgents}`,
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
    });

    agentExecutions.push(judgeResult.execution);

    if (!judgeResult.data) {
      throw new InternalServerErrorException(
        'Judge agent failed to synthesize results. Check server logs for details.',
      );
    }

    const totalDurationMs = Date.now() - orchestrationStart;
    this.logger.log(
      `[${executionId}] Orchestration complete in ${totalDurationMs}ms`,
    );

    return {
      executionId,
      databaseAnalysis: dbResult.data,
      securityAnalysis: secResult.data,
      debugAnalysis: debugResult.data,
      finalAnalysis: judgeResult.data,
      metadata: {
        totalDurationMs,
        successfulAgents,
        failedAgents,
        agentExecutions,
      },
    };
  }
}
