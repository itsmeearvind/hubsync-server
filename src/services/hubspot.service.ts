import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getValidAccessToken() {
  const integration = await prisma.integration.findFirst();

  if (!integration) {
    throw new Error("HubSpot not connected");
  }

  try {
    await axios.get(
      "https://api.hubapi.com/oauth/v1/access-tokens/" +
        integration.accessToken,
      {
        headers: {
          Authorization: `Bearer ${integration.accessToken}`,
        },
      },
    );

    return integration.accessToken;
  } catch {
    const refreshResponse = await axios.post(
      "https://api.hubapi.com/oauth/v1/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        refresh_token: integration.refreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const newToken = refreshResponse.data;

    await prisma.integration.update({
      where: {
        id: integration.id,
      },
      data: {
        accessToken: newToken.access_token,
        refreshToken: newToken.refresh_token || integration.refreshToken,
      },
    });

    return newToken.access_token;
  }
}
