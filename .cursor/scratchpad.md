# Multi-Site Framework with Airtable Integration

## Background and Motivation

We're building a single framework (both frontend and backend) that can be used to deploy multiple websites. Each website will dynamically load content from Airtable, including:
- Images
- Text
- Links
- Colors
- Fonts
- Feature flags for functionality

Each website will have a unique domain and will present a completely different look and feel, even though they all use the same underlying codebase. The system will detect which site to display based on the URL, and will load the appropriate content and styling from Airtable.

From our Airtable schema, we can see:
- A "Sites" table for site-specific configuration (colors, fonts, domain, etc.)
- Features table linked to sites (Blog, Business listing articles, etc.)
- Pages table for site-specific pages
- Blog posts table for content
- Listing posts table for business listings

## Key Challenges and Analysis

1. **Domain Recognition**: We need to detect which domain is being accessed to serve the appropriate site content.

2. **Dynamic Configuration**: We need a central configuration system that loads site-specific data from Airtable.

3. **Feature Flagging**: Some sites may need blog functionality, others may need listing functionality, etc.

4. **Component Flexibility**: Components need to adapt to different styling configurations.

5. **Performance**: We need to efficiently fetch and cache data from Airtable to minimize API calls.

6. **Typing**: We need a strong type system for the Airtable data to ensure type safety.

## High-level Task Breakdown

### Phase 1: Core Infrastructure

1. **Airtable Integration Layer**
   - ✅ Create utility functions for Airtable API interaction
   - ✅ Set up environment configuration
   - ✅ Implement and test basic Airtable connection
   - ✅ Create TypeScript interfaces for all Airtable tables
   - [ ] Define TypeScript interfaces for all Airtable tables
   - [ ] Implement data fetching and caching strategy
   Success criteria: Able to fetch data from Airtable with proper typing

2. **Site Configuration System**
   - [ ] Create a context provider for site configuration
   - [ ] Implement domain detection logic
   - [ ] Build centralized configuration loading
   Success criteria: Components can access site-specific configuration based on domain

3. **Theme System**
   - [ ] Implement dynamic theming based on site configuration
   - [ ] Create CSS variable system for colors, fonts, etc.
   Success criteria: Site renders with colors/fonts from Airtable configuration

### Phase 2: Homepage Implementation

4. **Homepage Layout**
   - Create the basic layout components
   - Implement dynamic content sections based on Airtable data
   - Success criteria: Homepage displays with content from Airtable

5. **Navigation**
   - Build header/footer components that adapt to site configuration
   - Implement dynamic menu based on Pages table
   - Success criteria: Navigation works and links to proper pages

### Phase 3: Blog Functionality

6. **Blog Infrastructure**
   - Create reusable components for blog posts
   - Implement blog listing and detail pages
   - Add conditional rendering based on feature flags
   - Success criteria: Blog posts from Airtable display correctly on sites with blog feature enabled

7. **Blog Styling**
   - Implement site-specific styling for blog components
   - Create flexible layout system for posts
   - Success criteria: Blogs have site-specific styling while using same components

### Phase 4: Testing and Refinement

8. **Testing Multiple Sites**
   - Test functionality across multiple domains
   - Verify styling differences
   - Success criteria: Multiple sites work correctly with different styling/content

9. **Performance Optimization**
   - Implement caching for Airtable data
   - Optimize loading times
   - Success criteria: Sites load quickly and efficiently

## Project Status Board

### Current Focus: Phase 1.2 - Site Configuration System
Completed:
- ✅ Created src/lib/airtable/config.ts for API configuration
- ✅ Created src/lib/airtable/sites.ts with test connection function
- ✅ Created test API endpoint at /api/test-airtable
- ✅ Successfully tested Airtable connection with proper authentication
- ✅ Created TypeScript interfaces for all Airtable tables
- ✅ Implemented getSiteByDomain function with caching (1-hour duration)
- ✅ Added domain normalization and fallback site logic
- ✅ Created SiteProvider context and hooks for site data
- ✅ Implemented site data loading in root layout
- ✅ Created src/styles/theme.ts for theme type definitions
- ✅ Implemented CSS variable generation from site theme data
- ✅ Created utility functions for applying theme styles
- ✅ Added theme application in root layout
- ✅ Created theme test page to verify configuration

Next actions:
1. Base Component Development:
   - [ ] Create src/components/layout directory
   - [ ] Create BaseLayout component with proper theme application
   - [ ] Implement Header component with:
     - Site logo
     - Navigation menu from Pages table
     - Proper theme styling
   - [ ] Implement Footer component with:
     - Site-specific content
     - Theme styling
   Success criteria: Have working layout components that adapt to site configuration

2. Dynamic Page Routing:
   - [ ] Create middleware to handle domain-based routing
   - [ ] Implement dynamic route generation from Pages table
   - [ ] Add loading and error states
   - [ ] Handle 404 cases for non-existent pages
   Success criteria: Pages from Airtable are automatically available as routes

3. Homepage Implementation:
   - [ ] Create flexible section components
   - [ ] Implement content rendering from Airtable
   - [ ] Add proper error boundaries
   Success criteria: Homepage displays with proper layout and content from Airtable

## Executor's Feedback or Assistance Requests

Successfully established connection to Airtable! The test endpoint is now working correctly. Moving on to implementing type definitions and data fetching functions.

## Lessons

1. Development Environment Setup
   - Removed `--turbopack` flag from `next dev` command as it's not supported in the current Next.js setup
   - The standard `next dev` command should be used for development
   - Next.js requires configuration in `next.config.js` or `next.config.mjs`, not `next.config.ts`
   - Use JSDoc type annotations in `next.config.js` for TypeScript support
   - When using `next/font`, ensure fonts are available through the specified source
   - For custom fonts, they need to be properly configured or use alternatives from Google Fonts
   - Tailwind CSS setup requires proper configuration

2. Airtable Integration
   - Personal Access Tokens (PAT) are preferred over legacy API keys
   - Environment variables must be in `.env.local` for Next.js to recognize them
   - Airtable configuration requires proper error handling and type definitions
   - Enhanced logging helps debug connection issues
   - Always verify token permissions and base ID access

*Additional lessons will be populated as we learn during implementation* 