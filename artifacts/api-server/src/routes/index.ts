import { Router, type IRouter } from "express";
import healthRouter from "./health";
import loyaltyRouter from "./loyalty";
import aiNotesRouter from "./ai-notes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiNotesRouter);
router.use("/loyalty", loyaltyRouter);

export default router;
