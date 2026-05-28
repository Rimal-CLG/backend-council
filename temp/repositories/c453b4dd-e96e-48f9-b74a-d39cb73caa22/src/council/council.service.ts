import { Injectable } from '@nestjs/common';
import {
  DatabaseAgentService,
  DebugAgentService,
  JudgeAgentService,
  SecurityAgentService,
} from 'src/agents';
import { CouncilAnalysisDto } from '../council/dto/council-analysis.dto';
import { ContextService } from 'src/context/context.service';

@Injectable()
export class CouncilService {
  constructor(
    private readonly databaseAgent: DatabaseAgentService,
    private readonly securityAgent: SecurityAgentService,
    private readonly debugAgent: DebugAgentService,
    private readonly judgeAgent: JudgeAgentService,
    private readonly contextService: ContextService,
  ) {}

  async analyze(request: CouncilAnalysisDto) {
    const context = await this.contextService.buildContext(request);

    const [databaseAnalysis, securityAnalysis, debugAnalysis] =
      await Promise.all([
        this.databaseAgent.analyze(context),
        this.securityAgent.analyze(context),
        this.debugAgent.analyze(context),
      ]);

    return this.judgeAgent.synthesize({
      databaseAnalysis,
      securityAnalysis,
      debugAnalysis,
    });
  }
}
