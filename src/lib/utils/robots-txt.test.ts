import assert from 'node:assert/strict';
import { buildRobotsTxt } from './robots-txt';

const robots = buildRobotsTxt({
  sitemapUrl: 'https://www.sipandpaints.nl/sitemap.xml',
  customRules: 'Disallow: /*?*',
});

assert.match(robots, /Allow: \/api\/image-proxy/);
assert.match(robots, /Disallow: \/api\//);

const allowIndex = robots.lastIndexOf('Allow: /api/image-proxy');
const queryDisallowIndex = robots.indexOf('Disallow: /*?*');
assert.ok(
  allowIndex > queryDisallowIndex,
  'Allow: /api/image-proxy must appear after Disallow: /*?* so query-string image URLs stay crawlable',
);

assert.equal(
  (robots.match(/Allow: \/api\/image-proxy/g) || []).length >= 2,
  true,
  'Allow rule should be listed before Disallow: /api/ and repeated after query-string rules',
);

assert.doesNotMatch(robots, /^Allow: \/api\/$/m);

console.log('robots.txt tests passed');
