import { Router } from "express";
import { db } from "@workspace/db";
import { directorySettings, users } from "@workspace/db";
import { hashPassword } from "../lib/auth.js";
import { getSetupToken, consumeSetupToken } from "../lib/setupToken.js";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/status", async (req, res) => {
  try {
    const [settings] = await db.select().from(directorySettings).limit(1);
    if (!settings) {
      res.json({ installed: false, step: 1 });
    } else {
      res.json({ installed: settings.installed, step: settings.installed ? null : 3 });
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get setup status" });
  }
});

router.post("/complete", async (req, res) => {
  try {
    const { siteTitle, adminName, adminEmail, adminPassword, themeColor, homepageHeadline, homepageDescription, setupToken } = req.body;

    const expectedToken = getSetupToken();
    if (!expectedToken || setupToken !== expectedToken) {
      res.status(403).json({ error: "Invalid or missing setup token. Check your server logs for the token." });
      return;
    }

    if (!siteTitle || !adminName || !adminEmail || !adminPassword) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [existing] = await db.select().from(directorySettings).limit(1);
    if (existing?.installed) {
      res.status(400).json({ error: "Setup already completed" });
      return;
    }

    const passwordHash = hashPassword(adminPassword);

    const [existingUser] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    if (!existingUser) {
      await db.insert(users).values({ name: adminName, email: adminEmail, passwordHash, role: "admin" });
    }

    if (existing) {
      await db.update(directorySettings).set({
        siteTitle,
        themeColor: themeColor ?? null,
        homepageHeadline: homepageHeadline ?? null,
        homepageDescription: homepageDescription ?? null,
        installed: true,
        updatedAt: new Date(),
      }).where(eq(directorySettings.id, existing.id));
    } else {
      await db.insert(directorySettings).values({
        siteTitle,
        themeColor: themeColor ?? null,
        homepageHeadline: homepageHeadline ?? null,
        homepageDescription: homepageDescription ?? null,
        installed: true,
      });
    }

    consumeSetupToken();

    res.json({ success: true, message: "Your directory has been created." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Setup failed. Please check your inputs and try again." });
  }
});

export default router;
