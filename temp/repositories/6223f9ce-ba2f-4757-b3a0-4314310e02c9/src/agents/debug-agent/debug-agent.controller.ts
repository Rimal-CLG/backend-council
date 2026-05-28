import { Body, Controller, Post } from '@nestjs/common';

import { DebugAgentService } from './debug-agent.service';
import { AgentContext } from '@Common';

@Controller('debug-agent')
export class DebugAgentController {
  constructor(private readonly debugAgentService: DebugAgentService) {}

  @Post('analyze')
  async analyze(@Body() body: AgentContext) {
    console.time('debug-agent');
    const result = await this.debugAgentService.analyze(body);
    console.timeEnd('debug-agent');
    return result;
  }
}
