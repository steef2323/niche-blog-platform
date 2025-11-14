# Hardcoding Static Site Configuration: Performance Analysis

## Quick Answer

**YES, hardcoding static configuration will increase speed**, but use a **hybrid approach**:
- ✅ **Hardcode**: Colors, fonts, logo paths, domain mapping
- ❌ **Keep Dynamic**: Homepage content, pages, features, analytics IDs

**Expected Performance Gain**: 50-200ms faster on cache miss, eliminates 1-2 Airtable API calls per page load.

---

## Current Situation

### What's Fetched on Every Page Load

Currently, `getSiteConfig()` fetches:
1. **Site record** (via `getSiteByDomain()`) - ~100-200ms
   - Colors (Primary, Secondary, Accent, Background, Text)
   - Fonts (Heading, Body)
   - Logo URL
   - Analytics IDs
   - SEO defaults
   - Footer text
   - Domain mapping
2. **Pages** (via `getPagesBySiteId()`) - ~100-200ms
3. **Features** (via `getFeaturesBySiteId()`) - ~100-200ms
4. **Homepage content** (via `getHomepageContent()`) - ~100-200ms

**Total**: ~300-600ms on cache miss (1-hour cache TTL)

### Cache Behavior

- **Cache hit**: ~0ms (instant)
- **Cache miss**: ~300-600ms (4 parallel API calls)
- **Cache expires**: Every 1 hour

---

## What Should Be Hardcoded?

### ✅ **EXCELLENT Candidates for Hardcoding**

These rarely change and are small data:

#### 1. **Theme Configuration** (Colors & Fonts)
```typescript
// src/config/sites.ts
export const siteConfigs = {
  'sipandpaints.nl': {
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      background: '#FFFFFF',
      text: '#333333'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    }
  },
  // ... other sites
};
```

**Why hardcode:**
- Rarely changes (maybe once per year)
- Small data (just strings)
- Critical for initial render (CSS variables)
- Eliminates 1 API call

**Performance gain**: ~100-150ms on cache miss

#### 2. **Logo Configuration**
```typescript
export const siteConfigs = {
  'sipandpaints.nl': {
    logo: {
      url: '/logos/sipandpaints-logo.png',
      alt: 'Sip and Paints Logo',
      title: 'Sip and Paints'
    }
  }
};
```

**Why hardcode:**
- Logo rarely changes
- Small data
- Used in header (above-the-fold, critical for LCP)
- Eliminates attachment lookup

**Performance gain**: ~50-100ms on cache miss

#### 3. **Domain Mapping**
```typescript
export const siteConfigs = {
  'sipandpaints.nl': {
    domain: 'sipandpaints.nl',
    localDomain: 'localhost:3000', // for dev
    siteId: 'recXXXXXXXXXXXXXX' // Airtable record ID
  }
};
```

**Why hardcode:**
- Never changes
- Needed for site detection
- Eliminates site lookup query

**Performance gain**: ~100-200ms on cache miss (eliminates entire `getSiteByDomain()` call)

#### 4. **Airtable View Names**
```typescript
export const siteConfigs = {
  'sipandpaints.nl': {
    airtableViews: {
      blogPosts: 'sipandpaints.nl',
      listingPosts: 'sipandpaints.nl'
    }
  }
};
```

**Why hardcode:**
- View names are stable
- Needed for efficient content fetching
- Small data

**Performance gain**: Indirect (enables faster content queries)

---

### ❌ **Should Stay Dynamic (Keep in Airtable)**

These change frequently or need flexibility:

#### 1. **Homepage Content**
- Changes frequently (marketing updates)
- Rich content (markdown, images)
- Needs CMS flexibility

#### 2. **Pages** (About, Contact, etc.)
- Content changes
- May add/remove pages
- Needs CMS flexibility

#### 3. **Features** (Feature flags)
- Enable/disable features dynamically
- May change based on A/B tests
- Needs runtime flexibility

#### 4. **Analytics IDs**
- May change (switching analytics providers)
- May be empty (not all sites use analytics)
- Small but needs flexibility

#### 5. **SEO Defaults**
- May be updated for SEO optimization
- Needs CMS flexibility

#### 6. **Footer Text**
- May change seasonally
- Needs CMS flexibility

---

## Recommended Hybrid Architecture

### Structure

```typescript
// src/config/sites.ts
export interface StaticSiteConfig {
  // Hardcoded - never changes
  domain: string;
  localDomain?: string;
  siteId: string; // Airtable record ID
  
  // Theme (rarely changes)
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  
  // Logo (rarely changes)
  logo: {
    url: string;
    alt: string;
    title: string;
  };
  
  // Airtable views (stable)
  airtableViews?: {
    blogPosts?: string;
    listingPosts?: string;
  };
}

// All site configs
export const staticSiteConfigs: Record<string, StaticSiteConfig> = {
  'sipandpaints.nl': {
    domain: 'sipandpaints.nl',
    localDomain: 'localhost:3000',
    siteId: 'recXXXXXXXXXXXXXX',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      background: '#FFFFFF',
      text: '#333333'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    logo: {
      url: '/logos/sipandpaints-logo.png',
      alt: 'Sip and Paints Logo',
      title: 'Sip and Paints'
    },
    airtableViews: {
      blogPosts: 'sipandpaints.nl',
      listingPosts: 'sipandpaints.nl'
    }
  },
  // ... other sites
};

// Helper function
export function getStaticSiteConfig(domain: string): StaticSiteConfig | null {
  const normalized = normalizeDomain(domain);
  return staticSiteConfigs[normalized] || null;
}
```

### Updated Site Detection

```typescript
// src/lib/site-detection.ts
export async function getSiteConfig(domain: string): Promise<SiteConfig | null> {
  // 1. Get static config (instant, no API call)
  const staticConfig = getStaticSiteConfig(domain);
  if (!staticConfig) {
    return null;
  }
  
  // 2. Fetch only dynamic content (3 API calls instead of 4)
  const [pages, features, homepageContent] = await Promise.all([
    getPagesBySiteId(staticConfig.siteId),
    getFeaturesBySiteId(staticConfig.siteId),
    getHomepageContent(staticConfig.siteId)
  ]);
  
  // 3. Build site object from static config + dynamic data
  const site: Site = {
    id: staticConfig.siteId,
    Name: staticConfig.domain,
    Domain: staticConfig.domain,
    'Local domain': staticConfig.localDomain,
    'Primary color': staticConfig.colors.primary,
    'Secondary color': staticConfig.colors.secondary,
    'Accent color': staticConfig.colors.accent,
    'Background color': staticConfig.colors.background,
    'Text color': staticConfig.colors.text,
    'Heading font': staticConfig.fonts.heading,
    'Body font': staticConfig.fonts.body,
    'Site logo': [{ url: staticConfig.logo.url }],
    'Site logo alt text': staticConfig.logo.alt,
    'Site logo title': staticConfig.logo.title,
    // ... merge with dynamic data if needed
  };
  
  return {
    site,
    siteId: staticConfig.siteId,
    pages,
    features,
    homepageContent,
    airtableViews: staticConfig.airtableViews
  };
}
```

---

## Performance Impact

### Before (Current)

| Scenario | Time | API Calls |
|----------|------|-----------|
| Cache hit | ~0ms | 0 |
| Cache miss | ~300-600ms | 4 calls |
| Cache expired | ~300-600ms | 4 calls |

### After (With Hardcoded Config)

| Scenario | Time | API Calls |
|----------|------|-----------|
| Cache hit | ~0ms | 0 |
| Cache miss | **~200-400ms** | **3 calls** |
| Cache expired | **~200-400ms** | **3 calls** |

**Improvement**: 
- **50-200ms faster** on cache miss
- **1 fewer API call** per page load
- **25% reduction** in API calls

---

## Additional Benefits

### 1. **Faster Initial Render**
- Colors/fonts available immediately (no API wait)
- Logo can be preloaded
- CSS variables set instantly

### 2. **Better Error Handling**
- Site config always available (even if Airtable is down)
- Graceful degradation (show site with default content)

### 3. **Type Safety**
- TypeScript can validate config at build time
- Catch errors before deployment

### 4. **Version Control**
- Config changes tracked in git
- Easy to see what changed
- Rollback capability

### 5. **Reduced Airtable Load**
- Fewer API calls = less rate limit risk
- Lower Airtable usage costs

---

## Trade-offs

### ❌ **Cons of Hardcoding**

1. **Requires Code Deployment to Change**
   - Can't change colors/fonts without deploying
   - Less flexible for non-technical users

2. **Maintenance Overhead**
   - Need to keep config in sync with Airtable
   - Risk of drift between code and Airtable

3. **More Files to Manage**
   - Need to maintain `sites.ts` file
   - Need to update for each new site

### ✅ **Mitigation Strategies**

1. **Sync Script** (Optional)
   - Create script to sync Airtable → `sites.ts`
   - Run before deployment
   - Ensures consistency

2. **Validation**
   - Validate config matches Airtable on startup
   - Warn if mismatch detected

3. **Documentation**
   - Document that colors/fonts require code deployment
   - Provide clear process for updates

---

## Implementation Plan

### Phase 1: Extract Static Config (2-3 hours)
1. Create `src/config/sites.ts` with static configs
2. Extract colors, fonts, logos from Airtable
3. Add domain mapping and site IDs

### Phase 2: Update Site Detection (2-3 hours)
1. Modify `getSiteConfig()` to use static config first
2. Only fetch dynamic content (pages, features, homepage)
3. Merge static + dynamic data

### Phase 3: Update Components (1-2 hours)
1. Ensure components use merged site object
2. Test all pages render correctly
3. Verify theme/logo display

### Phase 4: Add Validation (1 hour)
1. Add startup validation (optional)
2. Add sync script (optional)
3. Document process

**Total Time**: 6-9 hours

---

## Recommendation

**✅ YES, implement hardcoding for static config**, but:

1. **Start with high-impact items**:
   - Domain mapping (eliminates site lookup)
   - Colors & fonts (critical for render)
   - Logo (above-the-fold)

2. **Keep dynamic**:
   - Homepage content
   - Pages
   - Features
   - Analytics IDs

3. **Use hybrid approach**:
   - Static config for rarely-changing data
   - Airtable for frequently-changing content

4. **Monitor performance**:
   - Track page load times before/after
   - Monitor API call counts
   - Verify cache hit rates

---

## Next Steps

1. **Decide**: Proceed with hardcoding static config?
2. **Extract**: Pull current values from Airtable
3. **Implement**: Create `sites.ts` and update detection
4. **Test**: Verify performance improvements
5. **Document**: Update docs with new process

Would you like me to:
- Create the `sites.ts` file with your current site configs?
- Update the site detection to use hardcoded config?
- Create a sync script to keep configs in sync?

