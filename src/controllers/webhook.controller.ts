import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const hubspotWebhook = async (req: any, res: any) => {
  try {
    const events = req.body;

    console.log("HubSpot Webhook Received:", JSON.stringify(events, null, 2));

    for (const event of events) {
      const hubspotContactId = String(event.objectId);

      const mapping = await prisma.contactMapping.findFirst({
        where: {
          hubspotContactId,
        },
      });

      if (!mapping) {
        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | LOOP PREVENTION
      |--------------------------------------------------------------------------
      */

      if (
        mapping.lastSyncSource === "wix" &&
        mapping.lastSyncAt &&
        Date.now() - new Date(mapping.lastSyncAt).getTime() < 30000
      ) {
        console.log("Skipped loop");
        continue;
      }

      await prisma.contactMapping.update({
        where: {
          id: mapping.id,
        },
        data: {
          lastSyncSource: "hubspot",
          lastSyncAt: new Date(),
        },
      });

      console.log(`Would update Wix Contact: ${mapping.wixContactId}`);
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      message: error.message,
    });
  }
};
