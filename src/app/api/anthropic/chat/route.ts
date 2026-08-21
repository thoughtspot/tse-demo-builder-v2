import { NextRequest, NextResponse } from "next/server";
import { generateGeneralResponse } from "../../../../services/anthropicService";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Enhanced debugging for Vercel
    console.log("Anthropic Chat API Debug Info:", {
      hasApiKey: !!process.env.TSE_DEMO_ANTHROPIC_KEY,
      apiKeyLength: process.env.TSE_DEMO_ANTHROPIC_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      isVercel: !!process.env.VERCEL,
      vercelRegion: process.env.VERCEL_REGION,
      allAnthropicVars: Object.keys(process.env).filter((key) =>
        key.includes("ANTHROPIC")
      ),
      totalEnvVars: Object.keys(process.env).length,
    });

    // Check if API key is available
    if (!process.env.TSE_DEMO_ANTHROPIC_KEY) {
      console.error("TSE_DEMO_ANTHROPIC_KEY environment variable is not set");
      console.error(
        "Available environment variables:",
        Object.keys(process.env).filter((key) => key.includes("ANTHROPIC"))
      );
      return NextResponse.json(
        {
          error:
            "Anthropic API key is not configured. Please set TSE_DEMO_ANTHROPIC_KEY environment variable in your Vercel deployment settings.",
          fallback: true,
          debug: {
            availableEnvVars: Object.keys(process.env).filter((key) =>
              key.includes("ANTHROPIC")
            ),
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV,
            isVercel: !!process.env.VERCEL,
            vercelRegion: process.env.VERCEL_REGION,
            sampleEnvVars: Object.keys(process.env).slice(0, 10),
          },
        },
        { status: 500 }
      );
    }

    // Use environment variable for API key
    const response = await generateGeneralResponse(
      question,
      process.env.TSE_DEMO_ANTHROPIC_KEY
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating response:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: true,
      },
      { status: 500 }
    );
  }
}
