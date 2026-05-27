import { Body, Controller, Logger, Post } from '@nestjs/common';
import { BuildContextDto } from '../../context/dto/build-context.dto';
import { DatabaseAgentService } from './database-agent.service';

@Controller('database-agent')
export class DatabaseAgentController {
  private readonly logger = new Logger(DatabaseAgentController.name);

  constructor(private readonly databaseAgentService: DatabaseAgentService) {}

  @Post('analyze')
  async analyze(@Body() context: BuildContextDto) {
    this.logger.log('analyze called');
    const start = Date.now();
    const result = await this.databaseAgentService.analyze(context);
    this.logger.log(`analyze completed in ${Date.now() - start}ms`);
    return result;
  }
}
