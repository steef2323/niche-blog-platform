# API Call Reduction Summary

## Problem
- **30,000 API calls/month** with almost 0 visitors
- Content changes only **2x/week**, so aggressive caching is safe
- Current caching was too short (15 minutes)

## Solutions Implemented

### 1. ✅ Increased Cache TTL Significantly
- **Content Cache**: Increased from **15 minutes → 12 hours**
  - File: `src/lib/airtable/content-cache.ts`
  - Rationale: Content changes ~2x/week, so 12-hour cache is safe
  
- **Redirect Cache**: Increased from **15 minutes → 4 hours**
  - File: `src/lib/redirects/cache.ts`
  - Rationale: Redirects change even less frequently than content

### 2. ✅ Reduced Background Refresh Frequency
- **Redirect Background Refresh**: Reduced from **15 minutes → 4 hours**
  - File: `src/lib/redirects/background-refresh.ts`
  - Impact: Reduces background API calls by **16x** (from 96/day to 6/day per site)

### 3. ✅ Added Cache-Aware Content Fetchers
- Modified key functions in `src/lib/airtable/content.ts` to check bulk cache FIRST:
  - `getBlogPostsBySiteId()` - Now checks cache before API call
  - `getListingPostsBySiteId()` - Now checks cache before API call
  - `getHomepageContent()` - Now checks cache before API call
  
- **Impact**: Most content fetches now use cached data instead of making API calls

### 4. ✅ Added Next.js ISR (Incremental Static Regeneration)
- Added `export const revalidate = 12 * 60 * 60` to key pages:
  - `src/app/page.tsx` (Homepage)
  - `src/app/blog/page.tsx` (Blog listing)
  - `src/app/blog/[slug]/page.tsx` (Blog posts)
  - `src/app/blog/category/[slug]/page.tsx` (Category pages)
  - `src/app/blog/author/[slug]/page.tsx` (Author pages)

- **Impact**: Pages are cached at the Next.js level for 12 hours, reducing server-side API calls

## Expected Results

### Before Optimization
- **30,000 API calls/month**
- Cache TTL: 15 minutes
- Background refresh: Every 15 minutes
- No cache checking in individual fetchers
- No Next.js ISR

### After Optimization
- **Estimated: <1,000 API calls/month** (97% reduction)
- Cache TTL: 12 hours (48x longer)
- Background refresh: Every 4 hours (16x less frequent)
- Cache-aware fetchers check bulk cache first
- Next.js ISR caches pages for 12 hours

### Calculation
- **Bulk content fetch**: Once per 12 hours = ~60/month (instead of ~2,880/month)
- **Individual fetches**: Most now use cache = ~90% reduction
- **Background refresh**: 6/day per site instead of 96/day = 94% reduction
- **Next.js ISR**: Pages cached for 12 hours = fewer server-side calls

## Files Modified

1. `src/lib/airtable/content-cache.ts` - Increased TTL to 12 hours
2. `src/lib/redirects/cache.ts` - Increased TTL to 4 hours
3. `src/lib/redirects/background-refresh.ts` - Reduced refresh to 4 hours
4. `src/lib/airtable/content.ts` - Added cache checking to key functions
5. `src/app/page.tsx` - Added ISR revalidate
6. `src/app/blog/page.tsx` - Added ISR revalidate
7. `src/app/blog/[slug]/page.tsx` - Added ISR revalidate
8. `src/app/blog/category/[slug]/page.tsx` - Added ISR revalidate
9. `src/app/blog/author/[slug]/page.tsx` - Added ISR revalidate

## Monitoring

To verify the reduction in API calls:
1. Check Airtable API usage dashboard
2. Monitor cache hit rates in server logs (look for "✅ Cache hit" messages)
3. Check Next.js build logs for ISR cache hits

## Additional Recommendations

If you need even more reduction:
1. **Increase cache TTL to 24 hours** (content changes 2x/week, so this is still safe)
2. **Add a webhook from Airtable** to invalidate cache when content changes
3. **Use Airtable webhooks** instead of polling for updates
4. **Consider static site generation** for rarely-changing pages

## Notes

- Cache is **in-memory**, so it resets on server restart
- For production with multiple instances, consider using Redis for shared cache
- The 12-hour cache is safe because content changes only 2x/week
- If content needs to be updated immediately, you can manually clear the cache via API endpoint (if implemented)





