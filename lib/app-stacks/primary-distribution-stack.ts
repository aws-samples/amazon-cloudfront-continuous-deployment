// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import {
  CfnDistribution,
  CfnOriginAccessControl,
} from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";
import {
  PipelineExportNames
} from "../pipeline-input-variables";
import { CfDistributionConfiguration } from "./cf-distribution-config";
import { IamPolicyStack } from "./iam-policy-stack";
import { StaticContentStack } from "./staticcontent-stack";

export class PrimaryDistributionStack extends cdk.Stack {
  distributionIdOutput: cdk.CfnOutput;
  distributionDomainNameOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const staticContentStack = new StaticContentStack(
      this,
      "static-content-stack",
      props
    );

    const bucketDomainName = staticContentStack.bucketDomainName;
    const s3BucketName = staticContentStack.bucketName;

    const originAccessControlId = this.createOriginAccessControl().attrId;

    const primaryDistribution = this.createCfDistribution(
      "mydistribution",
      s3BucketName,
      bucketDomainName,
      originAccessControlId
    );

    const outputName = PipelineExportNames.PRIMARY_DISTRIBUTION_ID;

    this.distributionIdOutput = new cdk.CfnOutput(this, outputName, {
      value: primaryDistribution.attrId,
      exportName: outputName,
    });

    this.distributionDomainNameOutput = new cdk.CfnOutput(
      this,
      "primary-distribution-domainName-output",
      { value: primaryDistribution.attrDomainName }
    );

    new IamPolicyStack(
      this,
      "distribution-iam-policies",
      {
        bucketName: s3BucketName,
        primaryDistributionId: primaryDistribution.attrId,
        bucketDomainName: bucketDomainName,
      },
      props
    );
  }

  createCfDistribution(
    distributionName: string,
    s3BucketName: string,
    bucketDomainName: string,
    originAccessControlId: string
  ): CfnDistribution {
    const configuration = new CfDistributionConfiguration({
      distributionName: distributionName,
      bucketName: s3BucketName,
      bucketDomainName: bucketDomainName,
      originAccessControlId: originAccessControlId,
      staging: false,
    }).configuration;

    return new CfnDistribution(this, distributionName, {
      distributionConfig: configuration,
    });
  }

  createOriginAccessControl(): CfnOriginAccessControl {
    return new CfnOriginAccessControl(this, "MyCfnOriginAccessControl", {
      originAccessControlConfig: {
        name: "S3OriginAccessControl",
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    });
  }
}
