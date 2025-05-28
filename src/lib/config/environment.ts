// Environment configuration for AWS S3 access
// This file provides a consistent interface for environment variables
// that works during both build time and runtime

import { dev } from '$app/environment';

// Try to import from SvelteKit's env modules, with fallbacks for build time
let awsRegion = '';
let awsAccessKeyId = '';
let awsSecretAccessKey = '';
let s3BucketName = '';
let awsS3Endpoint = '';

// Dynamic import that won't fail during build
try {
  // This will only work at runtime
  const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME, AWS_S3_ENDPOINT } = 
    process.env.NODE_ENV === 'production' 
      ? process.env // In production, read directly from process.env
      : await import('$env/dynamic/private'); // In dev, use SvelteKit's env system
  
  awsRegion = AWS_REGION || '';
  awsAccessKeyId = AWS_ACCESS_KEY_ID || '';
  awsSecretAccessKey = AWS_SECRET_ACCESS_KEY || '';
  s3BucketName = S3_BUCKET_NAME || '';
  awsS3Endpoint = AWS_S3_ENDPOINT || '';
} catch (error) {
  if (dev) {
    console.warn('Running in build mode or environment variables not available:', error);
  }
  // During build, we'll use empty strings, which will be replaced at runtime
}

// Export the environment variables
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