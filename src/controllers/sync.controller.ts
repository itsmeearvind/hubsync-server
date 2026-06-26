import axios from "axios";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { getValidAccessToken } from "../services/hubspot.service";
const prisma = new PrismaClient();

export const syncWixToHubspot = async (req: any, res: any) => {
  try {
    const contact = req.body;

    const syncId = crypto.randomUUID();

    const integration = await prisma.integration.findFirst();

    if (!integration) {
      return res.status(400).json({
        message: "HubSpot not connected",
      });
    }

    const accessToken = await getValidAccessToken();

    const existingMapping = await prisma.contactMapping.findFirst({
      where: {
        wixContactId: contact.id,
      },
    });

    let hubspotContactId = existingMapping?.hubspotContactId;

    /*
      |--------------------------------------------------------------------------
      | CREATE
      |--------------------------------------------------------------------------
      */

    if (!hubspotContactId) {
      const createResponse = await axios.post(
        "https://api.hubapi.com/crm/v3/objects/contacts",
        {
          properties: {
            email: contact.email,
            firstname: contact.firstName,
            lastname: contact.lastName,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      hubspotContactId = createResponse.data.id;

      await prisma.contactMapping.create({
        data: {
          integrationId: integration.id,
          wixContactId: contact.id,
          hubspotContactId,
          lastSyncSource: "wix",
          lastSyncAt: new Date(),
        },
      });
    } else {
      /*
      |--------------------------------------------------------------------------
      | UPDATE
      |--------------------------------------------------------------------------
      */
      await axios.patch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${hubspotContactId}`,
        {
          properties: {
            email: contact.email,
            firstname: contact.firstName,
            lastname: contact.lastName,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    }

    await prisma.syncLog.create({
      data: {
        id: crypto.randomUUID(),
        integrationId: integration.id,
        syncId,
        source: "wix",
        action: existingMapping ? "update" : "create",
        status: "success",
      },
    });

    return res.json({
      success: true,
      syncId,
      hubspotContactId,
    });
  } catch (error: any) {
    console.error(error.response?.data || error);

    return res.status(500).json({
      message: error.message,
      details: error.response?.data,
    });
  }
};

export const syncHubspotToWix = async (req: any, res: any) => {
  try {
    const contact = req.body;

    const syncId = crypto.randomUUID();
  } catch (error: any) {
    console.error(error.response?.data || error);
  }
};
