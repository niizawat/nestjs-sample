import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectLogger, WinstonLogger } from 'nestjs-winston-module';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @InjectLogger(AppService.name) private readonly logger: WinstonLogger
  ) {}

  get(): string {
    this.logger.info('DATABASE_URL: ' + process.env.DATABASE_URL);
    this.logger.info('NODE_ENV: ' + process.env.NODE_ENV);
    return JSON.stringify(process.env);
  }

  health(): string {
    return 'Ok';
  }

}
