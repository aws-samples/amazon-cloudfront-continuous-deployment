// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { CfnOutput } from "aws-cdk-lib";
import {
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { CfnStateMachine } from "aws-cdk-lib/aws-stepfunctions";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import {
  PipelineExportNames,
  PipelineInputVariables,
} from "../pipeline-input-variables";
import fs = require("fs");
import path = require("path");

export class StepFunctionStack extends cdk.NestedStack {
  stepFunctionName: string;
  stateMachineRoleArn: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const logGroup = new cdk.aws_logs.LogGroup(
      this,
      "CloudFrontPromotion-StepFunction-LogGroup"
    );

    const stateMachineRole = new Role(this, "StepFunctionRole", {
      assumedBy: new ServicePrincipal("states.amazonaws.com"),
      description: "CloudFront Continuous Deployment StepFunction Role",
      inlinePolicies: {
        "Allow-LogGroup-Permissions": this.createLogGroupPolicy()
      },
    });

    this.stateMachineRoleArn = stateMachineRole.roleArn;
    const stepFunctionDefinition = fs.readFileSync(
      path.join(__dirname, "./stepfunction-definition.json"),
      "utf8"
    );

    const stepFunctionName = PipelineInputVariables.STEP_FUNCTION_NAME;
    const stateMachine = new CfnStateMachine(this, stepFunctionName, {
      roleArn: stateMachineRole.roleArn,
      definitionString: stepFunctionDefinition,
      loggingConfiguration: {
        level: "ALL",
        destinations: [
          {
            cloudWatchLogsLogGroup: {
              logGroupArn: logGroup.logGroupArn,
            },
          },
        ],
      },
      tracingConfiguration: {
        enabled: true,
      },
    });

    this.stepFunctionName = stateMachine.attrName;
    new CfnOutput(this, "stepfunction-role-arn", {
      value: stateMachine.roleArn,
      exportName: PipelineExportNames.STEP_FUNCTION_ROLE_ARN,
    });

    NagSuppressions.addResourceSuppressions(
      this,
      [
        {
          id: "AwsSolutions-IAM5",
          reason:
            "Wildcard IAM permissions are used by auto-created Codepipeline policies and custom policies to allow flexible creation of resources",
        },
      ],
      true
    );
  }

  createLogGroupPolicy(): cdk.aws_iam.PolicyDocument {
    return new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: [
            "logs:CreateLogDelivery",
            "logs:CreateLogStream",
            "logs:GetLogDelivery",
            "logs:UpdateLogDelivery",
            "logs:DeleteLogDelivery",
            "logs:ListLogDeliveries",
            "logs:PutLogEvents",
            "logs:PutResourcePolicy",
            "logs:DescribeResourcePolicies",
            "logs:DescribeLogGroups",
          ],
          resources: ["*"],
        }),
      ],
    });
  }
}
