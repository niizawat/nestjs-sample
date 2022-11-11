import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as fluentLogger from 'fluent-logger';
import * as Joi from 'joi';
import { LoggerModule } from 'nestjs-winston-module';
import * as winston from 'winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './users/users.module';

const fluentTransport = fluentLogger.support.winstonTransport();

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('dev', 'stg', 'prod')
          .default('dev'),
        DATABASE_URL: Joi.string().required(),
        USE_XRAY: Joi.number().default(0),
        PORT: Joi.number().default(3000),
      })
    }),
    LoggerModule.forRoot({
      level: 'info',
      silent: false,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new fluentTransport('mytag', {
          host: process.env.FLUENTBIT_HOST,
          port: 24224,
          timeout: 3.0,
          requireAckResponse: true,
        }),
      ]
    }),
    UsersModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService]
})

export class AppModule {}
