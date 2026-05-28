import { Injectable } from '@nestjs/common';
import {
  DatabaseAgentService,
  DebugAgentService,
  JudgeAgentService,
  SecurityAgentService,
} from 'src/agents';
import { CouncilAnalysisDto } from '../council/dto/council-analysis.dto';
import { ContextService } from 'src/context/context.service';
import { AgentContextBuilderService } from 'src/context/builders/agent-context-builder.service';
import { VerificationService } from '../verification/verification.service';
import { VerificationResult } from '../verification/interfaces/verification-result.interface';
import { PatchService } from '../patch/patch.service';
import { PatchResult } from '../patch/interfaces/patch-result.interface';

@Injectable()
export class CouncilService {
  constructor(
    private readonly databaseAgent: DatabaseAgentService,
    private readonly securityAgent: SecurityAgentService,
    private readonly debugAgent: DebugAgentService,
    private readonly judgeAgent: JudgeAgentService,
    private readonly contextService: ContextService,
    private readonly agentContextBuilderService: AgentContextBuilderService,
    private readonly verificationService: VerificationService,
    private readonly patchService: PatchService,
  ) {}

  async analyze(request: CouncilAnalysisDto) {
    const baseContext = await this.contextService.buildContext(request);

    // Build specialized contexts per agent to reduce token usage and improve precision
    const { databaseAgentContext, securityAgentContext, debugAgentContext } =
      this.agentContextBuilderService.buildContexts(baseContext);

    // Run agents and verification in parallel
    const [
      databaseAnalysis,
      securityAnalysis,
      debugAnalysis,
      verificationResult,
    ] = await Promise.all([
      this.databaseAgent.analyze(databaseAgentContext),
      this.securityAgent.analyze(securityAgentContext),
      this.debugAgent.analyze(debugAgentContext),
      request.repositoryId
        ? this.verificationService.verifyRepository(request.repositoryId)
        : Promise.resolve(null),
    ]);

    const judgeResult = await this.judgeAgent.synthesize({
      databaseAnalysis,
      securityAnalysis,
      debugAnalysis,
      verificationResult: verificationResult as VerificationResult | undefined,
    });

    let patch: PatchResult | null = null;
    if (request.generatePatch && request.repositoryId) {
      patch = await this.patchService.generatePatch(
        request.repositoryId,
        judgeResult,
      );
    }

    return {
      analysis: judgeResult,
      patch,
    };
  }
}
