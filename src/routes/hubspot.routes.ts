import { Router } from "express";
import {
  connectHubspot,
  getConnectionStatus,
  getContacts,
  hubspotCallback,
} from "../controllers/hubspot.controller.ts";

const router = Router();

router.get("/connect", connectHubspot);
router.get("/callback", hubspotCallback);
router.get("/contacts", getContacts);
router.get("/status", getConnectionStatus);
export default router;
