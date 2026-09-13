CREATE TABLE "votes" (
	"voter_id" text NOT NULL,
	"voter_handle" text,
	"target" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "votes_voter_id_target_pk" PRIMARY KEY("voter_id","target")
);
--> statement-breakpoint
CREATE INDEX "votes_target_idx" ON "votes" USING btree ("target");