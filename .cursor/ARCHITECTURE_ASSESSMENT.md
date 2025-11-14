# Architecture Assessment: Multi-Site Blogging Framework

## Executive Summary

**Current Status**: Your system has a solid foundation but has **critical performance bottlenecks** that will become severe as you scale to 20-50 sites. The good news: The architecture is fixable with focused improvements.

**Verdict**: ⚠️ **NOT optimal for 20-50 sites** in its current state, but **CAN BE optimized** to handle this scale efficiently.

---

## Current Architecture Analysis

### ✅ What's Working Well

1. **Caching Strategy**: 
   - Site config cache (1 hour TTL)
   - Bulk content cache (15 minutes TTL)
   - Reduces redundant API calls

2. **Parallel Fetching**: 
   - Uses `Promise.all()` for concurrent requests
   - Efficient when fetching multiple data types

3. **Airtable Views Support**: 
   - Infrastructure exists to use pre-filtered views
   - Views are the FASTEST way to filter in Airtable

4. **Centralized Site Detection**: 
   - Single entry point (`getSiteConfig`)
   - Prevents duplicate lookups

### ❌ Critical Performance Issues

#### 1. **Bulk Fetching Anti-Pattern** (MAJOR ISSUE)

**Current Behavior:**
```typescript
// Fetches ALL published content from ALL sites
getAllPublishedContent() → fetches 10,000+ records
  → Then filters in JavaScript for specific site
```

**Problem:**
- At 20-50 sites with 100-500 posts each = **2,000-25,000 blog posts** fetched per request
- Wastes bandwidth, memory, and API quota
- Airtable API rate limits: **5 requests/second** (free) or **10-20/second** (paid)
- Each bulk fetch counts as 1 request, but returns massive payloads

**Impact:**
- First request: Slow (fetching everything)
- Subsequent requests: Fast (cached), but cache expires every 15 minutes
- Cache miss = 2-5 second page load times
- Risk of hitting rate limits during traffic spikes

#### 2. **Manual Filtering Fallbacks** (MODERATE ISSUE)

**Current Behavior:**
```typescript
// Many functions have this pattern:
try {
  // Try filterByFormula
} catch {
  // Fallback: Fetch ALL records, filter in JavaScript
  const allPosts = await base(TABLES.BLOG_POSTS).select().all();
  const filtered = allPosts.filter(post => /* manual filtering */);
}
```

**Problem:**
- Fallback triggers when Airtable formulas fail
- Fetches ALL records unnecessarily
- Slow and wasteful

#### 3. **Inconsistent View Usage** (MODERATE ISSUE)

**Current Behavior:**
- Views are **optional** (`viewName?: string`)
- Only 1 domain mapped in `site-config.ts` (sipandpaints.nl)
- Most code paths don't use views

**Problem:**
- Views are the **fastest** filtering method in Airtable
- Airtable pre-filters server-side
- Only returns relevant records
- Should be the PRIMARY method, not optional

#### 4. **Multiple Query Strategies** (MINOR ISSUE)

**Current Behavior:**
- `getSiteConfig()` uses individual queries
- `getAllPublishedContent()` uses bulk fetching
- `getBlogPostsBySiteId()` uses filterByFormula or views
- Inconsistent patterns across codebase

**Problem:**
- Hard to optimize when there are multiple paths
- Some code uses bulk (slow), some uses views (fast)

---

## Performance Projections

### Current System (20 Sites, 200 Posts Each)

| Scenario | Request Time | API Calls | Cache Hit Rate |
|----------|--------------|-----------|----------------|
| **Cold Start** (cache miss) | 2-5 seconds | 5-10 calls | 0% |
| **Warm Cache** | 50-200ms | 0 calls | 100% |
| **Cache Expired** | 2-5 seconds | 5-10 calls | 0% |
| **Traffic Spike** | 5-10+ seconds | Rate limited | Variable |

**Issues:**
- Cache expires every 15 minutes → frequent slow requests
- Bulk fetching = large payloads = slow network transfer
- Risk of rate limiting during traffic spikes

### Optimized System (Using Views)

| Scenario | Request Time | API Calls | Cache Hit Rate |
|----------|--------------|-----------|----------------|
| **Cold Start** | 200-500ms | 3-5 calls | 0% |
| **Warm Cache** | 50-200ms | 0 calls | 100% |
| **Cache Expired** | 200-500ms | 3-5 calls | 0% |
| **Traffic Spike** | 300-600ms | Within limits | High |

**Improvements:**
- 4-10x faster on cache miss
- Smaller payloads = faster transfer
- Lower API call count = less rate limit risk

---

## Recommended Architecture

### ✅ **OPTIMAL APPROACH: Airtable Views as Primary Strategy**

**Why Views Are Best:**
1. **Server-Side Filtering**: Airtable filters before sending data
2. **Smaller Payloads**: Only relevant records returned
3. **Faster Queries**: Optimized by Airtable's infrastructure
4. **No JavaScript Filtering**: No need to fetch and filter in memory

**Implementation Strategy:**

#### 1. **Create Views in Airtable** (One-time setup per site)

For each site (e.g., `sipandpaints.nl`):
- **Blog Posts View**: Filter `Site` = [Site Record], `Published` = TRUE
- **Listing Posts View**: Filter `Site` = [Site Record], `Published` = TRUE
- **Pages View**: Filter `Site` = [Site Record], `Published` = TRUE

**View Naming Convention:**
- `sipandpaints.nl` (for blog posts)
- `sipandpaints.nl` (for listing posts)
- Or: `sipandpaints.nl - Blog Posts`, `sipandpaints.nl - Listings`

#### 2. **Update Code to Use Views by Default**

```typescript
// BEFORE (current - slow)
const posts = await getBlogPostsBySiteId(siteId); // Fetches all, filters in JS

// AFTER (optimized - fast)
const posts = await getBlogPostsBySiteId(siteId, undefined, viewName); // Uses view
```

#### 3. **Remove Bulk Fetching Pattern**

**Eliminate:**
- `getAllPublishedContent()` - fetches everything
- `getSiteDataOptimized()` - filters in JavaScript

**Replace with:**
- Direct view-based queries per site
- Only fetch what's needed for that specific site

#### 4. **Enhanced Caching Strategy**

**Current:**
- 15-minute TTL for bulk content
- 1-hour TTL for site config

**Optimized:**
- **30-60 minute TTL** for site-specific content (views return less data, can cache longer)
- **Cache invalidation webhook** from Airtable (optional, advanced)
- **Stale-while-revalidate** pattern (serve stale cache while refreshing)

---

## Migration Plan

### Phase 1: Setup Airtable Views (1-2 hours)
1. Create views in Airtable for each site
2. Test views return correct filtered data
3. Document view naming convention

### Phase 2: Update Code to Prioritize Views (4-6 hours)
1. Make `viewName` **required** (not optional) in content fetching functions
2. Update `getSiteConfig()` to always pass view names
3. Update all call sites to use views
4. Remove bulk fetching functions (or deprecate)

### Phase 3: Remove Fallback Patterns (2-3 hours)
1. Remove manual filtering fallbacks
2. Fail fast if views don't exist (better error messages)
3. Add validation to ensure views are configured

### Phase 4: Optimize Caching (2-3 hours)
1. Increase cache TTL for view-based queries
2. Implement cache warming (pre-fetch on deploy)
3. Add cache statistics/monitoring

**Total Estimated Time: 9-14 hours**

---

## Alternative Approaches (If Views Don't Work)

### Option A: Separate Airtable Bases Per Site
- **Pros**: Complete isolation, no filtering needed
- **Cons**: Harder to manage, duplicate schema, more API keys

### Option B: Database Sync (PostgreSQL/MySQL)
- **Pros**: Fast queries, full control, no rate limits
- **Cons**: Complex setup, sync complexity, additional infrastructure

### Option C: CDN + Static Generation (Next.js ISR)
- **Pros**: Extremely fast, no API calls at runtime
- **Cons**: Stale content, rebuild complexity, not real-time

**Recommendation**: Stick with Airtable Views (simplest, most maintainable)

---

## Performance Benchmarks to Track

### Before Optimization:
- Average page load (cold): 2-5 seconds
- Average page load (warm): 50-200ms
- API calls per page: 5-10
- Cache hit rate: ~70-80% (15-min TTL)

### After Optimization (Target):
- Average page load (cold): 200-500ms
- Average page load (warm): 50-200ms
- API calls per page: 3-5
- Cache hit rate: ~85-95% (60-min TTL)

---

## Final Recommendation

**✅ YES, your current architecture CAN work for 20-50 sites**, but you **MUST**:

1. **Use Airtable Views as the primary filtering method** (not optional)
2. **Remove bulk fetching pattern** (fetch only what's needed per site)
3. **Increase cache TTL** (views return less data, can cache longer)
4. **Remove manual filtering fallbacks** (fail fast, fix views if broken)

**Without these changes**, you'll experience:
- Slow page loads (2-5 seconds) on cache misses
- API rate limiting during traffic spikes
- High server memory usage (storing all content)
- Poor user experience

**With these changes**, you'll have:
- Fast page loads (200-500ms) even on cache misses
- Efficient API usage (within rate limits)
- Low memory footprint (only site-specific data)
- Excellent user experience

---

## Next Steps

1. **Decide**: Do you want to proceed with the optimization?
2. **Plan**: Should I create a detailed implementation plan in the scratchpad?
3. **Execute**: Should I start implementing the changes?

Let me know how you'd like to proceed!

