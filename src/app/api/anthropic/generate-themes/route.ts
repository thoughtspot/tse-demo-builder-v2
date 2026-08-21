import { NextRequest, NextResponse } from "next/server";
import { generateMultipleThemes } from "../../../../services/anthropicService";

export async function POST(request: NextRequest) {
  try {
    const { description, applicationName, baseTheme } = await request.json();

    const rawKey = process.env.TSE_DEMO_ANTHROPIC_KEY || "";
    console.log("Generate Themes API - Key diagnostic:", {
      length: rawKey.length,
      preview: rawKey.length > 12 ? `${rawKey.substring(0, 8)}...${rawKey.substring(rawKey.length - 6)}` : rawKey,
    });

    if (!rawKey) {
      return NextResponse.json(
        {
          error: "Anthropic API key is not configured. Please set TSE_DEMO_ANTHROPIC_KEY environment variable.",
          hint: "For local development, create a .env.local file with TSE_DEMO_ANTHROPIC_KEY=your_key_here",
        },
        { status: 500 }
      );
    }

    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const themes = await generateMultipleThemes(
      description,
      applicationName,
      process.env.TSE_DEMO_ANTHROPIC_KEY,
      baseTheme
    );

    return NextResponse.json({ themes });
  } catch (error) {
    console.error("Error generating themes:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
