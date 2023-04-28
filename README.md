# Amazon CloudFront Continuous Deployment CDK Pipeline Sample

Repository hosting sample AWS CDK Pipeline for deploying changes Amazon CloudFront Distribution using CloudFront continuous deployment  

----
## Architecture Diagram

![Architecture Diagram](/cloudfront-cd.jpg)*Continuous Delivery of CloudFront Distribution Configuration Changes*

----

## Instructions to Use/Deploy this solution 

### Pre-requisites
1. Install [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
1. Install [CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)
1. AWS CodeBuild Repository 

----
### Instructions 
The following sections contain steps A through D with steps to create a distribution, test distribution, and release distribution configuration changes using Amazon CloudFront Continuous deployment.


### Step - A: Setup Repository and Deploy Pipeline
1. Clone this repository
1. Update the repository settings by editing `lib/pipeline-input-variable.ts` change the value of `PIPELINE_CODE_REPO_NAME` variable to your CodeBuild repository name
1. Add your environment (account and region) by editing `bin/cf-cd-sample-app.ts` follow comments in the file to uncomment and edit the right environment entry
1. Update/customize the other variables per you naming standards
1. Update the git remote to point to your code repository by running `git remote set-url origin <replace-with-your-repository-URL>`
1. Commit changes to repository
1. Run the command `cdk deploy` to deploy the pipeline


> Following instructions listed above deploys a pipeline and runs the pipeline. The pipeline run creates an Amazon CloudFront Distribution with S3 Origin    

----
### Step - B: Validate the Pipeline and Test Distribution
1. Validate the pipeline was successful by opening AWS Console and navigating to AWS Code Pipeline
1. Locate the distribution `mydistribution` in Amazon CloudFront console and make a note of the distribution URL 
1. Test the distribution by opening distribution URL in a browser or using command `curl <distribution URL>`

### Step - C: Change Distribution Configuration and Deploy 

1. Make distribution configuration updates by editing `lib/app-stacks/cf-distribution.config.ts` file 
1. Enable continuous deployment by edit `pipeline-input-variables.ts` file to update `ENABLE_CONTINUOUS_DEPLOYMENT` to true
1. commit code changes to repository

> Above code commit will trigger pipeline deploying a staging distribution with distribution changes, creates a deployment policy and attaches the policy to primary distribution created above in Step - B 

### Step - D: Test changes and Promote 
> Below steps assume that the default `SingleHeader` traffic configuration is in place. Http header is not required to test `SingleWeight` traffic configuration 
1. Validate that the pipeline is waiting for approval on `Promote stage`
1. Test the configuration changes by using command line `curl -H "aws-cf-cd-test: blue" <distribution test URL>` or through browser by adding additional http header `aws-cf-cd-test: blue` to the request
1. After completing testing you can promote staging distribution configuration to primary distribution by approving the `Promote stage` step in the pipeline  


### Cleanup 
Follow below instructions if you want to remove the Pipeline and stacks created by this sample. Please note that deleting a Pipeline doesn't remove the stacks created by pipeline and must be deleted using AWS CLI or AWS Console.
> please note that deleting stacks will remove the distribution.

> If you are running with `ENABLE_CONTINUOUS_DEPLOYMENT` set to `true` then follow steps Delete Staging Distribution Stack before deleting primary distribution 

#### Delete Staging Distribution Stack 
1. Open CloudFront Console and locate the primary distribution. Click on Primary distribution and scroll down to `Continuous deployment` section. 
1. Remove the deployment policy from primary distribution by clicking on `Delete` button
1. Once deployment policy is removed, we will need to deploy primary distribution before we can delete staging distribution stack by disabling continuous deployment and running the pipeline 
1. Disable continuous deployment by editing `pipeline-input-variable.ts` and setting `ENABLE_CONTINUOUS_DEPLOYMENT` to false
1. Commit the change to repository 
1. Commit to repository will trigger the pipeline to deploy latest changes to primary distribution
1. Once the primary distribution is deployed, you can delete the staging distribution stack by running below command in through AWS CLI or from CloudFormation console
    1. `aws cloudformation delete-stack --stack-name StagingDistribution-Change-cf-distribution-stack`
    

#### Delete Primary Distribution Stack
1. run the following commands to delete the primary distribution stack
    1. `aws cloudformation delete-stack --stack-name PrimaryDistribution-Change-cf-distribution-stack`

#### Delete Pipeline Stack
1. `cdk destroy <REPLACE-WITH-PIPELINE-NAME>` 




 ### Troubleshooting 
 1. If the pipeline fails during stack creation, then the stack has to be manually deleted before retrying the pipeline steps 
 2. set account via CDK_DEFAULT_ACCOUNT for agnostic or explicitly set account number if you see error 'Pipeline stack which uses cross-environment actions must have an explicitly set account'

