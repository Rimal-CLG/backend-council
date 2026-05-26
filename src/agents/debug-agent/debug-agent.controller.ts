import { Body, Controller, Post } from '@nestjs/common';

import { DebugAgentService } from './debug-agent.service';

@Controller('debug-agent')
export class DebugAgentController {
  constructor(private readonly debugAgentService: DebugAgentService) {}

  @Post('analyze')
  async analyze(@Body() body: { input: string }) {
    console.log('debug agent is called');
    console.time('debug-agent');
    const result = await this.debugAgentService.analyze(body.input);
    console.timeEnd('debug-agent');
    console.log('debug agent success');
    return result;
  }
}
