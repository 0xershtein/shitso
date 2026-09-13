CREATE TABLE "bullshit_reports" (
	"bullshit_id" integer NOT NULL,
	"reporter_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bullshit_reports_bullshit_id_reporter_id_pk" PRIMARY KEY("bullshit_id","reporter_id")
);
--> statement-breakpoint
CREATE TABLE "bullshits" (
	"id" serial PRIMARY KEY NOT NULL,
	"voter_id" text NOT NULL,
	"voter_handle" text,
	"target" text NOT NULL,
	"emoji" text NOT NULL,
	"url" text NOT NULL,
	"pathname" text NOT NULL,
	"status" text DEFAULT 'live' NOT NULL,
	"reason" text,
	"reports" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "bullshit_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "bullshits_voter_target_idx" ON "bullshits" USING btree ("voter_id","target");--> statement-breakpoint
CREATE INDEX "bullshits_target_idx" ON "bullshits" USING btree ("target","status");