import { Router } from "express";
import { getMappings, saveMappings } from "../controllers/mapping.controller";

const router = Router();

router.get("/", getMappings);
router.post("/", saveMappings);

export default router;
