import crypto from "node:crypto";
import { db, ownerSessions } from "@workspace/db";
import { eq, lt } from "drizzle-orm";
import { generateToken } from "./auth.js";

export const OWNER_SESSION_COOKIE = "colrest_owner_session";

function tokenHash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createOwnerSession(ownerId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  await db.insert(ownerSessions).values({ tokenHash: tokenHash(token), ownerId, expiresAt });
  void db.delete(ownerSessions).where(lt(ownerSessions.expiresAt, new Date())).catch(() => undefined);
  return token;
}

export async function getOwnerSession(token: string): Promise<{ ownerId: number } | null> {
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  const [session] = await db.select().from(ownerSessions).where(eq(ownerSessions.tokenHash, tokenHash(token))).limit(1);
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(ownerSessions).where(eq(ownerSessions.id, session.id));
    return null;
  }
  return { ownerId: session.ownerId };
}

export async function deleteOwnerSession(token: string): Promise<void> {
  if (!/^[a-f0-9]{64}$/i.test(token)) return;
  await db.delete(ownerSessions).where(eq(ownerSessions.tokenHash, tokenHash(token)));
}
