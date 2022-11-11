import { Aspects, IAspect } from 'aws-cdk-lib';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { CfnService, CfnTaskDefinition, ContainerImage, CpuArchitecture, FargateTaskDefinition, LogDrivers, OperatingSystemFamily, Secret } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { CfnTargetGroup } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Effect, ManagedPolicy, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { DockerImageName, ECRDeployment } from 'cdk-ecr-deployment';
import { Construct, IConstruct } from 'constructs';
import * as path from 'path';
import { AdotContainer } from './adot';
import { Aurora } from './aurora';
import { Network } from './network';

interface ApiFargateServiceProps {
  network: Network,
  aurora: Aurora,
}

class EnableExecuteCommand implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof CfnService) {
      node.addPropertyOverride('EnableExecuteCommand', true);
    }
    // if (node instanceof CfnTargetGroup) {
    //   node.addPropertyOverride('HealthCheckPath', '/health');
    // }
  }
}

export class ApiFargateService extends Construct {
  constructor(scope: Construct, id: string, props: ApiFargateServiceProps) {
    super(scope, id);

    const repo = new Repository(this, 'Repository', {
      repositoryName: 'sampleapp',
    });

    const imageAsset = new DockerImageAsset(this, 'DockerImage', {
      directory: path.join(__dirname, '../../sample/'),
      platform: Platform.LINUX_AMD64,
      target: 'ecs'
    });

    new ECRDeployment(this, 'DeploymentDockerImage', {
      src: new DockerImageName(imageAsset.imageUri),
      dest: new DockerImageName(repo.repositoryUri),
    });

    const service = new ApplicationLoadBalancedFargateService(this, 'SampleAppService', {
      serviceName: 'sample-app-service',
      vpc: props.network.vpc,
      desiredCount: 1,
      taskImageOptions: {
        image: ContainerImage.fromEcrRepository(repo),
        containerPort: 3000,
        secrets: {
          'POSTGRES_USER': Secret.fromSecretsManager(props.aurora.secret, 'username'),
          'POSTGRES_PASSWORD': Secret.fromSecretsManager(props.aurora.secret, 'password'),
          'POSTGRES_HOST': Secret.fromSecretsManager(props.aurora.secret, 'host'),
          'POSTGRES_DB': Secret.fromSecretsManager(props.aurora.secret, 'dbname'),
        },
        environment: {
          'USE_XRAY': '1',
          'FLUENTBIT_HOST': 'localhost'
        },
        logDriver: LogDrivers.firelens({
          options: {
            Name: 'cloudwatch',
            'region': 'ap-northeast-1',
            'auto_create_group': 'true',
            'log_group_name': '/aws/ecs/containerinsights/$(ecs_cluster)/application',
            'log_stream_name': '$(ecs_task_id)',
            'log_key': 'log',
          }
        }),
      },
      securityGroups: [
        props.network.sgAppService,
      ],
    });

    service.targetGroup.configureHealthCheck({
      path: '/health'
    });

    // ADOT Collectorコンテナの追加
    new AdotContainer(this, 'AdotContainer', { taskDefinition: service.service.taskDefinition });

    // X-Rayの権限付与
    service.taskDefinition.taskRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'));
    // CloudWatchの権限
    service.taskDefinition.taskRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'));

    // ECS Execの有効化
    Aspects.of(service).add(new EnableExecuteCommand());
    service.taskDefinition.taskRole.attachInlinePolicy(new Policy(scope, 'SSMPolicy', {
      policyName: 'ssm-policy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "ssmmessages:CreateControlChannel",
            "ssmmessages:CreateDataChannel",
            "ssmmessages:OpenControlChannel",
            "ssmmessages:OpenDataChannel",
          ],
          resources: ['*']
        })
      ]
    }));

  }
}
