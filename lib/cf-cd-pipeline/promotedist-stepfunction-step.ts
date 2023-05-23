// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnOutput, Environment } from "aws-cdk-lib";
import {
  StateMachineInput,
  StepFunctionInvokeAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import { IStage } from "aws-cdk-lib/aws-codepipeline/lib";
import { StateMachine } from "aws-cdk-lib/aws-stepfunctions";
import {
  CodePipelineActionFactoryResult,
  ICodePipelineActionFactory,
  ProduceActionOptions,
  StackOutputReference,
  Step,
} from "aws-cdk-lib/pipelines";

export class PromoteDistributionPipelineStep
  extends Step
  implements ICodePipelineActionFactory
{
  stagingDistrbutionId: StackOutputReference;
  primaryDistributionId: string;
  env: Environment;
  stepFunctionName: string;

  constructor(
    primaryDistributionId: string,
    stagingDistributionId: CfnOutput,
    stepFunctionName: string,
    env: Environment
  ) {
    super("PromoteStagingDistributionStep");
    this.stagingDistrbutionId = StackOutputReference.fromCfnOutput(
      stagingDistributionId
    );
    this.primaryDistributionId = primaryDistributionId;

    this.stepFunctionName = stepFunctionName;
    this.env = env;
  }

  produceAction(
    stage: IStage,
    options: ProduceActionOptions
  ): CodePipelineActionFactoryResult {
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
          StagingDistributionId: options.stackOutputsMap.toCodePipeline(
            this.stagingDistrbutionId
          ),
        }),
        runOrder: 1,
      })
    );

    return { runOrdersConsumed: 1 };
  }

  public get consumedStackOutputs(): StackOutputReference[] {
    return [this.stagingDistrbutionId];
  }
}
