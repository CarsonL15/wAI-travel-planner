import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';

export class WaiTravelStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'wai-travel-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = userPool.addClient('WebClient', {
      userPoolClientName: 'web-client',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    // 2. DynamoDB Table - RETAIN to prevent data loss
    const table = new dynamodb.Table(this, 'Table', {
      tableName: 'wai-travel',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 3. Lambda Functions
    const generateItineraryFn = new lambdaNodejs.NodejsFunction(this, 'GenerateItinerary', {
      entry: '../backend/functions/generateItinerary.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(5),
      reservedConcurrentExecutions: 10, // Cost protection
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const getItineraryFn = new lambdaNodejs.NodejsFunction(this, 'GetItinerary', {
      entry: '../backend/functions/getItinerary.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const getUserFn = new lambdaNodejs.NodejsFunction(this, 'GetUser', {
      entry: '../backend/functions/getUser.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const saveUserPreferencesFn = new lambdaNodejs.NodejsFunction(this, 'SaveUserPreferences', {
      entry: '../backend/functions/saveUserPreferences.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Grant permissions
    table.grantReadWriteData(generateItineraryFn);
    table.grantReadData(getItineraryFn);
    table.grantReadData(getUserFn);
    table.grantReadWriteData(saveUserPreferencesFn);

    // Bedrock access - restricted to specific model
    generateItineraryFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: [
          'arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
        ],
      })
    );

    // 4. API Gateway with restricted CORS
    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'wai-travel-api',
      description: 'wAI Travel Planner API',
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'], // In production, replace with your domain
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [userPool],
    });

    const authOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // Routes
    const itineraries = api.root.addResource('itineraries');
    itineraries.addMethod('POST', new apigateway.LambdaIntegration(generateItineraryFn), authOptions);

    const itinerary = itineraries.addResource('{id}');
    itinerary.addMethod('GET', new apigateway.LambdaIntegration(getItineraryFn), authOptions);

    const user = api.root.addResource('user');
    user.addMethod('GET', new apigateway.LambdaIntegration(getUserFn), authOptions);

    const userPreferences = user.addResource('preferences');
    userPreferences.addMethod('POST', new apigateway.LambdaIntegration(saveUserPreferencesFn), authOptions);

    // 5. S3 Static Website - RETAIN to prevent accidental deletion
    const websiteBucket = new s3.Bucket(this, 'Website', {
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // For SPA routing
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Deploy Next.js static export
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../web/out')],
      destinationBucket: websiteBucket,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: websiteBucket.bucketWebsiteUrl,
      description: 'Website URL',
    });
  }
}
