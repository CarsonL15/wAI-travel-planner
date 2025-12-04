#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WaiTravelStack } from '../lib/wai-travel-stack';

const app = new cdk.App();
new WaiTravelStack(app, 'WaiTravelStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
