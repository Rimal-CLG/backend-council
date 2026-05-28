import { Body, Controller, Post } from '@nestjs/common';
import { SecurityAgentService } from './security-agent.service';
import { AgentContext } from '@Common';

@Controller('security-agent')
export class SecurityAgentController {
  constructor(private readonly securityAgentService: SecurityAgentService) {}

  @Post('analyze')
  async analyze(@Body() body: AgentContext) {
    console.time('security-agent');
    const result = await this.securityAgentService.analyze(body);
    console.timeEnd('security-agent');
    return result;
  }
}
