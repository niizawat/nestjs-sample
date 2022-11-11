import { BastionHostLinux, InstanceClass, InstanceSize, InstanceType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ContainerDefinition, ContainerDependencyCondition, ContainerImage, TaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Construct } from "constructs";
import { networkInterfaces } from 'os';
import { Network } from './network';

interface BastionServerProps {
    network: Network,
}

export class BastionServer extends Construct {
    readonly adotContainer: ContainerDefinition;

    constructor(scope: Construct, id: string, props: BastionServerProps) {
        super(scope, id);

        new BastionHostLinux(scope, 'BastionLinuxServer', {
            vpc: props.network.vpc,
            instanceName: 'bastion-server',
            instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM),
            securityGroup: props.network.sgAppService,
        });
    }
}
