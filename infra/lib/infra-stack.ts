import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Aurora } from './aurora';
import { BastionServer } from './bastion';
import { ApiFargateService } from './ecs';
import { ApiLambdaFunction } from './lambda';
import { Network } from './network';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const network = new Network(this, 'Network');

    const aurora = new Aurora(this, 'Aurora', {
      vpc: network.vpc,
      sgDatabase: network.sgDataBase
    });

    new ApiFargateService(this, 'ApiFargateService', {
      network: network,
      aurora: aurora,
    });

    new ApiLambdaFunction(this, 'ApiLambdaFunction', {
      network: network,
      aurora: aurora,
    });

    new BastionServer(this, 'BastionServer', {
      network: network,
    });

  }
}
