# Amazon CloudFront Continuous Deployment CDK Pipeline Sample

Repository hosting sample AWS CDK Pipeline for deploying changes Amazon CloudFront Distribution using CloudFront continuous deployment  

----
## Architecture Diagram

![Architecture Diagram](/cloudfront-cd.png)*Continuous Delivery of CloudFront Distribution Configuration Changes*

----

## Instructions to Use/Deploy this solution 

### Pre-requisites
1. Install [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
1. Install [CDK](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)
1. AWS CodeBuild Repository 

----
### Instructions 
The following sections contain steps A through D with instructions to create a distribution, test distribution, and release distribution configuration changes using Amazon CloudFront Continuous deployment.

#### Step - A: Setup Repository and Deploy Pipeline
1. Clone this repository to make changes and commit to your code repository
1. Update the repository settings by editing `lib/pipeline-input-variable.ts` change the value of `PIPELINE_CODE_REPO_NAME` variable to point to your code repository name
1. Add environment (account and region) by editing `bin/cf-cd-sample-app.ts` follow comments in the file to uncomment and edit the right environment entry
1. Bootstrap CDK using command `cdk bootstrap` if not already done
1. Update/customize the other variables per applicable naming standards
1. Update the git remote to point to code repository by running `git remote set-url origin <replace-with-your-repository-URL>`
1. Commit your changes to code repository
1. Run command `npm install` to install dependencies
1. Run the command `cdk deploy` to deploy the pipeline

> Executing instructions listed above creates a AWS CodePipeline and runs the pipeline. Running the pipeline will result in creating a Amazon CloudFront Distribution with S3 Origin.      

----
#### Step - B: Validate the Pipeline and Test Distribution
1. Open AWS Console and navigate to AWS CodePipeline and validate that the pipeline was successful
1. Locate the distribution with description as `mydistribution` in Amazon CloudFront console and copy the `Distribution domain name` 
1. Test the distribution by opening distribution URL in a browser or using command `curl <distribution URL>`
1. Opening the URL should display content of index.html

#### Step - C: Change Distribution Configuration and Deploy 

1. Make distribution configuration updates by editing `lib/app-stacks/cf-distribution.config.ts` file 
1. Enable continuous deployment by edit `pipeline-input-variables.ts` file to update `ENABLE_CONTINUOUS_DEPLOYMENT` to true
1. commit code changes to repository

> The above code commit will trigger the pipeline, which will result in deploying a staging distribution and deployment policy attached to the primary distribution created above in `Step - B` 

#### Step - D: Test changes and Promote 
> Below steps assume that the `SingleHeader` traffic configuration is in place. Http header is not required to test `SingleWeight` traffic configuration 
1. Validate that the pipeline is waiting for approval on `Promote stage`
1. Test the configuration changes by using command line `curl -H "aws-cf-cd-test: blue" <distribution test URL>` or through browser by adding additional http header `aws-cf-cd-test: blue` to the request
1. After completing testing, you can promote staging distribution configuration to primary distribution by approving the `Promote stage` step in the pipeline  


### Cleanup 
Follow below instructions if you want to remove the Pipeline and stacks created by this sample. Please note that deleting a Pipeline doesn't remove the stacks created by pipeline and must be deleted using AWS CLI or AWS Console.
> Please note that deleting stacks will remove the distribution. Do not run below steps on live distributions or distributions serving real users
> If you are running with `ENABLE_CONTINUOUS_DEPLOYMENT` set to `true` then follow steps `Delete Deployment Policy` and `Delete Staging Distribution Stack` before `Delete Primary Distribution Stack`


#### Delete Deployment Policy 
1. Open CloudFront Console and locate the primary distribution. Click on Primary distribution and scroll down to `Continuous deployment` section. 
1. Remove the deployment policy from primary distribution by clicking on `Delete` button

#### Delete Staging Distribution Stack
1. Once deployment policy is removed, we will need to deploy primary distribution before we can delete staging distribution stack by disabling continuous deployment and running the pipeline
1. Disable continuous deployment by editing pipeline-input-variable.ts and setting ENABLE_CONTINUOUS_DEPLOYMENT to false
1. Commit the change to repository
1. Commit to repository will trigger the pipeline to deploy latest changes to primary distribution
1. Once the primary distribution is deployed, you can delete the staging distribution stack by running below command in through AWS CLI or from CloudFormation console
    1. `aws cloudformation delete-stack --stack-name StagingDistribution-Change-cf-distribution-stack`


#### Delete Primary Distribution Stack
1. run the following commands to delete the primary distribution stack or from CloudFormation console 
    1. `aws cloudformation delete-stack --stack-name PrimaryDistribution-Change-cf-distribution-stack`


#### Delete Pipeline Stack
1. run the following command from repository root directory or delete the pipeline stack from CloudFormation console
    1. `cdk destroy` 

#### Cleanup S3 Buckets 
1. Remove S3 Origin bucket and Site logs bucket using S3 Console


## Pricing Calculations
Cost for running this solution consists of Code Repository cost, CI/CD Pipeline cost, and Amazon CloudFront Distribution cost

### Assumptions

| Assumption | Parameters |
| --- | --- | 
| Region | us-east-1 |
| AWS CodeCommit Repositories | 1 | 
| Number of AWS CodePipeline pipelines per month | 4 |  
| ***AWS CodeCommit Usage***  |  |
| Number of Active AWS CodeCommit Users per month | 5 | 
| ***Pipeline Usage***  |  | |
| Number of Continuous deployments to Amazon CloudFront Distribution per month | 64 |
| ***Amazon CloudFront Usage***  |  | |
| CloudFront Data transfer out to internet per month | 100 GB |
| CloudFront requests per month | 1,000,000  |


| Total Cost	| $13.53 |
| --- | --- |
| AWS CodePipeline |	$4.00 |
| AWS CodeCommit |	$0.00 |
| Amazon CloudFront |	$9.50 |
| StepFunctions |	$0.025 |

### AWS Service wise break up of calculations

| [AWS CodePipeline Pricing](https://aws.amazon.com/codepipeline/pricing/)	|	$4.00 |
| --- | --- | 
| Number of active CodePipelines |  4	| 
| Cost per active CodePipeline per month | $1.00 |
| ***Total Pipeline cost*** |		$4.00 |

| [StepFunctions Pricing](https://aws.amazon.com/step-functions/pricing/)	|	$0.028 |
| --- | --- |
| Number of state transitions	|  1024	| 
| Cost per 1000 state transition | $0.025 | 
| ***Total Workflow cost*** |		$0.0256 |

| [AWS CodeCommit Pricing](https://aws.amazon.com/codecommit/pricing/)	|	$0.00 |
| --- | --- | 
| Number of active users |  5	| 
| Cost for First 5 active users | $0.00 |
| ***Total CodeCommit cost*** |	$0.00 |

| [Amazon CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)	|	$9.50 |
| --- | --- | 
| Total for data transfer out to internet per month   | 100 GB |
| Cost for data transfer out to internet for per GB  | 0.085 |
| ***Total CloudFront data transfer out to internet*** |	$8.50 |
| Total number of CloudFront requests per month | 1,000,000 |
| Cost for 1,000,000 requests | $1.00 |
| ***Total CloudFront requests cost*** |	$1.00 |



## Troubleshooting
 1. If the pipeline fails during stack creation, then the stack must be manually deleted before retrying the pipeline steps 
 2. set account via CDK_DEFAULT_ACCOUNT for agnostic or explicitly set account number if you see error 'Pipeline stack which uses cross-environment actions must have an explicitly set account'

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.



