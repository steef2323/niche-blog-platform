/**
 * Background refresh service for redirect cache
 * Refreshes cache every 15 minutes to keep redirects up-to-date
 */

import { refreshRedirectsForSite } from './index';
import { getSiteConfig } from '@/lib/site-detection';

// Store interval IDs for cleanup
const refreshIntervals = new Map<string, NodeJS.Timeout>();

// Default refresh interval: 15 minutes
const REFRESH_INTERVAL = 15 * 60 * 1000;

/**
 * Start background refresh for a specific site
 * @param host The site host
 * @param intervalMs Optional refresh interval in milliseconds (defaults to 15 minutes)
 */
export function startBackgroundRefresh(host: string, intervalMs: number = REFRESH_INTERVAL): void {
  // Clear existing interval if any
  stopBackgroundRefresh(host);
  
  // Initial refresh
  refreshForHost(host).catch(error => {
    console.error(`Error in initial redirect refresh for ${host}:`, error);
  });
  
  // Set up periodic refresh
  const intervalId = setInterval(() => {
    refreshForHost(host).catch(error => {
      console.error(`Error in periodic redirect refresh for ${host}:`, error);
    });
  }, intervalMs);
  
  refreshIntervals.set(host, intervalId);
  console.log(`🔄 Started background redirect refresh for ${host} (every ${intervalMs / 1000 / 60} minutes)`);
}

/**
 * Stop background refresh for a specific site
 * @param host The site host
 */
export function stopBackgroundRefresh(host: string): void {
  const intervalId = refreshIntervals.get(host);
  if (intervalId) {
    clearInterval(intervalId);
    refreshIntervals.delete(host);
    console.log(`⏹️ Stopped background redirect refresh for ${host}`);
  }
}

/**
 * Stop all background refreshes
 */
export function stopAllBackgroundRefreshes(): void {
  refreshIntervals.forEach((intervalId, host) => {
    clearInterval(intervalId);
    console.log(`⏹️ Stopped background redirect refresh for ${host}`);
  });
  refreshIntervals.clear();
}

/**
 * Refresh redirects for a host
 */
async function refreshForHost(host: string): Promise<void> {
  try {
    const siteConfig = await getSiteConfig(host);
    if (siteConfig?.siteId) {
      await refreshRedirectsForSite(
        siteConfig.siteId,
        siteConfig.airtableViews?.blogPosts
      );
    }
  } catch (error) {
    console.error(`Error refreshing redirects for ${host}:`, error);
  }
}

/**
 * Initialize background refresh for all known hosts
 * Call this on server startup
 */
export async function initializeBackgroundRefresh(hosts: string[]): Promise<void> {
  console.log(`🚀 Initializing background redirect refresh for ${hosts.length} sites...`);
  
  for (const host of hosts) {
    startBackgroundRefresh(host);
  }
  
  console.log(`✅ Background redirect refresh initialized`);
}

