import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy for generating ThoughtSpot trusted auth tokens.
 * Calls POST /api/rest/2.0/auth/token/custom on the target cluster.
 *
 * The secret key is read from environment variables using the pattern:
 *   TS_SECRET_KEY_<CLUSTER_HASH>_<ORG_ID>
 *
 * Where CLUSTER_HASH is the hostname with dots/hyphens replaced by underscores.
 * Example for cluster "myco.thoughtspot.cloud", org 0:
 *   TS_SECRET_KEY_myco_thoughtspot_cloud_0=<secret>
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      thoughtspotUrl,
      username,
      orgId = "0",
    } = body as {
      thoughtspotUrl: string;
      username: string;
      orgId?: string;
    };

    if (!thoughtspotUrl || !username) {
      return NextResponse.json(
        { error: "thoughtspotUrl and username are required" },
        { status: 400 },
      );
    }

    const secretKey = resolveSecretKey(thoughtspotUrl, orgId);
    if (!secretKey) {
      const envKeyName = buildEnvKeyName(thoughtspotUrl, orgId);
      return NextResponse.json(
        {
          error: `No secret key found. Set the environment variable: ${envKeyName}`,
        },
        { status: 400 },
      );
    }

    const clusterUrl = thoughtspotUrl.replace(/\/+$/, "");
    const tokenResponse = await fetch(
      `${clusterUrl}/api/rest/2.0/auth/token/custom`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          secret_key: secretKey,
          org_identifier: orgId,
          persist_option: "NONE",
          validity_time_in_sec: 300,
        }),
      },
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(
        "[auth/token] ThoughtSpot token request failed:",
        tokenResponse.status,
        errorText,
      );
      return NextResponse.json(
        {
          error: `ThoughtSpot returned ${tokenResponse.status}: ${errorText}`,
        },
        { status: tokenResponse.status },
      );
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json({ token: tokenData.token });
  } catch (error) {
    console.error("[auth/token] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function buildEnvKeyName(thoughtspotUrl: string, orgId: string): string {
  try {
    const hostname = new URL(thoughtspotUrl).hostname;
    const clusterHash = hostname.replace(/[.\-]/g, "_");
    return `TS_SECRET_KEY_${clusterHash}_${orgId}`;
  } catch {
    return "TS_SECRET_KEY_<cluster>_<org>";
  }
}

function resolveSecretKey(
  thoughtspotUrl: string,
  orgId: string,
): string | undefined {
  const envKeyName = buildEnvKeyName(thoughtspotUrl, orgId);
  return process.env[envKeyName];
}
