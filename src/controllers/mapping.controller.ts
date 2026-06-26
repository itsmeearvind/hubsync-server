import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getMappings = async (_req: any, res: any) => {
  try {
    const mappings = await prisma.fieldMapping.findMany();

    return res.json(mappings);
  } catch (err) {
    return res.status(500).json(err);
  }
};

export const saveMappings = async (req: any, res: any) => {
  try {
    const { mappings } = req.body;

    const integration = await prisma.integration.findFirst();

    if (!integration) {
      return res.status(400).json({
        message: "HubSpot not connected",
      });
    }

    await prisma.fieldMapping.deleteMany({
      where: {
        integrationId: integration.id,
      },
    });

    for (const item of mappings) {
      await prisma.fieldMapping.create({
        data: {
          id: crypto.randomUUID(),
          integrationId: integration.id,

          wixField: item.wixField,
          hubspotProperty: item.hubspotProperty,
          direction: item.direction,

          updatedAt: new Date(),
        },
      });
    }

    return res.json({
      success: true,
      count: mappings.length,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json(err);
  }
};
