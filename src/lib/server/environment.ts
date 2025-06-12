// Environment configuration
import { env } from '$env/dynamic/private' ;
import { logger } from '$lib/server/logger';
import { getValueByPath } from '$lib/utils/getObjectValue';

// Simple environment variable loading that works in both dev and production
function getEnvVar(name: string): string {
  // In production builds, always use process.env
  if (env && env[name]) {
    return env[name];
  } else if (process && process.env && process.env[name]) {
    return process.env[name]
  } else {
    return ''
  }
}

export const AppServerConfig = {
  // Required application settings
  S3: {
    AWS_REGION: getEnvVar("AWS_REGION"),
    AWS_ACCESS_KEY_ID: getEnvVar("AWS_ACCESS_KEY_ID"),
    AWS_SECRET_ACCESS_KEY: getEnvVar("AWS_SECRET_ACCESS_KEY"),
    S3_BUCKET_NAME: getEnvVar("S3_BUCKET_NAME"),
    AWS_S3_ENDPOINT: getEnvVar("AWS_S3_ENDPOINT"),
  },
  QLEVER: {
    QLEVER_API_URL: getEnvVar("QLEVER_API_URL") || getEnvVar("QLEVER_API_URL"),
  }
};

// --- Validation Logic ---

/**
 * Validates all required and conditionally required environment variables at server startup.
 * Throws a single, comprehensive error if validation fails.
 * This should be called once from a central location, like `hooks.server.ts`.
 */
export function validateConfiguration(): void {
  // Define S3 variables that are required *if S3 is configured*.
  const s3RequiredPaths = [
    'S3.AWS_REGION',
    'S3.AWS_ACCESS_KEY_ID',
    'S3.AWS_SECRET_ACCESS_KEY',
    'S3.S3_BUCKET_NAME',
    'S3.AWS_S3_ENDPOINT',
  ];

  // Define Qlever UI variables that are required.
  const qleverRequiredPaths = [
    'QLEVER.QLEVER_API_URL',
  ];

  const missingVars: string[] = [];

  // Check qlever ui configuration
  qleverRequiredPaths.forEach(path => {
    if (!getValueByPath(AppServerConfig, path)) {
      missingVars.push(path);
    }
  });

  // Check if S3 is configured by looking for the S3 bucket name.
  s3RequiredPaths.forEach(path => {
    if (!getValueByPath(AppServerConfig, path)) {
      missingVars.push(path);
    }
  });

  // --- Final Check and Error Handling ---
  if (missingVars.length > 0) {
    const uniqueMissingVars = Array.from(new Set(missingVars));
    const errorMessage = `Missing required environment variables: ${uniqueMissingVars.join(', ')}. Server cannot start.`;
    logger.fatal({ missing: uniqueMissingVars }, errorMessage);
    throw new Error(errorMessage);
  }

  logger.info('All required environment variables are set.');
}
