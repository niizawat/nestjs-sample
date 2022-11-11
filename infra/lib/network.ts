import * as cdk from 'aws-cdk-lib';
import { IpAddresses, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class Network extends Construct {

    readonly vpc: Vpc;
    readonly sgDataBase: SecurityGroup;
    readonly sgAppService: SecurityGroup;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id);

        // VPC
        this.vpc = new Vpc(this, 'Vpc', {
            vpcName: 'sampleapp-vpc',
            ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'public',
                    subnetType: SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'app',
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                },
                {
                    cidrMask: 24,
                    name: 'db',
                    subnetType: SubnetType.PRIVATE_ISOLATED,
                }
            ],
            natGateways: 1,
            enableDnsHostnames: true,
            enableDnsSupport: true,
        });

        // Fargate Service用セキュリティグループ
        this.sgAppService = new SecurityGroup(this, 'AppServiceSecurityGroup', {
            securityGroupName: 'appservice-sg',
            vpc: this.vpc,
            allowAllOutbound: true
        });

        // Aurora用セキュリティグループ
        this.sgDataBase = new SecurityGroup(this, 'DatabaseSecurityGroup', {
            securityGroupName: 'database-sg',
            vpc: this.vpc,
            allowAllOutbound: true
        });

        // Fargate ServiceからAuroraへの接続許可
        this.sgDataBase.addIngressRule(
            this.sgAppService,
            Port.tcp(5432)
        );

    }
}
