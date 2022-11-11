import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {

  constructor(
    private readonly appService: AppService
  ) {}

  @Get()
  get(): string {
    return this.appService.get();
  }

  @Get('health')
  health(): string {
    return this.appService.health();
  }
}
