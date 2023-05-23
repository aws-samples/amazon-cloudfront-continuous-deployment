// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { Repository } from "aws-cdk-lib/aws-codecommit";
import { CfnBucket } from "aws-cdk-lib/aws-s3";
import { CfnKey } from "aws-cdk-lib/aws-kms";
import { AwsSolutionsChecks, NagSuppressions } from "cdk-nag";
import { Aspects, Fn, StageProps } from "aws-cdk-lib";
import { StagingDistributionStage } from "./staging-distribution-stage";
import { PrimaryDistributionStage } from "./primary-distribution-stage";
import { PromoteDistributionPipelineStep } from "./promotedist-stepfunction-step";
import { UpdateDistributionPipelineStep } from "./updatedist-stepfunction-step";
import { StepFunctionStack } from "./stepfunction-stack";
import {
  PipelineExportNames,
  PipelineInputVariables,
} from "../pipeline-input-variables";

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: PipelineInputVariables.PIPELINE_NAME,
      synth: new ShellStep("Synth", {
        input: this.getCodePipelineSource(),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
      crossAccountKeys: true,
    });

    const stepFunctionStack = new StepFunctionStack(
      this,
      "cf-promotion-pipeline-step-function",
      props
    );

    // Note: set continuous deployment to false for the first time to deploy the primary distribution
    const continousDeployment =
      PipelineInputVariables.ENABLE_CONTINUOUS_DEPLOYMENT;

    if (continousDeployment) {
      this.createContinuousDeployment(
        pipeline,
        stepFunctionStack.stepFunctionName,
        props
      );
    } else {
      this.createPrimaryDistribution(pipeline);
    }

    Aspects.of(this).add(
      new AwsSolutionsChecks({
        verbose: true,
        reports: true,
      })
    );

    pipeline.buildPipeline();

    const artifactBucket = pipeline.pipeline.artifactBucket.node
      .defaultChild as CfnBucket;
    artifactBucket.loggingConfiguration = {
      logFilePrefix: "artifact_access_log",
    };
    artifactBucket.versioningConfiguration = { status: "Enabled" };

    if (pipeline.pipeline.artifactBucket.encryptionKey) {
      const key = pipeline.pipeline.artifactBucket.encryptionKey.node
        .defaultChild as CfnKey;
      key.enableKeyRotation = true;
    }

    NagSuppressions.addResourceSuppressions(
      pipeline,
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

  private getCodePipelineSource(): cdk.pipelines.IFileSetProducer | undefined {
    // using CodeCommit repository, but can easily switched to github or S3
    // Please refer to CodePipelineSource documentation for using different repository
    return CodePipelineSource.codeCommit(
      Repository.fromRepositoryName(
        this,
        "CD-Pipeline-Repository",
        PipelineInputVariables.PIPELINE_CODE_REPO
      ),
      PipelineInputVariables.PIPELINE_CODE_BRANCH
    );
  }

  createPrimaryDistribution(
    pipeline: CodePipeline,
    props?: StageProps,
    stackProps?: cdk.StackProps
  ): void {
    const primaryDistribution = new PrimaryDistributionStage(
      this,
      "PrimaryDistribution-Change",
      stackProps
    );

    const stage = pipeline.addStage(primaryDistribution);

    stage.addPost(
      new ShellStep("test distribution", {
        envFromCfnOutputs: {
          distributionDomainName:
            primaryDistribution.primaryDistributionStack
              .distributionDomainNameOutput,
        },
        commands: ['curl -v "https://$distributionDomainName"'],
      })
    );
  }

  createContinuousDeployment(
    pipeline: CodePipeline,
    stepFunctionName: string,
    props?: cdk.StackProps
  ): void {
    if (!props || !props.env) {
      throw Error(
        "Account and Region are required if continuous deployment is enabled. Please uncomment or pass env in file cf-cd-sample-app.ts"
      );
    }

    const stageDistribution = new StagingDistributionStage(
      this,
      "StagingDistribution-Change",
      props
    );
    pipeline.addStage(stageDistribution);

    const updateDeploymentPolicyWave = pipeline.addWave(
      "Update-DeploymentPolicy"
    );
    const primaryDistributionId = Fn.importValue(
      PipelineExportNames.PRIMARY_DISTRIBUTION_ID
    );

    // use step function to avoid over-writing primary distribution configuration with old configuration
    // and update primary distribution to attach deployment policy id.
    const updateStep = new UpdateDistributionPipelineStep(
      primaryDistributionId,
      stepFunctionName,
      props.env,
      stageDistribution.stagingDeploymentPolicyOutput
    );
    const manualStep = new ManualApprovalStep(
      "Approve-Promote-StagingDistribution",
      {
        comment:
          "Validate and approve staging distribution changes. Promote step will promote staging configuration changes to primary distribution.",
      }
    );
    manualStep.addStepDependency(updateStep);

    updateDeploymentPolicyWave.addPost(updateStep, manualStep);

    pipeline
      .addWave("Promote-StagingDistribution")
      .addPost(
        new PromoteDistributionPipelineStep(
          primaryDistributionId,
          stageDistribution.stagingDistributionOutput,
          stepFunctionName,
          props.env
        )
      );
  }

  addAspect(construct: Construct): void {
    Aspects.of(construct).add(
      new AwsSolutionsChecks({
        verbose: true,
        reports: true,
      })
    );
  }
}
