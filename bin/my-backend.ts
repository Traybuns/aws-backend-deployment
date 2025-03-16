#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MyBackendStack } from '../lib/my-backend-stack';

const app = new cdk.App();
new MyBackendStack(app, 'MyBackendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '976193258691',
    region: process.env.CDK_DEFAULT_REGION || 'eu-north-1'
  }
});