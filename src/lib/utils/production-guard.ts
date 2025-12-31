/**
 * Production Guard Utilities
 * 
 * Helper functions to protect sensitive information and endpoints in production.
 * Prevents revealing infrastructure details to search engines and crawlers.
 */

/**
 * Check if we're running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if a debug/test endpoint should be accessible
 * Returns false in production, true in development
 */
export function isDebugEndpointAllowed(): boolean {
  return !isProduction();
}

/**
 * Conditionally log only in development
 * Prevents revealing infrastructure details in production logs
 */
export function devLog(...args: any[]): void {
  if (!isProduction()) {
    console.log(...args);
  }
}

/**
 * Conditionally warn only in development
 */
export function devWarn(...args: any[]): void {
  if (!isProduction()) {
    console.warn(...args);
  }
}

/**
 * Conditionally error log (errors are always logged, but can be sanitized)
 */
export function devError(...args: any[]): void {
  if (!isProduction()) {
    console.error(...args);
  } else {
    // In production, log errors but sanitize sensitive info
    const sanitized = args.map(arg => {
      if (typeof arg === 'string') {
        // Remove Airtable references from error messages
        return arg.replace(/airtable/gi, '[REDACTED]');
      }
      return arg;
    });
    console.error(...sanitized);
  }
}

