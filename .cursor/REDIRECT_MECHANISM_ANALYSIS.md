# Redirect Mechanism Analysis

## Current State
- Redirects checked in page component (after Airtable query)
- Requires full post fetch even for redirect-only checks
- ~200-500ms overhead per request
- Doesn't scale well for 20-50 sites

## Recommended Solution: **Middleware + In-Memory Cache**

### Architecture
```
Request → Middleware → Check Cache → Redirect (if found) → Page Render
                              ↓ (cache miss)
                         Query Airtable → Update Cache → Continue
```

### Implementation Strategy

#### 1. Redirect Cache Structure
```typescript
// In-memory cache per site
const redirectCache = new Map<string, {
  redirects: Map<string, string>, // slug → redirectUrl
  lastUpdated: number,
  ttl: number // 5-15 minutes
}>();
```

#### 2. Middleware Logic
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Only check blog post routes
  if (pathname.startsWith('/blog/')) {
    const slug = pathname.split('/blog/')[1];
    const host = request.headers.get('host');
    
    // Get redirect from cache
    const redirectUrl = await getRedirectFromCache(host, slug);
    
    if (redirectUrl) {
      return NextResponse.redirect(new URL(redirectUrl, request.url), 307);
    }
  }
  
  // Continue with normal request
  return NextResponse.next();
}
```

#### 3. Cache Management
- **Initial Load**: Fetch all redirects for all sites on startup
- **Refresh Strategy**: 
  - Background refresh every 5-15 minutes
  - On-demand refresh via webhook (Airtable automation)
  - Lazy refresh on cache miss
- **Cache Size**: ~1-5KB per site (minimal memory footprint)

### Performance Comparison

| Approach | Lookup Time | Airtable Queries | Scalability |
|----------|-------------|------------------|-------------|
| **Current (page-level)** | 200-500ms | Every request | ❌ Poor |
| **Middleware + Cache** | 1-5ms | Once per site per 5-15min | ✅ Excellent |
| **Airtable View** | 50-200ms | Every request | ⚠️ Moderate |
| **Static File** | 1-5ms | Never (build-time) | ⚠️ Good (but static) |

### Implementation Steps

1. **Create redirect cache module** (`src/lib/redirects/cache.ts`)
   - In-memory Map storage
   - TTL management
   - Refresh logic

2. **Create redirect fetcher** (`src/lib/redirects/fetcher.ts`)
   - Fetch redirects from Airtable (lightweight query)
   - Filter: `{Redirect status} = "Redirect" AND {Redirect to} != ""`
   - Return Map<slug, redirectUrl>

3. **Update middleware** (`middleware.ts`)
   - Check cache before page render
   - Handle redirects at edge level
   - Fallback to Airtable on cache miss

4. **Background refresh** (optional)
   - SetInterval or cron job
   - Refresh cache every 5-15 minutes
   - Or use Airtable webhook for instant updates

### Airtable Query Optimization

Create a dedicated view or query:
```javascript
// Only fetch posts with redirects
base('Blog posts').select({
  view: 'sipandpaints.nl', // Site-specific view
  fields: ['Slug', 'Redirect status', 'Redirect to'],
  filterByFormula: 'AND({Redirect status} = "Redirect", {Redirect to} != "")',
  maxRecords: 1000 // Adjust based on your needs
})
```

This query is **much faster** than fetching full post records.

### Memory Footprint Estimate

- 20-50 sites
- ~100 redirects per site (worst case)
- ~50 bytes per redirect entry
- **Total: ~50-250KB** (negligible)

### Edge Cases Handled

1. **Unpublished posts**: Cache includes unpublished posts with redirects
2. **Cache miss**: Fallback to Airtable query, then cache result
3. **Cache invalidation**: TTL-based or webhook-triggered
4. **Multiple sites**: Separate cache per site (by host/domain)

### Alternative: Redis Cache (for production scale)

If you need distributed caching across multiple servers:
- Use Redis instead of in-memory Map
- Same API, different storage
- ~1-5ms lookup time (network overhead)
- Better for multi-instance deployments

## Recommendation

**Start with Option 1 (Middleware + In-Memory Cache)** because:
1. ✅ Fastest possible performance (1-5ms)
2. ✅ No Airtable queries on most requests
3. ✅ Works for unpublished posts
4. ✅ Scales to 20-50 sites easily
5. ✅ Simple to implement
6. ✅ Can upgrade to Redis later if needed

**Fallback strategy**: If cache miss, query Airtable and update cache (self-healing).









