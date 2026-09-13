// Vercel's file tracer misses harfbuzzjs/hb.wasm (loaded by satori via Emscripten's
// runtime fs.readFileSync). Copy it next to every traced hb.js in the function bundles.
import { readdirSync, statSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const src = require.resolve('harfbuzzjs/hb.wasm');
const root = '.vercel/output/functions';
if (!existsSync(root)) process.exit(0);

let copied = 0;
function walk(dir) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const st = statSync(p);
		if (st.isDirectory()) walk(p);
		else if (name === 'hb.js' && dirname(p).endsWith('harfbuzzjs')) {
			copyFileSync(src, join(dirname(p), 'hb.wasm'));
			copied++;
		}
	}
}
walk(root);
console.log(`[postbuild] copied hb.wasm into ${copied} bundle(s)`);
