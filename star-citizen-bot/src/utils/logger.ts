/**
 * Logs an error in a secure and standardized way.
 * This utility ensures that only relevant error information is logged,
 * preventing the exposure of raw stack traces that may contain sensitive information.
 *
 * @param message A descriptive message about where/when the error occurred.
 * @param error The error object or unknown error caught.
 */
export function logError(message: string, error?: unknown): void {
  if (error instanceof Error) {
    // Log the message, error name, and error message
    // This avoids printing the full stack trace which might contain sensitive paths
    console.error(`[ERROR] ${message}: ${error.name} - ${error.message}`);

    // If in development, or if specifically needed, you might log more,
    // but for this security fix we prioritize redaction.
    // console.error(error.stack);
  } else if (error) {
    console.error(`[ERROR] ${message}:`, error);
  } else {
    console.error(`[ERROR] ${message}`);
  }
}
