import { NextRequest, NextResponse } from "next/server";
import { generateStyleConfiguration } from "../../../../services/anthropicService";

export async function POST(request: NextRequest) {
  try {
    const { description, applicationName } = await request.json();

    console.log(
      "Generate Style API - Description length:",
      description?.length || 0
    );
    console.log(
      "Generate Style API - Application name:",
      applicationName || "Not provided"
    );
    console.log(
      "Generate Style API - Has API key:",
      !!process.env.ANTHROPIC_API_KEY
    );

    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY environment variable is not set");
      return NextResponse.json(
        {
          error:
            "Anthropic API key is not configured. Please set ANTHROPIC_API_KEY environment variable.",
          hint: "For local development, create a .env.local file with ANTHROPIC_API_KEY=your_key_here",
        },
        { status: 500 }
      );
    }

    console.log("Calling generateStyleConfiguration...");
    const styleConfig = await generateStyleConfiguration(
      description || "",
      applicationName,
      process.env.ANTHROPIC_API_KEY
    );

    console.log(
      "Successfully generated style configuration:",
      Object.keys(styleConfig.embeddedContentVariables).length,
      "embedded variables,",
      Object.keys(styleConfig.applicationStyles).length,
      "application style sections"
    );

    console.log(
      "Style config to return:",
      JSON.stringify(styleConfig, null, 2)
    );

    return NextResponse.json(styleConfig);
  } catch (error) {
    console.error("Error generating style configuration:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
