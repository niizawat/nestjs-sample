import { ContainerDefinition, ContainerDependencyCondition, ContainerImage, TaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Construct } from "constructs";

interface AdotContainerProps {
    taskDefinition: TaskDefinition
}

export class AdotContainer extends Construct {
    readonly adotContainer: ContainerDefinition;

    constructor(scope: Construct, id: string, props: AdotContainerProps) {
        super(scope, id);

        this.adotContainer = new ContainerDefinition(this, 'AdotContainerDef', {
            containerName: 'adot-collector',
            image: ContainerImage.fromRegistry('public.ecr.aws/aws-observability/aws-otel-collector:latest'),
            taskDefinition: props.taskDefinition,
            portMappings: [
                { containerPort: 4317 },
                { containerPort: 4318 },
            ]
        });

        // アプリケーションコンテナより先に起動させるようにする
        props.taskDefinition.defaultContainer?.addContainerDependencies({
            container: this.adotContainer,
            condition: ContainerDependencyCondition.START,
        });
    }
}
