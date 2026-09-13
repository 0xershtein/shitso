// Zip extension/ into static/downloads/ (served by the site) using fflate (no zip CLI needed).
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { zipSync } from 'fflate';

const SRC = 'extension';
const OUT_DIR = 'static/downloads';
const manifest = JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8'));
const files = {};

function walk(dir) {
	for (const name of readdirSync(dir)) {
		if (name === 'README.md' || name === '.DS_Store' || name === '.github') continue;
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p);
		else files[relative(SRC, p).split('\\').join('/')] = readFileSync(p);
	}
}
walk(SRC);
// Fixed mtime so the same source always yields the same bytes (and the same sha256).
const zip = zipSync(files, { level: 9, mtime: '2026-01-01T00:00:00Z' });
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, `shitso-extension-${manifest.version}.zip`), zip);
writeFileSync(join(OUT_DIR, 'shitso-extension.zip'), zip);
const meta = {
	version: manifest.version,
	bytes: zip.length,
	sha256: createHash('sha256').update(zip).digest('hex'),
	files: Object.keys(files).sort(),
	permissions: manifest.permissions ?? [],
	hosts: manifest.host_permissions ?? [],
	matches: manifest.content_scripts?.flatMap((c) => c.matches) ?? []
};
writeFileSync('src/lib/extension-meta.json', JSON.stringify(meta, null, '\t') + '\n');
console.log(`[pack] extension ${manifest.version} → ${OUT_DIR} (${zip.length} bytes, ${Object.keys(files).length} files)`);
