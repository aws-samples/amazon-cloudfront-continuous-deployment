// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StaticContentStack } from "../app-stacks/staticcontent-stack";
import { StackProps } from "aws-cdk-lib";
import { PrimaryDistributionStack } from "../app-stacks/primary-distribution-stack";
import { IamPolicyStack } from "../app-stacks/iam-policy-stack";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class PrimaryDistributionStage extends cdk.Stage {
  primaryDistributionStack: PrimaryDistributionStack;

  constructor(
    scope: Construct,
    id: string,
    env?: StackProps,
    props?: cdk.StageProps
  ) {
    super(scope, id, props);
    let primaryDistributionStack = new PrimaryDistributionStack(
      this,
      "cf-distribution-stack",
      env
    );
    this.primaryDistributionStack = primaryDistributionStack;
  }
}
