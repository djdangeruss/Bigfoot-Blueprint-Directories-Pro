import { Router } from "express";
import { db, contacts } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth.js";
import { desc, eq } from "drizzle-orm";

const router = Router();

function formatContact(c: typeof contacts.$inferSelect) {
  return {
    id: c.id,
    fullName: c.fullName,
    phone: c.phone,
    email: c.email,
    createdAt: c.createdAt.toISOString(),
  };
}

router.post("/", async (req, res) => {
  try {
    const { fullName, phone, email } = req.body as { fullName?: string; phone?: string; email?: string };
    if (!fullName?.trim() || !phone?.trim() || !email?.trim()) {
      res.status(400).json({ error: "Full name, phone, and email are required" });
      return;
    }
    const [contact] = await db.insert(contacts).values({ fullName: fullName.trim(), phone: phone.trim(), email: email.trim() }).returning();
    res.status(201).json(formatContact(contact));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to submit contact" });
  }
});

router.get("/", requireAdmin, async (req, res) => {
  try {
    const all = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
    res.json({ contacts: all.map(formatContact) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list contacts" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const deleted = await db.delete(contacts).where(eq(contacts.id, id)).returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

export default router;
