import { Router } from "express";
import { getDashboardState, updateDashboardState } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", getDashboardState);
router.put("/", updateDashboardState);

export default router;
