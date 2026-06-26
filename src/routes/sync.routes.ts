import { Router } from "express";

import {
  syncWixToHubspot,
  syncHubspotToWix,
} from "../controllers/sync.controller.js";

const router = Router();

router.post("/wix-to-hubspot", syncWixToHubspot);
router.post("/hubspot-to-wix", syncHubspotToWix);

export default router;
