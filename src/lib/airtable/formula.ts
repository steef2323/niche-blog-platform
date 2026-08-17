/**
 * Airtable formula helpers.
 */

export function escapeAirtableFormulaValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function slugEqualsFormula(slug: string): string {
  return `{Slug} = "${escapeAirtableFormulaValue(slug)}"`;
}

export function siteFieldIncludes(
  siteField: unknown,
  siteId: string,
): boolean {
  if (!siteId || !Array.isArray(siteField)) return false;
  return siteField.some((item) => {
    if (typeof item === 'string') return item === siteId;
    if (item && typeof item === 'object' && 'id' in item) {
      return (item as { id: string }).id === siteId;
    }
    return false;
  });
}

export function isPublished(value: unknown): boolean {
  return value === true;
}

export function isPublishedOnSite(
  fields: { Published?: unknown; Site?: unknown } | undefined,
  siteId: string,
): boolean {
  if (!fields) return false;
  return isPublished(fields.Published) && siteFieldIncludes(fields.Site, siteId);
}

/** Prefer a record assigned to this site. Never returns a record for another site. */
export function pickRecordForSite<T extends { fields?: { Site?: unknown } }>(
  records: readonly T[],
  siteId: string,
): T | undefined {
  if (records.length === 0) return undefined;
  return records.find((record) =>
    siteFieldIncludes(record.fields?.Site, siteId),
  );
}
