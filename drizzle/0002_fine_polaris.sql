CREATE TABLE "profiles" (
	"handle" text PRIMARY KEY NOT NULL,
	"name" text,
	"followers" integer,
	"following" integer,
	"avatar" text,
	"source" text NOT NULL,
	"not_found" boolean DEFAULT false NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
