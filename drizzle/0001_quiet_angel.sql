CREATE TABLE "vote_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"voter_id" text NOT NULL,
	"voter_handle" text,
	"target" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "vote_events_target_created_idx" ON "vote_events" USING btree ("target","created_at");--> statement-breakpoint
CREATE INDEX "vote_events_created_idx" ON "vote_events" USING btree ("created_at");