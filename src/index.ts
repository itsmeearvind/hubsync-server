import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import hubspotRoutes from "./routes/hubspot.routes.ts";
import mappingRoutes from "./routes/mapping.routes";
import syncRoutes from "./routes/sync.routes";
import webhookRoutes from "./routes/webhook.routes";
import formRoutes from "./routes/form.routes";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/hubspot", hubspotRoutes);
app.use("/api/mappings", mappingRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/forms", formRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on ${process.env.PORT}`);
});
