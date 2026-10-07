CREATE TABLE "learning_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "learning_events_user_id_type_entity_id_key" ON "learning_events"("user_id", "type", "entity_id");
CREATE INDEX "learning_events_type_created_at_idx" ON "learning_events"("type", "created_at");
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
