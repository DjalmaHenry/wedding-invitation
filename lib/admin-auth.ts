import { env } from "cloudflare:workers";

const COOKIE_NAME = "dv_admin_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();

type RuntimeEnv = {
  ADMIN_PASSWORD?: string;
};

function getAdminPassword(): string {
  const password = (env as unknown as RuntimeEnv).ADMIN_PASSWORD;
  if (!password) {
    throw new Error("A senha administrativa não foi configurada.");
  }
  return password;
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: string): Promise<string> {
  return bytesToHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function signSession(expiresAt: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getAdminPassword()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToHex(
    await crypto.subtle.sign("HMAC", key, encoder.encode(expiresAt)),
  );
}

export async function verifyAdminPassword(candidate: string): Promise<boolean> {
  const [candidateHash, expectedHash] = await Promise.all([
    sha256(candidate),
    sha256(getAdminPassword()),
  ]);
  return constantTimeEqual(candidateHash, expectedHash);
}

export async function createAdminSessionCookie(): Promise<string> {
  const expiresAt = String(
    Date.now() + SESSION_DURATION_SECONDS * 1_000,
  );
  const signature = await signSession(expiresAt);
  return `${COOKIE_NAME}=${expiresAt}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}`;
}

export function clearAdminSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function hasValidAdminSession(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return false;

  const value = cookie.slice(COOKIE_NAME.length + 1);
  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature || Number(expiresAt) <= Date.now()) return false;

  const expectedSignature = await signSession(expiresAt);
  return constantTimeEqual(signature, expectedSignature);
}
