// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { PipelineInputVariables } from "../pipeline-input-variables";

export class StaticContentStack extends cdk.NestedStack {
  bucketName: string;
  bucketDomainName: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const loggingBucket = new Bucket(
      this,
      PipelineInputVariables.LOG_BUCKET_NAME,
      {
        blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
        encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    const targetBucket = new Bucket(this, "mysite-content", {
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: "mysite-content-access-log",
    });

    new BucketDeployment(this, "DeployWebSite", {
      sources: [Source.asset("./mysite-content")],
      destinationBucket: targetBucket,
    });

    this.bucketName = targetBucket.bucketName;
    this.bucketDomainName = targetBucket.bucketDomainName;
  }

  createCfnOutput(name: string, value: string): void {
    new cdk.CfnOutput(this, name, { value: value, exportName: name });
  }
}
