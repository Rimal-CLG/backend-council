import { Module } from '@nestjs/common';
import { DatabaseAgentService } from './database-agent.service';
import { DatabaseAgentController } from './database-agent.controller';

@Module({
  providers: [DatabaseAgentService],
  controllers: [DatabaseAgentController],
  exports: [DatabaseAgentService],
})
export class DatabaseAgentModule {}
