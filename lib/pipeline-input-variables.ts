// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0


export const PipelineInputVariables = {
  // Pipeline variables
  PIPELINE_CODE_REPO: "cf-cd-repository",
  PIPELINE_CODE_BRANCH: "main",

  PIPELINE_NAME: "cloudfront-cd-pipeline",
  // prefix
  STEP_FUNCTION_NAME: "CFCDPipelineStepFunction",

  ENABLE_CONTINUOUS_DEPLOYMENT: false,
  HEADER_BASED_TRAFFIC_CONFIG: true,

  // ORIGIN variables
  LOG_BUCKET_NAME: "mysite-logs",
};

export const PipelineExportNames = {
  STEP_FUNCTION_ROLE_ARN: `${PipelineInputVariables.PIPELINE_NAME}-cd-pipeline-stepfunction-roleArn`,

  PRIMARY_DISTRIBUTION_ID: `${PipelineInputVariables.PIPELINE_NAME}-primary-distribution-id`,

  STAGING_DISTRIBUTION_ID: `${PipelineInputVariables.PIPELINE_NAME}-staging-distribution-id`,
  DEPLOYMENT_POLICY_ID: `${PipelineInputVariables.PIPELINE_NAME}-staging-deployment-policy-id`,
};
