// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StackProps } from "aws-cdk-lib";
import { StagingDistributionStack } from "../app-stacks/staging-distribution-stack";

export class StagingDistributionStage extends cdk.Stage {
  stagingDistributionOutput: cdk.CfnOutput;
  stagingDeploymentPolicyOutput: cdk.CfnOutput;

  constructor(
    scope: Construct,
    id: string,
    stackProps?: StackProps,
    props?: cdk.StageProps
  ) {
    super(scope, id, props);
    const stagingDistributionStack = new StagingDistributionStack(
      this,
      "cf-distribution-stack",
      stackProps
    );
    this.stagingDistributionOutput =
      stagingDistributionStack.distributionIdOutput;
    this.stagingDeploymentPolicyOutput =
      stagingDistributionStack.deploymentPolicyIdOutput;
  }
}
