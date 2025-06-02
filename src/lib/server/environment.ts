// Environment configuration for AWS S3 access
// This file provides a consistent interface for environment variables
// that works during both build time and runtime
import { env as secrets } from '$env/dynamic/private' ;


// Simple environment variable loading that works in both dev and production
function getEnvVar(name: string): string {
  // In production builds, always use process.env
  if (secrets && secrets[name]) {
    return secrets[name];
  } else if (process && process.env && process.env[name]) {
    return process.env[name]
  } else {
    return ''
  }
}

export const AWS_REGION = getEnvVar('AWS_REGION');;
export const AWS_ACCESS_KEY_ID = getEnvVar('AWS_ACCESS_KEY_ID');
export const AWS_SECRET_ACCESS_KEY = getEnvVar('AWS_SECRET_ACCESS_KEY');
export const S3_BUCKET_NAME = getEnvVar('S3_BUCKET_NAME');
export const AWS_S3_ENDPOINT = getEnvVar('AWS_S3_ENDPOINT');
export const QLEVER_URL = getEnvVar('QLEVER_URL');

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
