This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Lighthouse CI (performance & SEO budget)

The CI pipeline runs [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) on every push/PR to main and enforces these score minimums (defined in `.lighthouserc.json`):

| Category | Min score |
|---|---|
| Performance | 90 |
| Accessibility | 90 |
| Best Practices | 90 |
| SEO | 100 |

**Required GitHub Secrets** (set in repo Settings → Secrets → Actions):

| Secret | Description |
|---|---|
| `AIRTABLE_API_KEY` | Airtable personal access token |
| `AIRTABLE_BASE_ID` | Airtable base ID (e.g. `appXXXXXXXXXXXXXX`) |
| `LHCI_GITHUB_APP_TOKEN` | Optional — install the [LHCI GitHub App](https://github.com/apps/lighthouse-ci) for PR status checks |

**Run Lighthouse locally:**

```bash
# 1. Build the app
npm run build

# 2. Run LHCI against the local build (starts next start, audits, reports)
npx lhci autorun
```

Results are uploaded to temporary public storage and a URL is printed at the end of the run.

## Google Search Console verification

**TODO (action required — CEO):** The site has not yet been verified in [Google Search Console](https://search.google.com/search-console). To complete verification:

1. Log in to Google Search Console and add the property for the production domain.
2. Choose **HTML file** or **HTML tag** verification method.
3. **HTML file method:** download the `google<code>.html` file and place it in `public/`. Commit and deploy.
4. **Meta tag method:** copy the `<meta name="google-site-verification" content="…" />` tag and add it to `src/app/layout.tsx` inside `<head>` (use the Next.js `metadata.verification.google` key — see [Next.js docs](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#verification)).
5. Click **Verify** in Search Console.
6. After verification, submit the sitemap: `https://<domain>/sitemap.xml`.

The verification code/file must come from your own Google Search Console account — it cannot be committed without the actual code.

## Paperclip / Mac mini autorelease

See [docs/MAC_MINI_PAPERCLIP.md](./docs/MAC_MINI_PAPERCLIP.md). Preflight: `npm run release:preflight` — post-deploy smoke test: `npm run release:verify-prod`.
