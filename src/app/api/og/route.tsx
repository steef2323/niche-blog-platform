import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/** Relative luminance (WCAG) */
function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Pick white or black for readable text on a given background */
function contrastText(bgHex: string): string {
  const rgb = hexToRgb(bgHex);
  if (!rgb) return '#ffffff';
  const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
  return lum > 0.179 ? '#1a1a1a' : '#ffffff';
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const title = searchParams.get('title') || 'Blog Post';
  const description = searchParams.get('description') || '';
  const siteName = searchParams.get('siteName') || '';
  const primaryColor = searchParams.get('primaryColor') || '#7c3aed';
  const accentColor = searchParams.get('accentColor') || '#e11d48';

  // Truncate title and description to keep layout clean
  const displayTitle = title.length > 80 ? title.slice(0, 77) + '…' : title;
  const displayDesc =
    description.length > 120 ? description.slice(0, 117) + '…' : description;

  const textColor = contrastText(primaryColor);

  return new ImageResponse(
    (
      <div
        style={{
          width: OG_WIDTH,
          height: OG_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: primaryColor,
          padding: '60px 72px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Decorative top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            backgroundColor: accentColor,
            display: 'flex',
          }}
        />

        {/* Site name */}
        {siteName && (
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: textColor,
              opacity: 0.75,
              marginBottom: 32,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'flex',
            }}
          >
            {siteName}
          </div>
        )}

        {/* Main title — flex-grow so it fills available space */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: displayTitle.length > 50 ? 52 : 64,
              fontWeight: 800,
              color: textColor,
              lineHeight: 1.15,
              display: 'flex',
            }}
          >
            {displayTitle}
          </div>
        </div>

        {/* Description */}
        {displayDesc && (
          <div
            style={{
              fontSize: 26,
              fontWeight: 400,
              color: textColor,
              opacity: 0.8,
              lineHeight: 1.5,
              marginTop: 24,
              display: 'flex',
            }}
          >
            {displayDesc}
          </div>
        )}

        {/* Bottom accent line */}
        <div
          style={{
            marginTop: 40,
            height: 3,
            backgroundColor: accentColor,
            opacity: 0.5,
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
    }
  );
}
