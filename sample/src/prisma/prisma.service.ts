import { INestApplication, Injectable, OnModuleDestroy, OnModuleInit, } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { InjectLogger, WinstonLogger } from 'nestjs-winston-module';

@Injectable()
export class PrismaService extends PrismaClient<Prisma.PrismaClientOptions, Prisma.LogLevel> implements OnModuleInit, OnModuleDestroy {
    constructor(
        @InjectLogger(PrismaService.name) private readonly logger: WinstonLogger,
    ) {
        super();
    }
    async onModuleInit() {
        this.logger.debug('Initialize PrismaService.');
        await this.$connect();
    }
    async onModuleDestroy() {
        this.logger.debug('Destroy PrismaService.');
        await this.$disconnect();
    }
    async enableShutdownHooks(app: INestApplication) {
        this.$on('beforeExit', async () => {
            await app.close();
        });
    }
}