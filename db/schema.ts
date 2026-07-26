import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const guests = sqliteTable(
  "guests",
  {
    id: text("id").primaryKey(),
    submissionId: text("submission_id").notNull(),
    name: text("name").notNull(),
    category: text("category", { enum: ["noivo", "noiva"] }).notNull(),
    isPrimary: integer("is_primary", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("guests_submission_id_idx").on(table.submissionId),
    index("guests_category_idx").on(table.category),
    index("guests_created_at_idx").on(table.createdAt),
    check(
      "guests_category_check",
      sql`${table.category} IN ('noivo', 'noiva')`,
    ),
  ],
);
