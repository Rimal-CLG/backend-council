import { Body, Controller, Post } from '@nestjs/common';

import { ContextService } from './context.service';

import { BuildContextDto } from './dto/build-context.dto';

@Controller('context')
export class ContextController {
  constructor(private readonly contextService: ContextService) {}

  @Post('build')
  async buildContext(
    @Body()
    dto: BuildContextDto,
  ) {
    return await this.contextService.buildContext(dto);
  }
}
