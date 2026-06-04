import { Request, Response, NextFunction } from "express";
import { getSession } from "../lib/auth.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  getSession(token).then((session) => {
    if (!session) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }
    (req as any).userId = session.userId;
    (req as any).userRole = session.role;
    next();
  }).catch(() => {
    res.status(500).json({ error: "Auth check failed" });
  });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if ((req as any).userRole !== "admin") {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    next();
  });
}

export function requireEditor(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const role = (req as any).userRole;
    if (role !== "admin" && role !== "editor") {
      res.status(403).json({ error: "Editor access required" });
      return;
    }
    next();
  });
}
