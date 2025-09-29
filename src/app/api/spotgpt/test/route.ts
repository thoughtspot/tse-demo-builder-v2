import { NextResponse } from "next/server";
import { testSpotGPTAPI } from "../../../../services/spotgptService";

export async function GET() {
  try {
    const apiKeyExists = !!process.env.SPOTGPT_API_KEY;
    const apiKeyLength = process.env.SPOTGPT_API_KEY?.length || 0;
    const apiKeyPrefix = process.env.SPOTGPT_API_KEY?.substring(0, 8) || "N/A";

    // Get environment information
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercelUrl: process.env.VERCEL_URL,
      allEnvVars: Object.keys(process.env).filter((key) =>
        key.includes("SPOTGPT")
      ),
      totalEnvVars: Object.keys(process.env).length,
    };

    // Test the actual API if key exists
    let apiTest = null;
    if (apiKeyExists) {
      try {
        apiTest = await testSpotGPTAPI();
      } catch (error) {
        apiTest = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    return NextResponse.json({
      apiKeyExists,
      apiKeyLength,
      apiKeyPrefix,
      message: apiKeyExists
        ? "SpotGPT API key is configured"
        : "SpotGPT API key is not configured. Please set SPOTGPT_API_KEY in your Vercel deployment settings.",
      apiTest,
      environment: envInfo,
      deploymentInstructions: {
        vercel:
          "Go to your Vercel dashboard > Project Settings > Environment Variables > Add SPOTGPT_API_KEY",
        local: "Create a .env.local file with SPOTGPT_API_KEY=your_key_here",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
