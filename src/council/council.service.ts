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
    const context = this.contextService.buildContext(request);

    const [databaseAnalysis, securityAnalysis, debugAnalysis] =
      await Promise.all([
        this.databaseAgent.analyze(JSON.stringify(context)),
        this.securityAgent.analyze(JSON.stringify(context)),
        this.debugAgent.analyze(JSON.stringify(context)),
      ]);

    return this.judgeAgent.synthesize({
      databaseAnalysis,
      securityAnalysis,
      debugAnalysis,
    });
  }
}
