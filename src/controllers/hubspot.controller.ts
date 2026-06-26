import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { getHubspotContacts } from "../services/hubspot.service";

const prisma = new PrismaClient();

export const connectHubspot = async (_req: any, res: any) => {
  const scopes = ["crm.objects.contacts.read", "crm.objects.contacts.write"];

  const authUrl =
    `https://app.hubspot.com/oauth/authorize` +
    `?client_id=${process.env.HUBSPOT_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.HUBSPOT_REDIRECT_URI!)}` +
    `&scope=${encodeURIComponent(scopes.join(" "))}`;

  return res.redirect(authUrl);
};

export const hubspotCallback = async (req: any, res: any) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        error: "Missing authorization code",
      });
    }

    // Exchange code for tokens
    const response = await axios.post(
      "https://api.hubapi.com/oauth/v1/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
        code,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const token = response.data;

    // Get HubSpot account info
    const accountInfo = await axios.get(
      `https://api.hubapi.com/oauth/v1/access-tokens/${token.access_token}`,
      {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      },
    );

    const hubspotPortalId = String(accountInfo.data.hub_id);

    // TEMP: dummy wix site id
    const wixSiteId = "local-test-site";

    const existing = await prisma.integration.findFirst({
      where: {
        wixSiteId,
      },
    });

    if (existing) {
      await prisma.integration.update({
        where: {
          id: existing.id,
        },
        data: {
          hubspotPortalId,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        },
      });
    } else {
      await prisma.integration.create({
        data: {
          wixSiteId,
          hubspotPortalId,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000),
        },
      });
    }

    return res.send(`
      <h1>HubSpot Connected Successfully ✅</h1>
      <p>Portal ID: ${hubspotPortalId}</p>
    `);
  } catch (err: any) {
    console.error("FULL ERROR:");
    console.error(err);

    return res.status(500).json({
      message: err.message,
      details: err.response?.data || null,
    });
  }
};

export const getContacts = async (_req: any, res: any) => {
  const integration = await prisma.integration.findFirst();

  const contacts = await getHubspotContacts(integration!.accessToken);

  res.json(contacts);
};

export const getConnectionStatus = async (_req: any, res: any) => {
  const integration = await prisma.integration.findFirst();

  return res.json({
    connected: !!integration,
    portalId: integration?.hubspotPortalId || null,
  });
};
