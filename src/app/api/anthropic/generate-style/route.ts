import { NextRequest, NextResponse } from "next/server";
import { generateStyleConfiguration } from "../../../../services/anthropicService";

export async function POST(request: NextRequest) {
  try {
    const { description, applicationName, imageData } = await request.json();

    console.log(
      "Generate Style API - Description length:",
      description?.length || 0
    );
    console.log(
      "Generate Style API - Application name:",
      applicationName || "Not provided"
    );
    console.log("Generate Style API - Image provided:", !!imageData);
    const rawKey = process.env.TSE_DEMO_ANTHROPIC_KEY || "";
    console.log("Generate Style API - Key diagnostic:", {
      length: rawKey.length,
      preview: rawKey.length > 12 ? `${rawKey.substring(0, 8)}...${rawKey.substring(rawKey.length - 6)}` : rawKey,
    });

    // Check if API key is available
    if (!process.env.TSE_DEMO_ANTHROPIC_KEY) {
      console.error("TSE_DEMO_ANTHROPIC_KEY environment variable is not set");
      return NextResponse.json(
        {
          error:
            "Anthropic API key is not configured. Please set TSE_DEMO_ANTHROPIC_KEY environment variable.",
          hint: "For local development, create a .env.local file with TSE_DEMO_ANTHROPIC_KEY=your_key_here",
        },
        { status: 500 }
      );
    }

    console.log("Calling generateStyleConfiguration...");
    const styleConfig = await generateStyleConfiguration(
      description || "",
      applicationName,
      process.env.TSE_DEMO_ANTHROPIC_KEY,
      imageData
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
