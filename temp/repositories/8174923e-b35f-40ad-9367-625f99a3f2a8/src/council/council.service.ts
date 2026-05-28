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

@Injectable()
export class CouncilService {
  constructor(
    private readonly databaseAgent: DatabaseAgentService,
    private readonly securityAgent: SecurityAgentService,
    private readonly debugAgent: DebugAgentService,
    private readonly judgeAgent: JudgeAgentService,
    private readonly contextService: ContextService,
    private readonly agentContextBuilderService: AgentContextBuilderService,
  ) {}

  async analyze(request: CouncilAnalysisDto) {
    const baseContext = await this.contextService.buildContext(request);

    // Build specialized contexts per agent to reduce token usage and improve precision
    const { databaseAgentContext, securityAgentContext, debugAgentContext } =
      this.agentContextBuilderService.buildContexts(baseContext);

    const [databaseAnalysis, securityAnalysis, debugAnalysis] =
      await Promise.all([
        this.databaseAgent.analyze(databaseAgentContext),
        this.securityAgent.analyze(securityAgentContext),
        this.debugAgent.analyze(debugAgentContext),
      ]);

    return this.judgeAgent.synthesize({
      databaseAnalysis,
      securityAnalysis,
      debugAnalysis,
    });
  }
}
