import { validateConfiguration } from '$lib/server/environment';
import { validatePublicConfiguration } from '$lib/config';
import type { ServerInit } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = ({ error, event }) => {
  const errorId = crypto.randomUUID();

  // Log the error with context from the event
  logger.error(
    {
      errorId,
      error,
      url: event.url.toString(),
      method: event.request.method,
    },
    'An unhandled server error occurred.'
  );

  // Return a simplified error message to the client for security
  return {
    message: `An unexpected error occurred. Please provide this ID if you contact support: ${errorId}`,
    errorId: errorId,
  };
};


// init hook runs only once when the application starts
export const init: ServerInit = async () => {
	validateConfiguration();
	validatePublicConfiguration();
};

// Logs every request
export const handle: Handle = async ({ event, resolve }) => {
	// currently this is only logging requests
	logger.info(event.request.url)
	const response = await resolve(event);
	return response;
};
