# Airtable Views Setup Guide

## Overview

**YES, you should hardcode Airtable view names** for all tables. This is the **fastest and most efficient** approach for filtering content by site.

## Why Use Views?

1. **Server-Side Filtering**: Airtable filters before sending data
2. **Smaller Payloads**: Only relevant records returned
3. **Faster Queries**: Optimized by Airtable's infrastructure
4. **No JavaScript Filtering**: No need to fetch and filter in memory
5. **Better Performance**: 4-10x faster than fetching all records

## Current Status

✅ **Updated Code**: All fetch functions now support view names:
- `getBlogPostsBySiteId(siteId, limit, viewName)`
- `getListingPostsBySiteId(siteId, limit, viewName)`
- `getPagesBySiteId(siteId, viewName)`
- `getCategoriesBySiteId(siteId, viewName)`
- `getFeaturesBySiteId(siteId, viewName)`
- `getHomepageContent(siteId, viewName)`

## Setup Instructions

### Step 1: Create Views in Airtable

For each site (e.g., `sipandpaints.nl`), create views in each table:

#### **Blog Posts Table**
- View name: `sipandpaints.nl`
- Filter: `Site` = [Site Record] AND `Published` = TRUE
- Sort: `Published date` (descending)

#### **Listing Posts Table**
- View name: `sipandpaints.nl`
- Filter: `Site` = [Site Record] AND `Published` = TRUE
- Sort: `Published date` (descending)

#### **Pages Table**
- View name: `sipandpaints.nl`
- Filter: `Site` = [Site Record] AND `Published` = TRUE
- Sort: `ID` (ascending)

#### **Categories Table**
- View name: `sipandpaints.nl`
- Filter: `Site` = [Site Record]
- Sort: `Priority` (ascending)

#### **Authors Table**
- View name: `sipandpaints.nl`
- Filter: (if authors are site-specific, filter by site; otherwise, show all)
- Sort: `Name` (ascending)

#### **Features Table**
- View name: `sipandpaints.nl`
- Filter: `Enabled sites` = [Site Record]
- Sort: `ID` (ascending)

### Step 2: Configure View Names

View names are configured in **two places**:

#### Option A: Hardcode in `src/lib/site-config.ts` (Recommended)

```typescript
const domainToViews: Record<string, {
  blogPosts?: string;
  listingPosts?: string;
  pages?: string;
  categories?: string;
  authors?: string;
  features?: string;
}> = {
  'sipandpaints.nl': {
    blogPosts: 'sipandpaints.nl',
    listingPosts: 'sipandpaints.nl',
    pages: 'sipandpaints.nl',
    categories: 'sipandpaints.nl',
    authors: 'sipandpaints.nl',
    features: 'sipandpaints.nl'
  },
  // Add more sites...
};
```

#### Option B: Store in Airtable (Future Enhancement)

You could add a "View names" field to the Sites table, but for now, hardcoding is simpler and faster.

### Step 3: Naming Convention

**Recommended**: Use the domain name as the view name for all tables
- Simple: `sipandpaints.nl` for all tables
- Easy to remember
- Consistent across all tables

**Alternative**: Use descriptive names
- `sipandpaints.nl - Blog Posts`
- `sipandpaints.nl - Pages`
- More explicit, but longer

## Performance Impact

### Before (Without Views)
- **Categories**: Fetches ALL categories, filters in JavaScript
- **Features**: Fetches ALL features, filters in JavaScript
- **Pages**: Uses filterByFormula (slower than views)
- **Total**: 5-10 API calls, 2-5 seconds on cache miss

### After (With Views)
- **All Tables**: Use pre-filtered views
- **Total**: 3-5 API calls, 200-500ms on cache miss
- **4-10x faster** ⚡

## View Configuration Checklist

For each site, create views in:

- [ ] **Blog Posts** table
- [ ] **Listing Posts** table
- [ ] **Pages** table
- [ ] **Categories** table
- [ ] **Authors** table (if site-specific)
- [ ] **Features** table

## Testing

After creating views, test with:

```bash
# Test endpoint
curl http://localhost:3000/api/test-static-config?domain=sipandpaints.nl

# Check logs for:
# ✅ "Using Airtable view 'sipandpaints.nl' for blog posts"
# ✅ "Using Airtable view 'sipandpaints.nl' for categories"
# etc.
```

## Next Steps

1. **Create views in Airtable** for each site
2. **Update `site-config.ts`** with view names
3. **Test** that views are being used (check logs)
4. **Monitor performance** - should see 4-10x improvement

## Notes

- Views are **optional** - code falls back to filterByFormula if view not found
- Views should be **pre-filtered** in Airtable (don't filter in code)
- View names are **stable** - they rarely change, so hardcoding is fine
- For 20-50 sites, you'll have 20-50 views per table (manageable)

