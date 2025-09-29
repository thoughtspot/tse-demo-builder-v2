import { NextResponse } from "next/server";
import { testSpotGPTAPI } from "../../../../services/spotgptService";

export async function GET() {
  try {
    const apiKeyExists = !!process.env.SPOTGPT_API_KEY;
    const apiKeyLength = process.env.SPOTGPT_API_KEY?.length || 0;
    const apiKeyPrefix = process.env.SPOTGPT_API_KEY?.substring(0, 8) || "N/A";

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
        : "SpotGPT API key is not configured",
      apiTest,
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
