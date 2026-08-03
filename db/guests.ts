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

export type InvitedGuestRecord = {
  id: string;
  firstName: string;
  normalizedFirstName: string;
  matchedGuestId: string | null;
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

export async function updateGuestName(
  id: string,
  name: string,
): Promise<GuestRecord | null> {
  const database = getD1();
  const result = await database
    .prepare("UPDATE guests SET name = ?1 WHERE id = ?2")
    .bind(name, id)
    .run();
  if ((result.meta.changes ?? 0) === 0) return null;

  const guest = await database
    .prepare(
      `SELECT id, submission_id AS submissionId, name, category,
        is_primary AS isPrimary, created_at AS createdAt
       FROM guests WHERE id = ?1`,
    )
    .bind(id)
    .first<{
      id: string;
      submissionId: string;
      name: string;
      category: GuestCategory;
      isPrimary: number;
      createdAt: string;
    }>();

  return guest ? { ...guest, isPrimary: guest.isPrimary === 1 } : null;
}

export async function listInvitedGuests(): Promise<InvitedGuestRecord[]> {
  const result = await getD1()
    .prepare(
      `SELECT id, first_name AS firstName,
        normalized_first_name AS normalizedFirstName,
        matched_guest_id AS matchedGuestId,
        created_at AS createdAt
       FROM invited_guests
       ORDER BY first_name COLLATE NOCASE ASC, created_at ASC`,
    )
    .all<InvitedGuestRecord>();
  return result.results ?? [];
}

export async function createInvitedGuests(
  names: Array<{ firstName: string; normalizedFirstName: string }>,
): Promise<InvitedGuestRecord[]> {
  if (names.length === 0) return [];
  const database = getD1();
  const createdAt = new Date().toISOString();
  const records = names.map((name) => ({
    id: crypto.randomUUID(),
    ...name,
    matchedGuestId: null,
    createdAt,
  }));
  await database.batch(
    records.map((record) =>
      database
        .prepare(
          `INSERT INTO invited_guests
           (id, first_name, normalized_first_name, created_at)
           VALUES (?1, ?2, ?3, ?4)`,
        )
        .bind(
          record.id,
          record.firstName,
          record.normalizedFirstName,
          record.createdAt,
        ),
    ),
  );
  return records;
}

export async function deleteInvitedGuest(id: string): Promise<boolean> {
  const result = await getD1()
    .prepare("DELETE FROM invited_guests WHERE id = ?1")
    .bind(id)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function updateInvitedGuestMatch(
  id: string,
  guestId: string | null,
): Promise<InvitedGuestRecord | null> {
  const database = getD1();
  const invitation = await database
    .prepare("SELECT id FROM invited_guests WHERE id = ?1")
    .bind(id)
    .first<{ id: string }>();
  if (!invitation) return null;

  if (guestId) {
    const guest = await database
      .prepare("SELECT id FROM guests WHERE id = ?1")
      .bind(guestId)
      .first<{ id: string }>();
    if (!guest) throw new Error("guest_not_found");

    const existingMatch = await database
      .prepare(
        "SELECT id FROM invited_guests WHERE matched_guest_id = ?1 AND id != ?2",
      )
      .bind(guestId, id)
      .first<{ id: string }>();
    if (existingMatch) throw new Error("guest_already_linked");
  }

  await database
    .prepare("UPDATE invited_guests SET matched_guest_id = ?1 WHERE id = ?2")
    .bind(guestId, id)
    .run();

  return database
    .prepare(
      `SELECT id, first_name AS firstName,
        normalized_first_name AS normalizedFirstName,
        matched_guest_id AS matchedGuestId,
        created_at AS createdAt
       FROM invited_guests WHERE id = ?1`,
    )
    .bind(id)
    .first<InvitedGuestRecord>();
}
