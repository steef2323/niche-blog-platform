import assert from 'node:assert/strict';
import {
  isAirtableUrl,
  isProxiedImageSrc,
  getProxiedImageUrl,
  getContentImageProps,
} from './image-proxy';

const airtable =
  'https://v5.airtableusercontent.com/v1/foo/bar.jpg?exp=1&sig=abc';
const proxy = `/api/image-proxy?url=${encodeURIComponent(airtable)}`;

assert.equal(isAirtableUrl(airtable), true);
assert.equal(isAirtableUrl('/logos/sipandpaints.nl.webp'), false);
assert.equal(isAirtableUrl(''), false);

assert.equal(isProxiedImageSrc(proxy), true);
assert.equal(isProxiedImageSrc(airtable), false);
assert.equal(isProxiedImageSrc('/logos/local.webp'), false);

assert.equal(
  getProxiedImageUrl(airtable),
  proxy,
  'Airtable URLs must go through /api/image-proxy so next/image is not asked to optimize them',
);
assert.equal(
  getProxiedImageUrl(proxy),
  proxy,
  'already-proxied URLs stay proxied (idempotent)',
);
assert.equal(getProxiedImageUrl('/logos/local.webp'), '/logos/local.webp');
assert.equal(getProxiedImageUrl(undefined), '');
assert.equal(getProxiedImageUrl(null), '');

assert.deepEqual(getContentImageProps(airtable), {
  src: proxy,
  unoptimized: true,
});
assert.deepEqual(getContentImageProps('/logos/local.webp'), {
  src: '/logos/local.webp',
  unoptimized: false,
});
assert.deepEqual(getContentImageProps(undefined), {
  src: '',
  unoptimized: false,
});

console.log('image-proxy tests passed');
