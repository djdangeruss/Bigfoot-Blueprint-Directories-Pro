import { db } from "@workspace/db";
import { ownerSessions } from "@workspace/db";
import { eq, lt } from "drizzle-orm";
import { generateToken } from "./auth.js";

// Owner sessions live in their own table so an owner token can never satisfy
// the admin `sessions` lookup, and vice versa.

export async function createOwnerSession(ownerId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.insert(ownerSessions).values({ token, ownerId, expiresAt });
  db.delete(ownerSessions).where(lt(ownerSessions.expiresAt, new Date())).catch(() => {});
  return token;
}

export async function getOwnerSession(token: string): Promise<{ ownerId: number } | null> {
  const [session] = await db.select().from(ownerSessions).where(eq(ownerSessions.token, token)).limit(1);
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(ownerSessions).where(eq(ownerSessions.token, token));
    return null;
  }
  return { ownerId: session.ownerId };
}

export async function deleteOwnerSession(token: string): Promise<void> {
  await db.delete(ownerSessions).where(eq(ownerSessions.token, token));
}
