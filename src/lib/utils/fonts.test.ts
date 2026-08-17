import assert from 'node:assert/strict';
import {
  sanitizeFontName,
  isInterFont,
  googleFontStylesheetUrl,
  uniqueNonInterFonts,
  fontFamilyValue,
} from './fonts';

assert.equal(isInterFont('Inter'), true);
assert.equal(isInterFont(' inter '), true);
assert.equal(isInterFont('Playfair Display'), false);
assert.equal(isInterFont(undefined), false);

assert.equal(sanitizeFontName('Playfair Display'), 'Playfair Display');
assert.equal(sanitizeFontName('Inter<script>'), 'Interscript');

assert.equal(
  googleFontStylesheetUrl('Playfair Display'),
  'https://fonts.googleapis.com/css2?family=Playfair%20Display:wght@400;600;700&display=swap',
);

assert.deepEqual(uniqueNonInterFonts('Inter', 'Inter'), []);
assert.deepEqual(uniqueNonInterFonts('Playfair Display', 'Inter'), [
  'Playfair Display',
]);
assert.deepEqual(uniqueNonInterFonts('Roboto', 'Roboto'), ['Roboto']);

assert.equal(
  fontFamilyValue('Inter'),
  'var(--font-inter), system-ui, sans-serif',
);
assert.equal(
  fontFamilyValue('Playfair Display'),
  "'Playfair Display', var(--font-inter), system-ui, sans-serif",
);

console.log('fonts tests passed');
