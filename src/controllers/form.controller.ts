import crypto from "crypto";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { getValidAccessToken } from "../services/hubspot.service";

const prisma = new PrismaClient();

export const submitLead = async (req: any, res: any) => {
  try {
    const {
      email,
      firstName,
      lastName,

      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,

      pageUrl,
      referrer,
    } = req.body;

    const accessToken = await getValidAccessToken();

    const response = await axios.post(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        properties: {
          email,
          firstname: firstName,
          lastname: lastName,

          utm_source,
          utm_medium,
          utm_campaign,
          utm_term,
          utm_content,

          page_url: pageUrl,
          referrer_url: referrer,

          lead_timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    await prisma.syncLog.create({
      data: {
        id: crypto.randomUUID(),
        integrationId: (await prisma.integration.findFirst())!.id,

        syncId: crypto.randomUUID(),

        source: "form",

        action: "lead_capture",

        status: "success",

        payloadHash: JSON.stringify({
          email,
          pageUrl,
          referrer,
        }),
      },
    });

    return res.json({
      success: true,
      contactId: response.data.id,
    });
  } catch (error: any) {
    console.error(error.response?.data || error);

    return res.status(500).json({
      message: error.message,
      details: error.response?.data,
    });
  }
};
