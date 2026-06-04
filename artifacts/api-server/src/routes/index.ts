import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import setupRouter from "./setup.js";
import authRouter from "./auth.js";
import entriesRouter from "./entries.js";
import categoriesRouter from "./categories.js";
import settingsRouter from "./settings.js";
import usersRouter from "./usersRoute.js";
import importRouter from "./importRoute.js";
import publicRouter from "./publicRoute.js";
import seoRouter from "./seoRoute.js";
import storageRouter from "./storage.js";
import builderRouter from "./builderRoute.js";
import contactsRouter from "./contactsRoute.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/setup", setupRouter);
router.use("/auth", authRouter);
router.use("/entries", entriesRouter);
router.use("/categories", categoriesRouter);
router.use("/settings", settingsRouter);
router.use("/users", usersRouter);
router.use("/import", importRouter);
router.use("/public", publicRouter);
router.use("/seo", seoRouter);
router.use(storageRouter);
router.use("/builder", builderRouter);
router.use("/contacts", contactsRouter);

export default router;
