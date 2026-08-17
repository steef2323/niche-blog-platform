export function sanitizeFontName(name: string): string {
  return name.replace(/[^a-zA-Z0-9 \-]/g, '');
}

export function isInterFont(name?: string | null): boolean {
  return (name || '').trim().toLowerCase() === 'inter';
}

export function googleFontStylesheetUrl(fontName: string): string {
  const safe = sanitizeFontName(fontName);
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(safe)}:wght@400;600;700&display=swap`;
}

export function uniqueNonInterFonts(
  heading?: string | null,
  body?: string | null,
): string[] {
  const names = [heading, body]
    .filter((name): name is string => !!name && name.trim() !== '')
    .map(sanitizeFontName);

  return [...new Set(names)].filter((name) => !isInterFont(name));
}

export function fontFamilyValue(fontName?: string | null): string {
  if (!fontName || isInterFont(fontName)) {
    return 'var(--font-inter), system-ui, sans-serif';
  }

  return `'${sanitizeFontName(fontName)}', var(--font-inter), system-ui, sans-serif`;
}
