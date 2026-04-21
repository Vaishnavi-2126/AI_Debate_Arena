import { Router, type IRouter } from "express";
import healthRouter from "./health";
import debatesRouter from "./debates";
import profileRouter from "./profile";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(debatesRouter);
router.use(profileRouter);

export default router;
