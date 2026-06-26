import { Router } from "express";
import { hubspotWebhook } from "../controllers/webhook.controller";

const router = Router();

router.post("/hubspot", hubspotWebhook);

export default router;
