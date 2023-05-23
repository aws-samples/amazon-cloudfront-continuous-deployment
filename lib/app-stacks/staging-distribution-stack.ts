// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CfnContinuousDeploymentPolicy,
  CfnDistribution,
  CfnOriginAccessControl,
} from "aws-cdk-lib/aws-cloudfront";
import { CfDistributionConfiguration } from "./cf-distribution-config";
import { Fn } from "aws-cdk-lib";
import { StaticContentStack } from "./staticcontent-stack";
import { IamPolicyStack } from "./iam-policy-stack";
import {
  PipelineExportNames,
  PipelineInputVariables,
} from "../pipeline-input-variables";

export class StagingDistributionStack extends cdk.Stack {
  distributionIdOutput: cdk.CfnOutput;
  deploymentPolicyIdOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    let staticContentStack = new StaticContentStack(
      this,
      "static-content-stack",
      props
    );
    const bucketDomainName = staticContentStack.bucketDomainName;
    const s3BucketName = staticContentStack.bucketName;

    const originAccessControlId = this.createOriginAccessControl().attrId;
    let stagimgDistribution = this.createCfDistribution(
      "mystagingdistribution",
      s3BucketName,
      bucketDomainName,
      originAccessControlId
    );
    let deploymentPolicy = this.createDeploymentPolicy(
      stagimgDistribution.attrDomainName
    );

    const outputName = PipelineExportNames.STAGING_DISTRIBUTION_ID;
    this.distributionIdOutput = new cdk.CfnOutput(this, outputName, {
      value: stagimgDistribution.attrId,
      exportName: outputName,
    });

    const cdPolicyIdOutput = PipelineExportNames.DEPLOYMENT_POLICY_ID;
    this.deploymentPolicyIdOutput = new cdk.CfnOutput(this, cdPolicyIdOutput, {
      value: deploymentPolicy.attrId,
      exportName: cdPolicyIdOutput,
    });
    const primaryDistributionId = Fn.importValue(
      PipelineExportNames.PRIMARY_DISTRIBUTION_ID
    );

    let stepFunctionRoleArn = Fn.importValue(
      PipelineExportNames.STEP_FUNCTION_ROLE_ARN
    );

    new IamPolicyStack(
      this,
      "distribution-iam-policies",
      {
        bucketName: s3BucketName,
        primaryDistributionId: primaryDistributionId,
        bucketDomainName: bucketDomainName,
        continuousDeployment: {
          stagingDistributionId: stagimgDistribution.attrId,
          deploymentPolicyId: deploymentPolicy.attrId,
          stepFunctionRoleArn: stepFunctionRoleArn,
        },
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
    return new CfnDistribution(this, distributionName, {
      distributionConfig: new CfDistributionConfiguration({
        distributionName: distributionName,
        bucketName: s3BucketName,
        bucketDomainName: bucketDomainName,
        originAccessControlId: originAccessControlId,
        staging: true,
      }).configuration,
    });
  }

  createOriginAccessControl(): CfnOriginAccessControl {
    return new CfnOriginAccessControl(this, "MyStagingCfnOriginAccessControl", {
      originAccessControlConfig: {
        name: "StagingS3OriginAccessControl",
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    });
  }

  createDeploymentPolicy(
    stagingDistributionDnsName: string
  ): CfnContinuousDeploymentPolicy {
    // swith the below flag to false to switch to a weight based traffic configuration
    let headerPolicy = PipelineInputVariables.HEADER_BASED_TRAFFIC_CONFIG;

    let tafficConfig = headerPolicy
      ? this.createHeaderBasedTrafficConfiguration()
      : this.createWeightBasedTrafficConfiguration();

    return new CfnContinuousDeploymentPolicy(
      this,
      "MyCfnContinuousDeploymentPolicy",
      {
        continuousDeploymentPolicyConfig: {
          enabled: true,
          stagingDistributionDnsNames: [stagingDistributionDnsName],

          trafficConfig: tafficConfig,
        },
      }
    );
  }

  createHeaderBasedTrafficConfiguration(): CfnContinuousDeploymentPolicy.TrafficConfigProperty {
    return {
      type: "SingleHeader",
      singleHeaderConfig: {
        header: "aws-cf-cd-test",
        value: "blue",
      },
    };
  }

  createWeightBasedTrafficConfiguration(): CfnContinuousDeploymentPolicy.TrafficConfigProperty {
    return {
      type: "SingleWeight",
      singleWeightConfig: {
        weight: 0.1,
        sessionStickinessConfig: {
          idleTtl: 300,
          maximumTtl: 1800,
        },
      },
    };
  }
}
