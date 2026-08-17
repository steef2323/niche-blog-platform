import assert from 'node:assert/strict';
import {
  escapeAirtableFormulaValue,
  slugEqualsFormula,
  siteFieldIncludes,
  isPublished,
  isPublishedOnSite,
  pickRecordForSite,
} from './formula';

assert.equal(escapeAirtableFormulaValue('simple-slug'), 'simple-slug');
assert.equal(escapeAirtableFormulaValue('say "hi"'), 'say \\"hi\\"');
assert.equal(slugEqualsFormula('all-amsterdam-sip-and-paint-options'), '{Slug} = "all-amsterdam-sip-and-paint-options"');

assert.equal(siteFieldIncludes(['recSite1', 'recSite2'], 'recSite1'), true);
assert.equal(siteFieldIncludes([{ id: 'recSite1' }], 'recSite1'), true);
assert.equal(siteFieldIncludes(['recOther'], 'recSite1'), false);
assert.equal(siteFieldIncludes(undefined, 'recSite1'), false);

assert.equal(isPublished(true), true);
assert.equal(isPublished(false), false);
assert.equal(isPublished('true'), false);

assert.equal(
  isPublishedOnSite({ Published: true, Site: ['recSite1'] }, 'recSite1'),
  true,
);
assert.equal(
  isPublishedOnSite({ Published: false, Site: ['recSite1'] }, 'recSite1'),
  false,
  'unpublished posts must not appear in the grid',
);
assert.equal(
  isPublishedOnSite({ Published: true, Site: ['recOther'] }, 'recSite1'),
  false,
  'posts for another site must not appear in the grid',
);
assert.equal(
  isPublishedOnSite({ Published: true }, 'recSite1'),
  false,
);

const records = [
  { id: 'a', fields: { Site: ['recOther'] } },
  { id: 'b', fields: { Site: ['recSite1'] } },
];
assert.equal(pickRecordForSite(records, 'recSite1')?.id, 'b');
assert.equal(
  pickRecordForSite(records, 'recMissing'),
  undefined,
  'do not fall back to another site\'s post',
);
assert.equal(pickRecordForSite([], 'recSite1'), undefined);

console.log('airtable formula tests passed');
