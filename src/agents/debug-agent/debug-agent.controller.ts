import { Body, Controller, Logger, Post } from '@nestjs/common';
import { BuildContextDto } from '../../context/dto/build-context.dto';
import { DebugAgentService } from './debug-agent.service';

@Controller('debug-agent')
export class DebugAgentController {
  private readonly logger = new Logger(DebugAgentController.name);

  constructor(private readonly debugAgentService: DebugAgentService) {}

  @Post('analyze')
  async analyze(@Body() context: BuildContextDto) {
    this.logger.log('analyze called');
    const start = Date.now();
    const result = await this.debugAgentService.analyze(context);
    this.logger.log(`analyze completed in ${Date.now() - start}ms`);
    return result;
  }
}
