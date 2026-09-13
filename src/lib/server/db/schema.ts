import { pgTable, text, timestamp, primaryKey, index, uniqueIndex, serial, integer, boolean } from 'drizzle-orm/pg-core';

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
	bullshitHidden: boolean('bullshit_hidden').notNull().default(false), // target opted out of the wall
	fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow()
});

// "give a bullshit": one webcam polaroid per voter per target.
export const bullshits = pgTable(
	'bullshits',
	{
		id: serial('id').primaryKey(),
		voterId: text('voter_id').notNull(),
		voterHandle: text('voter_handle'),
		target: text('target').notNull(),
		emoji: text('emoji').notNull(), // the vote it came with
		url: text('url').notNull(), // public blob url
		pathname: text('pathname').notNull(), // blob pathname for deletion
		status: text('status').notNull().default('live'), // live | rejected | hidden
		reason: text('reason'), // moderation / hide reason
		reports: integer('reports').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [uniqueIndex('bullshits_voter_target_idx').on(t.voterId, t.target), index('bullshits_target_idx').on(t.target, t.status)]
);

export const bullshitReports = pgTable(
	'bullshit_reports',
	{
		bullshitId: integer('bullshit_id').notNull(),
		reporterId: text('reporter_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.bullshitId, t.reporterId] })]
);
