import { pgTable, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';

export const votes = pgTable(
	'votes',
	{
		voterId: text('voter_id').notNull(), // `${provider}:${providerAccountId}`
		voterHandle: text('voter_handle'), // X handle of the voter when known
		target: text('target').notNull(), // lowercased X handle, no @
		emoji: text('emoji').notNull(), // key from src/lib/emojis.ts
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.voterId, t.target] }), index('votes_target_idx').on(t.target)]
);
