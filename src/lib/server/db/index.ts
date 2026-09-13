import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Created lazily so the build-time route analysis does not need a real DATABASE_URL.
let _db: NeonHttpDatabase<typeof schema> | undefined;

export function getDb(): NeonHttpDatabase<typeof schema> {
	if (!_db) {
		if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
		_db = drizzle(neon(env.DATABASE_URL), { schema });
	}
	return _db;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
	get(_t, prop, recv) {
		const real = getDb() as unknown as Record<string | symbol, unknown>;
		const v = Reflect.get(real, prop, recv);
		return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(real) : v;
	}
});
