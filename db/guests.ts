import { env } from "cloudflare:workers";

export type GuestCategory = "noivo" | "noiva";

export type GuestRecord = {
  id: string;
  submissionId: string;
  name: string;
  category: GuestCategory;
  isPrimary: boolean;
  createdAt: string;
};

type RuntimeEnv = {
  DB?: D1Database;
};

function getD1(): D1Database {
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) {
    throw new Error("O banco de confirmações não está disponível.");
  }
  return database;
}

export async function replaceGuestSubmission(input: {
  submissionId: string;
  names: string[];
  category: GuestCategory;
}): Promise<void> {
  const database = getD1();
  const createdAt = new Date().toISOString();
  const statements = [
    database
      .prepare("DELETE FROM guests WHERE submission_id = ?1")
      .bind(input.submissionId),
    ...input.names.map((name, index) =>
      database
        .prepare(
          `INSERT INTO guests (
            id,
            submission_id,
            name,
            category,
            is_primary,
            created_at
          ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        )
        .bind(
          crypto.randomUUID(),
          input.submissionId,
          name,
          input.category,
          index === 0 ? 1 : 0,
          createdAt,
        ),
    ),
  ];

  await database.batch(statements);
}

export async function listGuests(): Promise<GuestRecord[]> {
  const result = await getD1()
    .prepare(
      `SELECT
        id,
        submission_id AS submissionId,
        name,
        category,
        is_primary AS isPrimary,
        created_at AS createdAt
      FROM guests
      ORDER BY created_at DESC, is_primary DESC, name COLLATE NOCASE ASC`,
    )
    .all<{
      id: string;
      submissionId: string;
      name: string;
      category: GuestCategory;
      isPrimary: number;
      createdAt: string;
    }>();

  return (result.results ?? []).map((guest) => ({
    ...guest,
    isPrimary: guest.isPrimary === 1,
  }));
}

export async function deleteGuest(id: string): Promise<boolean> {
  const result = await getD1()
    .prepare("DELETE FROM guests WHERE id = ?1")
    .bind(id)
    .run();

  return (result.meta.changes ?? 0) > 0;
}
