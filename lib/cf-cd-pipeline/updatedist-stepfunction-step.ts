// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnOutput, Environment } from "aws-cdk-lib";
import { IStage } from "aws-cdk-lib/aws-codepipeline";
import {
  StateMachineInput,
  StepFunctionInvokeAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import {
  CodePipelineActionFactoryResult,
  ICodePipelineActionFactory,
  ProduceActionOptions,
  StackOutputReference,
  Step,
} from "aws-cdk-lib/pipelines";

export class UpdateDistributionPipelineStep
  extends Step
  implements ICodePipelineActionFactory
{
  deploymentPolicyId: StackOutputReference;
  primaryDistributionId: string;
  env: Environment;
  stepFunctionName: string;

  constructor(
    primaryDistributionId: string,
    stepFunctionName: string,
    env: Environment,
    deploymentPolicyId?: CfnOutput
  ) {
    super("UpdateDeploymentPolicyStep");
    if (deploymentPolicyId) {
      this.deploymentPolicyId =
        StackOutputReference.fromCfnOutput(deploymentPolicyId);
    }

    this.primaryDistributionId = primaryDistributionId;
    this.stepFunctionName = stepFunctionName;
    this.env = env;
  }

  produceAction(
    stage: IStage,
    options: ProduceActionOptions
  ): CodePipelineActionFactoryResult {
    // Actions don't support stack outputs for state machine
    const stepFunctionArn = `arn:aws:states:${this.env.region}:${this.env.account}:stateMachine:${this.stepFunctionName}`;

    const stateMachine = StateMachine.fromStateMachineArn(
      options.scope,
      "cf-promotion-state-machine",
      stepFunctionArn
    );
    stage.addAction(
      new StepFunctionInvokeAction({
        actionName: options.actionName,
        stateMachine: stateMachine,
        stateMachineInput: StateMachineInput.literal({
          Id: this.primaryDistributionId,
          DeploymentPolicy: {
            ContinuousDeploymentPolicyId: this.deploymentPolicyId
              ? options.stackOutputsMap.toCodePipeline(this.deploymentPolicyId)
              : "",
          },
        }),
        runOrder: 1,
      })
    );

    return { runOrdersConsumed: 1 };
  }

  public get consumedStackOutputs(): StackOutputReference[] {
    if (this.deploymentPolicyId) {
      return [this.deploymentPolicyId];
    }

    return [];
  }
}
