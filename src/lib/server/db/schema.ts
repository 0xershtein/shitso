import { pgTable, text, timestamp, primaryKey, index, serial, integer, boolean } from 'drizzle-orm/pg-core';

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

// Append-only log of every cast / change / removal. Powers rhythm + trending.
export const voteEvents = pgTable(
	'vote_events',
	{
		id: serial('id').primaryKey(),
		voterId: text('voter_id').notNull(),
		voterHandle: text('voter_handle'),
		target: text('target').notNull(),
		emoji: text('emoji').notNull(), // emoji key, or 'none' when a vote is removed
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('vote_events_target_created_idx').on(t.target, t.createdAt), index('vote_events_created_idx').on(t.createdAt)]
);

// Public profile facts for a target. Source 'x' = X API (bearer), 'extension' = observed on x.com by an extension user.
export const profiles = pgTable('profiles', {
	handle: text('handle').primaryKey(),
	name: text('name'),
	followers: integer('followers'),
	following: integer('following'),
	avatar: text('avatar'),
	source: text('source').notNull(),
	notFound: boolean('not_found').notNull().default(false),
	fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow()
});
