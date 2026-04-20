import { Router, type IRouter } from "express";
import healthRouter from "./health";
import debatesRouter from "./debates";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(debatesRouter);
router.use(profileRouter);

export default router;
