// Render the 💩 twemoji SVG into PNG icons for the site and the extension.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const svg = readFileSync('static/favicon.svg', 'utf8');
const padded = (size, pad) =>
	`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#0a0a0a"/><g transform="translate(${pad},${pad}) scale(${(size - pad * 2) / 36})">${svg.replace(/<\?xml[^>]*>/, '').replace(/<svg[^>]*>/, '').replace('</svg>', '')}</g></svg>`;

function png(source, size) {
	return new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng();
}
mkdirSync('static/icons', { recursive: true });
// plain emoji, transparent (favicons)
for (const s of [16, 32, 48]) writeFileSync(`static/icons/favicon-${s}.png`, png(svg, s));
// rounded dark tile (apple / pwa / extension)
for (const s of [180, 192, 512]) writeFileSync(`static/icons/icon-${s}.png`, png(padded(s, s * 0.12), s));
for (const s of [16, 48, 128]) writeFileSync(`extension/icons/${s}.png`, png(padded(s, s * 0.12), s));
console.log('icons written');
