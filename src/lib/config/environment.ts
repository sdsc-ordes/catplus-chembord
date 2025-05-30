// Environment configuration for AWS S3 access
// This file provides a consistent interface for environment variables
// that works during both build time and runtime

import { dev } from '$app/environment';

// Simple environment variable loading that works in both dev and production
function getEnvVar(name: string): string {
  // In production builds, always use process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] || '';
  }
  return '';
}

// Export the environment variables
const awsRegion = getEnvVar('AWS_REGION');
const awsAccessKeyId = getEnvVar('AWS_ACCESS_KEY_ID');
const awsSecretAccessKey = getEnvVar('AWS_SECRET_ACCESS_KEY');
const s3BucketName = getEnvVar('S3_BUCKET_NAME');
const awsS3Endpoint = getEnvVar('AWS_S3_ENDPOINT');

export const AWS_REGION = awsRegion;
export const AWS_ACCESS_KEY_ID = awsAccessKeyId;
export const AWS_SECRET_ACCESS_KEY = awsSecretAccessKey;
export const S3_BUCKET_NAME = s3BucketName;
export const AWS_S3_ENDPOINT = awsS3Endpoint;

// Helper functions for validation
export function isS3Configured(): boolean {
  return Boolean(AWS_REGION && S3_BUCKET_NAME);
}

export function hasS3Credentials(): boolean {
  return Boolean(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);
}

export function validateS3Config(): void {
  if (!AWS_REGION) {
    throw new Error('Missing required environment variable: AWS_REGION');
  }
  
  if (!S3_BUCKET_NAME) {
    throw new Error('Missing required environment variable: S3_BUCKET_NAME');
  }
}