import { Router } from "express";
import { submitLead } from "../controllers/form.controller";

const router = Router();

router.post("/submit", submitLead);

export default router;
