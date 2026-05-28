import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { AnalyticsService } from './analytics/analytics.service';
import { ObservabilityService } from './observability.service';

@Controller('analytics')
export class ObservabilityController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  @Get('/health')
  async getHealth() {
    return this.observabilityService.checkHealth();
  }

  @Get('overview')
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('executions')
  async getExecutions(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const takeNum = take ? parseInt(take, 10) : 10;
    const skipNum = skip ? parseInt(skip, 10) : 0;
    return this.analyticsService.getRecentExecutions(takeNum, skipNum);
  }

  @Get('executions/:id')
  async getExecution(@Param('id') id: string) {
    const execution = await this.analyticsService.getExecutionById(id);
    if (!execution) {
      throw new NotFoundException('Execution not found');
    }
    return execution;
  }

  @Get('agents')
  async getAgentAnalytics() {
    return this.analyticsService.getAgentAnalytics();
  }
}
