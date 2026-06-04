import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth.js";
import { hashPassword } from "../lib/auth.js";
import { eq } from "drizzle-orm";

const router = Router();

function formatUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as "admin" | "editor" | "viewer",
    createdAt: u.createdAt.toISOString(),
  };
}

router.get("/", requireAdmin, async (req, res) => {
  try {
    const all = await db.select().from(users).orderBy(users.name);
    res.json(all.map(formatUser));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    const passwordHash = hashPassword(password);
    const [user] = await db.insert(users).values({ name, email, passwordHash, role }).returning();
    res.status(201).json(formatUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: Record<string, unknown> = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.role) updates.role = req.body.role;
    if (req.body.password) updates.passwordHash = hashPassword(req.body.password);
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(formatUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(users).where(eq(users.id, id));
    res.json({ success: true, message: null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
