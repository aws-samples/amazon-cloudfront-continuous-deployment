// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { PrimaryDistributionStack } from "../app-stacks/primary-distribution-stack";

export class PrimaryDistributionStage extends cdk.Stage {
  primaryDistributionStack: PrimaryDistributionStack;

  constructor(
    scope: Construct,
    id: string,
    env?: StackProps,
    props?: cdk.StageProps
  ) {
    super(scope, id, props);
    const primaryDistributionStack = new PrimaryDistributionStack(
      this,
      "cf-distribution-stack",
      env
    );
    this.primaryDistributionStack = primaryDistributionStack;
  }
}
