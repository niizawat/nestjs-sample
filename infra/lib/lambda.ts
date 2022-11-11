import { HttpApi } from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { GetLayerVersionByArnCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { Stack } from 'aws-cdk-lib';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Architecture, DockerImageCode, DockerImageFunction, Tracing } from 'aws-cdk-lib/aws-lambda';
import { DockerImageName, ECRDeployment } from 'cdk-ecr-deployment';
import { Construct } from 'constructs';
import * as path from 'path';
import { Aurora } from './aurora';
import { Network } from './network';

interface ApiLambdaFunctionProps {
  network: Network,
  aurora: Aurora,
}

export class ApiLambdaFunction extends Construct {
  constructor(scope: Construct, id: string, props: ApiLambdaFunctionProps) {
    super(scope, id);

    const repo = new Repository(this, 'Repository', {
      repositoryName: 'samplefunc',
    });
    
    const imageAsset = new DockerImageAsset(this, 'DockerImage', {
      directory: path.join(__dirname, '../../sample/'),
      platform: Platform.LINUX_ARM64,
      target: 'lambdafunc',
      buildArgs: {
        'AWS_DEFAULT_REGION': 'ap-northeast',
        'LAYER_LOCATION': process.env.LAYER_LOCATION || '',
      },
    });
    new ECRDeployment(this, 'DeploymentDockerImage', {
      src: new DockerImageName(imageAsset.imageUri),
      dest: new DockerImageName(repo.repositoryUri),
    });

    const func = new DockerImageFunction(this, 'DockerImageFunction', {
      functionName: 'samplefunc',
      architecture: Architecture.ARM_64,
      code: DockerImageCode.fromEcr(repo),
      memorySize: 1024,
      environment: {
        'DB_SECRET_ID': props.aurora.secret.secretArn,
        'USE_XRAY': '1',
        'FLUENTBIT_HOST': 'localhost',
        'AWS_LAMBDA_EXEC_WRAPPER': "/opt/wrapper-script",
      },
      vpc: props.network.vpc,
      tracing: Tracing.ACTIVE,
      securityGroups: [props.network.sgAppService],
    });

    props.aurora.secret.grantRead(func);

    const lambdaIntegration = new HttpLambdaIntegration('DefaultIntegration', func);
    const httpApi = new HttpApi(this, 'HttpApi', {
      apiName: 'sampleapi',
      createDefaultStage: true,
      defaultIntegration: lambdaIntegration,
    });

  }
}
