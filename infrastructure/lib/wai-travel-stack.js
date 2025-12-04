"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaiTravelStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaNodejs = __importStar(require("aws-cdk-lib/aws-lambda-nodejs"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const s3deploy = __importStar(require("aws-cdk-lib/aws-s3-deployment"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
class WaiTravelStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        const updateItineraryFn = new lambdaNodejs.NodejsFunction(this, 'UpdateItinerary', {
            entry: '../backend/functions/updateItinerary.ts',
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            environment: {
                TABLE_NAME: table.tableName,
            },
        });
        const regenerateActivitiesFn = new lambdaNodejs.NodejsFunction(this, 'RegenerateActivities', {
            entry: '../backend/functions/regenerateActivities.ts',
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(30),
        });
        const getItinerariesFn = new lambdaNodejs.NodejsFunction(this, 'GetItineraries', {
            entry: '../backend/functions/getItineraries.ts',
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            environment: {
                TABLE_NAME: table.tableName,
            },
        });
        // Grant permissions
        table.grantReadWriteData(generateItineraryFn);
        table.grantReadData(getItineraryFn);
        table.grantReadData(getItinerariesFn);
        table.grantReadData(getUserFn);
        table.grantReadWriteData(saveUserPreferencesFn);
        table.grantReadWriteData(updateItineraryFn);
        // Bedrock access - allow both Haiku (fast) and Sonnet (detailed)
        const bedrockPolicy = new iam.PolicyStatement({
            actions: ['bedrock:InvokeModel'],
            resources: [
                'arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
                'arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
            ],
        });
        generateItineraryFn.addToRolePolicy(bedrockPolicy);
        regenerateActivitiesFn.addToRolePolicy(bedrockPolicy);
        // 4. API Gateway with restricted CORS
        const api = new apigateway.RestApi(this, 'Api', {
            restApiName: 'wai-travel-api',
            description: 'wAI Travel Planner API',
            defaultCorsPreflightOptions: {
                allowOrigins: ['*'], // In production, replace with your domain
                allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
                allowHeaders: ['Content-Type', 'Authorization'],
            },
        });
        // Add CORS headers to ALL gateway responses (errors, timeouts, auth failures)
        // This is critical - without this, browser blocks error responses due to missing CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': "'*'",
            'Access-Control-Allow-Headers': "'Content-Type,Authorization'",
            'Access-Control-Allow-Methods': "'GET,POST,PUT,OPTIONS'",
        };
        // Add CORS to default 4XX responses (auth errors, bad requests, etc.)
        api.addGatewayResponse('Default4XX', {
            type: apigateway.ResponseType.DEFAULT_4XX,
            responseHeaders: corsHeaders,
        });
        // Add CORS to default 5XX responses (Lambda errors, timeouts, etc.)
        api.addGatewayResponse('Default5XX', {
            type: apigateway.ResponseType.DEFAULT_5XX,
            responseHeaders: corsHeaders,
        });
        // Add CORS specifically to timeout responses
        api.addGatewayResponse('IntegrationTimeout', {
            type: apigateway.ResponseType.INTEGRATION_TIMEOUT,
            responseHeaders: corsHeaders,
            statusCode: '504',
            templates: {
                'application/json': '{"error": "Request timed out. AI generation is taking longer than expected. Please try again."}',
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
        itineraries.addMethod('GET', new apigateway.LambdaIntegration(getItinerariesFn), authOptions);
        const itinerary = itineraries.addResource('{id}');
        itinerary.addMethod('GET', new apigateway.LambdaIntegration(getItineraryFn), authOptions);
        itinerary.addMethod('PUT', new apigateway.LambdaIntegration(updateItineraryFn), authOptions);
        const user = api.root.addResource('user');
        user.addMethod('GET', new apigateway.LambdaIntegration(getUserFn), authOptions);
        const userPreferences = user.addResource('preferences');
        userPreferences.addMethod('POST', new apigateway.LambdaIntegration(saveUserPreferencesFn), authOptions);
        // AI regeneration endpoint
        const activities = api.root.addResource('activities');
        const regenerate = activities.addResource('regenerate');
        regenerate.addMethod('POST', new apigateway.LambdaIntegration(regenerateActivitiesFn), authOptions);
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
exports.WaiTravelStack = WaiTravelStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FpLXRyYXZlbC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndhaS10cmF2ZWwtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBRW5DLGlFQUFtRDtBQUNuRCxtRUFBcUQ7QUFDckQsK0RBQWlEO0FBQ2pELDRFQUE4RDtBQUM5RCx1RUFBeUQ7QUFDekQsdURBQXlDO0FBQ3pDLHdFQUEwRDtBQUMxRCx5REFBMkM7QUFFM0MsTUFBYSxjQUFlLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDM0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4Qix1QkFBdUI7UUFDdkIsTUFBTSxRQUFRLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDdEQsWUFBWSxFQUFFLGtCQUFrQjtZQUNoQyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGFBQWEsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7WUFDOUIsVUFBVSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtZQUMzQixjQUFjLEVBQUU7Z0JBQ2QsU0FBUyxFQUFFLENBQUM7Z0JBQ1osZ0JBQWdCLEVBQUUsSUFBSTtnQkFDdEIsZ0JBQWdCLEVBQUUsSUFBSTtnQkFDdEIsYUFBYSxFQUFFLElBQUk7YUFDcEI7WUFDRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1NBQ3pDLENBQUMsQ0FBQztRQUVILE1BQU0sY0FBYyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFO1lBQ3JELGtCQUFrQixFQUFFLFlBQVk7WUFDaEMsU0FBUyxFQUFFO2dCQUNULFlBQVksRUFBRSxJQUFJO2dCQUNsQixPQUFPLEVBQUUsSUFBSTth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QyxnQkFBZ0I7WUFDdEMsV0FBVyxFQUFFLDZCQUE2QjtTQUMzQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUNoQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUc7WUFDZCxXQUFXLEVBQUUsaUJBQWlCO1NBQy9CLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3BDLEtBQUssRUFBRSxhQUFhLENBQUMsZ0JBQWdCO1lBQ3JDLFdBQVcsRUFBRSxhQUFhO1NBQzNCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXJPRCx3Q0FxT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBsYW1iZGFOb2RlanMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ub2RlanMnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgczNkZXBsb3kgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzLWRlcGxveW1lbnQnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuXG5leHBvcnQgY2xhc3MgV2FpVHJhdmVsU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyAxLiBDb2duaXRvIFVzZXIgUG9vbFxuICAgIGNvbnN0IHVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ1VzZXJQb29sJywge1xuICAgICAgdXNlclBvb2xOYW1lOiAnd2FpLXRyYXZlbC11c2VycycsXG4gICAgICBzZWxmU2lnblVwRW5hYmxlZDogdHJ1ZSxcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHsgZW1haWw6IHRydWUgfSxcbiAgICAgIGF1dG9WZXJpZnk6IHsgZW1haWw6IHRydWUgfSxcbiAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgIG1pbkxlbmd0aDogOCxcbiAgICAgICAgcmVxdWlyZUxvd2VyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVVwcGVyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdXNlclBvb2xDbGllbnQgPSB1c2VyUG9vbC5hZGRDbGllbnQoJ1dlYkNsaWVudCcsIHtcbiAgICAgIHVzZXJQb29sQ2xpZW50TmFtZTogJ3dlYi1jbGllbnQnLFxuICAgICAgYXV0aEZsb3dzOiB7XG4gICAgICAgIHVzZXJQYXNzd29yZDogdHJ1ZSxcbiAgICAgICAgdXNlclNycDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyAyLiBEeW5hbW9EQiBUYWJsZSAtIFJFVEFJTiB0byBwcmV2ZW50IGRhdGEgbG9zc1xuICAgIGNvbnN0IHRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdUYWJsZScsIHtcbiAgICAgIHRhYmxlTmFtZTogJ3dhaS10cmF2ZWwnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdQSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdTSycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgIH0pO1xuXG4gICAgLy8gMy4gTGFtYmRhIEZ1bmN0aW9uc1xuICAgIGNvbnN0IGdlbmVyYXRlSXRpbmVyYXJ5Rm4gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdHZW5lcmF0ZUl0aW5lcmFyeScsIHtcbiAgICAgIGVudHJ5OiAnLi4vYmFja2VuZC9mdW5jdGlvbnMvZ2VuZXJhdGVJdGluZXJhcnkudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRJdGluZXJhcnlGbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldEl0aW5lcmFyeScsIHtcbiAgICAgIGVudHJ5OiAnLi4vYmFja2VuZC9mdW5jdGlvbnMvZ2V0SXRpbmVyYXJ5LnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogdGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGdldFVzZXJGbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ0dldFVzZXInLCB7XG4gICAgICBlbnRyeTogJy4uL2JhY2tlbmQvZnVuY3Rpb25zL2dldFVzZXIudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiB0YWJsZS50YWJsZU5hbWUsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc2F2ZVVzZXJQcmVmZXJlbmNlc0ZuID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnU2F2ZVVzZXJQcmVmZXJlbmNlcycsIHtcbiAgICAgIGVudHJ5OiAnLi4vYmFja2VuZC9mdW5jdGlvbnMvc2F2ZVVzZXJQcmVmZXJlbmNlcy50cycsXG4gICAgICBoYW5kbGVyOiAnaGFuZGxlcicsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFRBQkxFX05BTUU6IHRhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCB1cGRhdGVJdGluZXJhcnlGbiA9IG5ldyBsYW1iZGFOb2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgJ1VwZGF0ZUl0aW5lcmFyeScsIHtcbiAgICAgIGVudHJ5OiAnLi4vYmFja2VuZC9mdW5jdGlvbnMvdXBkYXRlSXRpbmVyYXJ5LnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogdGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlZ2VuZXJhdGVBY3Rpdml0aWVzRm4gPSBuZXcgbGFtYmRhTm9kZWpzLk5vZGVqc0Z1bmN0aW9uKHRoaXMsICdSZWdlbmVyYXRlQWN0aXZpdGllcycsIHtcbiAgICAgIGVudHJ5OiAnLi4vYmFja2VuZC9mdW5jdGlvbnMvcmVnZW5lcmF0ZUFjdGl2aXRpZXMudHMnLFxuICAgICAgaGFuZGxlcjogJ2hhbmRsZXInLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRJdGluZXJhcmllc0ZuID0gbmV3IGxhbWJkYU5vZGVqcy5Ob2RlanNGdW5jdGlvbih0aGlzLCAnR2V0SXRpbmVyYXJpZXMnLCB7XG4gICAgICBlbnRyeTogJy4uL2JhY2tlbmQvZnVuY3Rpb25zL2dldEl0aW5lcmFyaWVzLnRzJyxcbiAgICAgIGhhbmRsZXI6ICdoYW5kbGVyJyxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgVEFCTEVfTkFNRTogdGFibGUudGFibGVOYW1lLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zXG4gICAgdGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGdlbmVyYXRlSXRpbmVyYXJ5Rm4pO1xuICAgIHRhYmxlLmdyYW50UmVhZERhdGEoZ2V0SXRpbmVyYXJ5Rm4pO1xuICAgIHRhYmxlLmdyYW50UmVhZERhdGEoZ2V0SXRpbmVyYXJpZXNGbik7XG4gICAgdGFibGUuZ3JhbnRSZWFkRGF0YShnZXRVc2VyRm4pO1xuICAgIHRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShzYXZlVXNlclByZWZlcmVuY2VzRm4pO1xuICAgIHRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh1cGRhdGVJdGluZXJhcnlGbik7XG5cbiAgICAvLyBCZWRyb2NrIGFjY2VzcyAtIGFsbG93IGJvdGggSGFpa3UgKGZhc3QpIGFuZCBTb25uZXQgKGRldGFpbGVkKVxuICAgIGNvbnN0IGJlZHJvY2tQb2xpY3kgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBhY3Rpb25zOiBbJ2JlZHJvY2s6SW52b2tlTW9kZWwnXSxcbiAgICAgIHJlc291cmNlczogW1xuICAgICAgICAnYXJuOmF3czpiZWRyb2NrOio6OmZvdW5kYXRpb24tbW9kZWwvYW50aHJvcGljLmNsYXVkZS0zLWhhaWt1LTIwMjQwMzA3LXYxOjAnLFxuICAgICAgICAnYXJuOmF3czpiZWRyb2NrOio6OmZvdW5kYXRpb24tbW9kZWwvYW50aHJvcGljLmNsYXVkZS0zLXNvbm5ldC0yMDI0MDIyOS12MTowJyxcbiAgICAgIF0sXG4gICAgfSk7XG4gICAgZ2VuZXJhdGVJdGluZXJhcnlGbi5hZGRUb1JvbGVQb2xpY3koYmVkcm9ja1BvbGljeSk7XG4gICAgcmVnZW5lcmF0ZUFjdGl2aXRpZXNGbi5hZGRUb1JvbGVQb2xpY3koYmVkcm9ja1BvbGljeSk7XG5cbiAgICAvLyA0LiBBUEkgR2F0ZXdheSB3aXRoIHJlc3RyaWN0ZWQgQ09SU1xuICAgIGNvbnN0IGFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ0FwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiAnd2FpLXRyYXZlbC1hcGknLFxuICAgICAgZGVzY3JpcHRpb246ICd3QUkgVHJhdmVsIFBsYW5uZXIgQVBJJyxcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IFsnKiddLCAvLyBJbiBwcm9kdWN0aW9uLCByZXBsYWNlIHdpdGggeW91ciBkb21haW5cbiAgICAgICAgYWxsb3dNZXRob2RzOiBbJ0dFVCcsICdQT1NUJywgJ1BVVCcsICdPUFRJT05TJ10sXG4gICAgICAgIGFsbG93SGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbiddLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBDT1JTIGhlYWRlcnMgdG8gQUxMIGdhdGV3YXkgcmVzcG9uc2VzIChlcnJvcnMsIHRpbWVvdXRzLCBhdXRoIGZhaWx1cmVzKVxuICAgIC8vIFRoaXMgaXMgY3JpdGljYWwgLSB3aXRob3V0IHRoaXMsIGJyb3dzZXIgYmxvY2tzIGVycm9yIHJlc3BvbnNlcyBkdWUgdG8gbWlzc2luZyBDT1JTIGhlYWRlcnNcbiAgICBjb25zdCBjb3JzSGVhZGVycyA9IHtcbiAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiBcIicqJ1wiLFxuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiBcIidDb250ZW50LVR5cGUsQXV0aG9yaXphdGlvbidcIixcbiAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogXCInR0VULFBPU1QsUFVULE9QVElPTlMnXCIsXG4gICAgfTtcblxuICAgIC8vIEFkZCBDT1JTIHRvIGRlZmF1bHQgNFhYIHJlc3BvbnNlcyAoYXV0aCBlcnJvcnMsIGJhZCByZXF1ZXN0cywgZXRjLilcbiAgICBhcGkuYWRkR2F0ZXdheVJlc3BvbnNlKCdEZWZhdWx0NFhYJywge1xuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5SZXNwb25zZVR5cGUuREVGQVVMVF80WFgsXG4gICAgICByZXNwb25zZUhlYWRlcnM6IGNvcnNIZWFkZXJzLFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIENPUlMgdG8gZGVmYXVsdCA1WFggcmVzcG9uc2VzIChMYW1iZGEgZXJyb3JzLCB0aW1lb3V0cywgZXRjLilcbiAgICBhcGkuYWRkR2F0ZXdheVJlc3BvbnNlKCdEZWZhdWx0NVhYJywge1xuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5SZXNwb25zZVR5cGUuREVGQVVMVF81WFgsXG4gICAgICByZXNwb25zZUhlYWRlcnM6IGNvcnNIZWFkZXJzLFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIENPUlMgc3BlY2lmaWNhbGx5IHRvIHRpbWVvdXQgcmVzcG9uc2VzXG4gICAgYXBpLmFkZEdhdGV3YXlSZXNwb25zZSgnSW50ZWdyYXRpb25UaW1lb3V0Jywge1xuICAgICAgdHlwZTogYXBpZ2F0ZXdheS5SZXNwb25zZVR5cGUuSU5URUdSQVRJT05fVElNRU9VVCxcbiAgICAgIHJlc3BvbnNlSGVhZGVyczogY29yc0hlYWRlcnMsXG4gICAgICBzdGF0dXNDb2RlOiAnNTA0JyxcbiAgICAgIHRlbXBsYXRlczoge1xuICAgICAgICAnYXBwbGljYXRpb24vanNvbic6ICd7XCJlcnJvclwiOiBcIlJlcXVlc3QgdGltZWQgb3V0LiBBSSBnZW5lcmF0aW9uIGlzIHRha2luZyBsb25nZXIgdGhhbiBleHBlY3RlZC4gUGxlYXNlIHRyeSBhZ2Fpbi5cIn0nLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGF1dGhvcml6ZXIgPSBuZXcgYXBpZ2F0ZXdheS5Db2duaXRvVXNlclBvb2xzQXV0aG9yaXplcih0aGlzLCAnQXV0aG9yaXplcicsIHtcbiAgICAgIGNvZ25pdG9Vc2VyUG9vbHM6IFt1c2VyUG9vbF0sXG4gICAgfSk7XG5cbiAgICBjb25zdCBhdXRoT3B0aW9ucyA9IHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgIH07XG5cbiAgICAvLyBSb3V0ZXNcbiAgICBjb25zdCBpdGluZXJhcmllcyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdpdGluZXJhcmllcycpO1xuICAgIGl0aW5lcmFyaWVzLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGdlbmVyYXRlSXRpbmVyYXJ5Rm4pLCBhdXRoT3B0aW9ucyk7XG4gICAgaXRpbmVyYXJpZXMuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRJdGluZXJhcmllc0ZuKSwgYXV0aE9wdGlvbnMpO1xuXG4gICAgY29uc3QgaXRpbmVyYXJ5ID0gaXRpbmVyYXJpZXMuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBpdGluZXJhcnkuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRJdGluZXJhcnlGbiksIGF1dGhPcHRpb25zKTtcbiAgICBpdGluZXJhcnkuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih1cGRhdGVJdGluZXJhcnlGbiksIGF1dGhPcHRpb25zKTtcblxuICAgIGNvbnN0IHVzZXIgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgndXNlcicpO1xuICAgIHVzZXIuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihnZXRVc2VyRm4pLCBhdXRoT3B0aW9ucyk7XG5cbiAgICBjb25zdCB1c2VyUHJlZmVyZW5jZXMgPSB1c2VyLmFkZFJlc291cmNlKCdwcmVmZXJlbmNlcycpO1xuICAgIHVzZXJQcmVmZXJlbmNlcy5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihzYXZlVXNlclByZWZlcmVuY2VzRm4pLCBhdXRoT3B0aW9ucyk7XG5cbiAgICAvLyBBSSByZWdlbmVyYXRpb24gZW5kcG9pbnRcbiAgICBjb25zdCBhY3Rpdml0aWVzID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2FjdGl2aXRpZXMnKTtcbiAgICBjb25zdCByZWdlbmVyYXRlID0gYWN0aXZpdGllcy5hZGRSZXNvdXJjZSgncmVnZW5lcmF0ZScpO1xuICAgIHJlZ2VuZXJhdGUuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24ocmVnZW5lcmF0ZUFjdGl2aXRpZXNGbiksIGF1dGhPcHRpb25zKTtcblxuICAgIC8vIDUuIFMzIFN0YXRpYyBXZWJzaXRlIC0gUkVUQUlOIHRvIHByZXZlbnQgYWNjaWRlbnRhbCBkZWxldGlvblxuICAgIGNvbnN0IHdlYnNpdGVCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdXZWJzaXRlJywge1xuICAgICAgd2Vic2l0ZUluZGV4RG9jdW1lbnQ6ICdpbmRleC5odG1sJyxcbiAgICAgIHdlYnNpdGVFcnJvckRvY3VtZW50OiAnaW5kZXguaHRtbCcsIC8vIEZvciBTUEEgcm91dGluZ1xuICAgICAgcHVibGljUmVhZEFjY2VzczogdHJ1ZSxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBuZXcgczMuQmxvY2tQdWJsaWNBY2Nlc3Moe1xuICAgICAgICBibG9ja1B1YmxpY0FjbHM6IGZhbHNlLFxuICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogZmFsc2UsXG4gICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IGZhbHNlLFxuICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IGZhbHNlLFxuICAgICAgfSksXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU4sXG4gICAgfSk7XG5cbiAgICAvLyBEZXBsb3kgTmV4dC5qcyBzdGF0aWMgZXhwb3J0XG4gICAgbmV3IHMzZGVwbG95LkJ1Y2tldERlcGxveW1lbnQodGhpcywgJ0RlcGxveVdlYnNpdGUnLCB7XG4gICAgICBzb3VyY2VzOiBbczNkZXBsb3kuU291cmNlLmFzc2V0KCcuLi93ZWIvb3V0JyldLFxuICAgICAgZGVzdGluYXRpb25CdWNrZXQ6IHdlYnNpdGVCdWNrZXQsXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sSWQnLCB7XG4gICAgICB2YWx1ZTogdXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgSUQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sQ2xpZW50SWQnLCB7XG4gICAgICB2YWx1ZTogdXNlclBvb2xDbGllbnQudXNlclBvb2xDbGllbnRJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgQ2xpZW50IElEJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdBcGlVcmwnLCB7XG4gICAgICB2YWx1ZTogYXBpLnVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgVVJMJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdXZWJzaXRlVXJsJywge1xuICAgICAgdmFsdWU6IHdlYnNpdGVCdWNrZXQuYnVja2V0V2Vic2l0ZVVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnV2Vic2l0ZSBVUkwnLFxuICAgIH0pO1xuICB9XG59XG4iXX0=