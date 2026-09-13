// Zips extension/ into dist/shitso-extension-<version>.zip (README excluded) for the Chrome Web Store.
import { readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const ext = resolve(root, 'extension');
const { version } = JSON.parse(readFileSync(resolve(ext, 'manifest.json'), 'utf8'));
const dist = resolve(root, 'dist');
const out = resolve(dist, `shitso-extension-${version}.zip`);

mkdirSync(dist, { recursive: true });
if (existsSync(out)) rmSync(out);
execFileSync('zip', ['-r', '-q', '-X', out, '.', '-x', 'README.md', '.DS_Store', '*/.DS_Store'], { cwd: ext, stdio: 'inherit' });
console.log(`[pack] ${out}`);
