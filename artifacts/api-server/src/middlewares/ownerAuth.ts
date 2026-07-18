import { Request, Response, NextFunction } from "express";
import { getOwnerSession } from "../lib/ownerAuth.js";

export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  getOwnerSession(token).then((session) => {
    if (!session) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }
    (req as any).ownerId = session.ownerId;
    next();
  }).catch(() => {
    res.status(500).json({ error: "Auth check failed" });
  });
}
