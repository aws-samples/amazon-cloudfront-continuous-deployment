// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";

import {
  Policy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { CfnBucketPolicy } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

// grant required permissions to distribution to read origin bucket and for stepfunction to update distributions
export class IamPolicyStack extends cdk.NestedStack {
  constructor(
    scope: Construct,
    id: string,
    input: IamPolicyStack.IamPolicyInput,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // attach s3 policy
    if (input.continuousDeployment) {
      const cd = input.continuousDeployment;

      this.attachS3ReadPolicy(
        input.bucketName,
        input.primaryDistributionId,
        cd.stagingDistributionId
      );

      const stepFunctionRole = Role.fromRoleArn(
        this,
        "step-function-role",
        cd.stepFunctionRoleArn
      );
      new Policy(this, "stepfunction-distribution-permissions", {
        policyName: "stepfunction-distribution-policy",
        roles: [stepFunctionRole],
        document: this.createStepFunctionPolicy(
          input.primaryDistributionId,
          cd.stagingDistributionId,
          cd.deploymentPolicyId
        ),
      });
    } else {
      this.attachS3ReadPolicy(input.bucketName, input.primaryDistributionId);
    }
  }

  attachS3ReadPolicy(
    bucketName: string,
    primaryDistributionId: string,
    stagingDistributionId?: string
  ): void {
    const bucketResource = `arn:aws:s3:::${bucketName}/*`;
    const primaryDistributionArn = `arn:aws:cloudfront::${this.account}:distribution/${primaryDistributionId}`;

    const statements = [
      new PolicyStatement({
        actions: ["s3:GetObject"],
        principals: [new ServicePrincipal("cloudfront.amazonaws.com")],
        resources: [bucketResource],
        conditions: {
          StringEquals: { "AWS:SourceArn": primaryDistributionArn },
        },
      }),
    ];

    if (stagingDistributionId) {
      const stagingDistributionArn = `arn:aws:cloudfront::${this.account}:distribution/${stagingDistributionId}`;
      statements.push(
        new PolicyStatement({
          actions: ["s3:GetObject"],
          principals: [new ServicePrincipal("cloudfront.amazonaws.com")],
          resources: [bucketResource],
          conditions: {
            StringEquals: { "AWS:SourceArn": stagingDistributionArn },
          },
        })
      );
    }

    const policyDocument = new PolicyDocument({
      statements: statements,
    });

    new CfnBucketPolicy(this, "CF-distribution-read", {
      bucket: bucketName,
      policyDocument: policyDocument,
    });
  }

  createStepFunctionPolicy(
    primaryDistributionId: string,
    stagingDistributionId: string,
    deploymentPolicyId: string
  ): PolicyDocument {
    const stagingDistributionResourceArn = this.formatArnString(
      stagingDistributionId
    );
    const primaryDistributionResourceArn = this.formatArnString(
      primaryDistributionId
    );
    const deploymentPolicyArn = `arn:aws:cloudfront::${this.account}:continuous-deployment-policy/${deploymentPolicyId}`;

    return new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: [
            "cloudfront:GetDistribution",
            "cloudfront:UpdateDistribution",
            "cloudfront:UpdateDistributionWithStagingConfig",
          ],
          resources: [
            stagingDistributionResourceArn,
            primaryDistributionResourceArn,
          ],
        }),
        new PolicyStatement({
          actions: [
            "cloudfront:GetContinuousDeploymentPolicyConfig",
            "cloudfront:UpdateContinuousDeploymentPolicy",
          ],
          resources: [deploymentPolicyArn],
        }),
      ],
    });
  }

  formatArnString(distributionId: string): string {
    return `arn:aws:cloudfront::${this.account}:distribution/${distributionId}`;
  }
}

export declare namespace IamPolicyStack {
  interface IamPolicyInput {
    primaryDistributionId: string;
    bucketName: string;
    bucketDomainName: string;
    continuousDeployment?: {
      stagingDistributionId: string;
      deploymentPolicyId: string;
      stepFunctionRoleArn: string;
    };
  }
}
