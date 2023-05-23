// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnDistribution } from "aws-cdk-lib/aws-cloudfront";
import { CfManagedPolicies } from "./cf-managed-policy-constants";

// separating distribution config from distribution simplifies switching between continous deployment vs. direct deployment
export class CfDistributionConfiguration {
  private _configuration: CfnDistribution.DistributionConfigProperty;

  constructor(config: CfDistributionConfiguration.CfConfigInput) {
    this._configuration = {
      defaultCacheBehavior: {
        targetOriginId: config.bucketName,
        viewerProtocolPolicy: "https-only",
        cachePolicyId: CfManagedPolicies.CF_MANAGED_OPTIMIZED_CACHE_POLICY_ID,
        originRequestPolicyId:
          CfManagedPolicies.CF_ALL_VIWER_EXCEPT_HOST_POLICY_ID,
      },

      enabled: true,
      staging: config.staging,
      comment: config.distributionName,
      origins: [
        {
          id: config.bucketName,
          domainName: config.bucketDomainName,
          s3OriginConfig: {
            originAccessIdentity: "",
          },
          originAccessControlId: config.originAccessControlId,
        },
      ],
      defaultRootObject: "index.html",
    };
  }
  public get configuration(): CfnDistribution.DistributionConfigProperty {
    return this._configuration;
  }
}

export declare namespace CfDistributionConfiguration {
  interface CfConfigInput {
    distributionName: string;
    bucketName: string;
    bucketDomainName: string;
    originAccessControlId: string;
    staging: boolean;
  }
  
}
