import { NextRequest, NextResponse } from "next/server";
import { generateHomePageContent } from "../../../../services/anthropicService";

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json();

    console.log(
      "Generate Home Page API - Description length:",
      description?.length
    );
    console.log(
      "Generate Home Page API - Has API key:",
      !!process.env.ANTHROPIC_API_KEY
    );

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

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

    console.log("Calling generateHomePageContent...");
    const html = await generateHomePageContent(
      description,
      process.env.ANTHROPIC_API_KEY
    );

    console.log("Successfully generated home page, HTML length:", html.length);

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Error generating home page:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
