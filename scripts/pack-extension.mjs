// Zip extension/ into static/downloads/ (served by the site) using fflate (no zip CLI needed).
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { zipSync } from 'fflate';

const SRC = 'extension';
const OUT_DIR = 'static/downloads';
const manifest = JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8'));
const files = {};

function walk(dir) {
	for (const name of readdirSync(dir)) {
		if (name === 'README.md' || name === '.DS_Store') continue;
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p);
		else files[relative(SRC, p).split('\\').join('/')] = readFileSync(p);
	}
}
walk(SRC);
const zip = zipSync(files, { level: 9 });
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, `shitso-extension-${manifest.version}.zip`), zip);
writeFileSync(join(OUT_DIR, 'shitso-extension.zip'), zip);
console.log(`[pack] extension ${manifest.version} → ${OUT_DIR} (${zip.length} bytes, ${Object.keys(files).length} files)`);
