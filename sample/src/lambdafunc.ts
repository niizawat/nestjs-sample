// tracer.tsは必ず先頭でインポートする
import './tracer';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@vendia/serverless-express';
import { Context, Handler } from 'aws-lambda';
import express from 'express';

import { AppModule } from './app.module';

type DBSecret = {
    username: string,
    password: string,
    host: string,
    dbname: string,
}

let cachedServer: Handler;
let dbSecret: DBSecret;

const dbSecrets = async () => {
    try {
        const client = new SecretsManagerClient({ region: 'ap-northeast-1' });
        const command = new GetSecretValueCommand({
            SecretId: process.env.DB_SECRET_ID,
        });
        const response = await client.send(command);
        return JSON.parse(response.SecretString) as DBSecret;
    } catch (err) {
        console.log('Failed to get secret value.');
        throw new Error('Failed to get secret value: ' + err);
    }
}

async function bootstrap() {

    // if (!dbSecret) {
    //     dbSecret = await dbSecrets();
    // }
    // process.env.POSTGRES_USER = dbSecret.username;
    // process.env.POSTGRES_PASSWORD = dbSecret.password;
    // process.env.POSTGRES_HOST = dbSecret.host;
    // process.env.POSTGRES_DB = dbSecret.dbname;
    // process.env.DATABASE_URL = `postgresql://${dbSecret.username}:${dbSecret.password}@${dbSecret.host}:5432/${dbSecret.dbname}?schema=public`;

    if (!cachedServer) {
        const expressApp = express();
        const nestApp = await NestFactory.create(
            AppModule,
            new ExpressAdapter(expressApp),
        );

        nestApp.enableCors();

        await nestApp.init();

        cachedServer = serverlessExpress({ app: expressApp });
    }

    return cachedServer;
}

export const handler = async (event: any, context: Context, callback: any) => {
    const server = await bootstrap();
    return server(event, context, callback);
};
