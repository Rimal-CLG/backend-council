import { Injectable } from '@nestjs/common';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { CouncilAnalysisDto } from './dto/council-analysis.dto';
import { OrchestrationResult } from '../orchestrator/interfaces/orchestration-result.interface';

/**
 * CouncilService is a thin HTTP-layer adapter.
 *
 * Its sole responsibility is to receive the validated DTO from the
 * CouncilController and delegate the full orchestration workflow to
 * OrchestratorService. Business logic lives in the orchestrator.
 */
@Injectable()
export class CouncilService {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  analyze(request: CouncilAnalysisDto): Promise<OrchestrationResult> {
    return this.orchestratorService.orchestrate(request);
  }
}
