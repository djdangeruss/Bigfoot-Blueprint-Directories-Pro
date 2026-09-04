import type { Request, Response, NextFunction } from "express";
import { getOwnerSession, OWNER_SESSION_COOKIE } from "../lib/ownerAuth.js";

export function ownerToken(req: Request): string | null {
  const cookieToken = req.cookies?.[OWNER_SESSION_COOKIE];
  if (typeof cookieToken === "string") return cookieToken;
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function requireOwner(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = ownerToken(req);
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const session = await getOwnerSession(token);
    if (!session) {
      res.clearCookie(OWNER_SESSION_COOKIE, { path: "/api/owner" });
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }
    (req as any).ownerId = session.ownerId;
    (req as any).ownerSessionToken = token;
    next();
  } catch {
    res.status(500).json({ error: "Auth check failed" });
  }
}
