import { NextRequest, NextResponse } from "next/server";
import { classifyQuestion } from "../../../../services/anthropicService";

export async function POST(request: NextRequest) {
  try {
    const { question, availableModels } = await request.json();

    console.log("API Route - Question:", question);
    console.log("API Route - Available models count:", availableModels?.length);
    console.log(
      "API Route - TSE_DEMO_ANTHROPIC_KEY exists:",
      !!process.env.TSE_DEMO_ANTHROPIC_KEY
    );
    console.log(
      "API Route - TSE_DEMO_ANTHROPIC_KEY length:",
      process.env.TSE_DEMO_ANTHROPIC_KEY?.length
    );

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!availableModels || !Array.isArray(availableModels)) {
      return NextResponse.json(
        { error: "Available models array is required" },
        { status: 400 }
      );
    }

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
          },
        },
        { status: 500 }
      );
    }

    // Use environment variable for API key
    const classification = await classifyQuestion(
      question,
      availableModels,
      process.env.TSE_DEMO_ANTHROPIC_KEY
    );

    console.log("API Route - Classification result:", classification);
    console.log(
      "API Route - Classification result type:",
      typeof classification
    );
    console.log(
      "API Route - Classification result keys:",
      Object.keys(classification)
    );

    return NextResponse.json(classification);
  } catch (error) {
    console.error("Error classifying question:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: true,
      },
      { status: 500 }
    );
  }
}
