import { NextRequest, NextResponse } from "next/server";
import { generateHomePageContent } from "../../../../services/anthropicService";

export async function POST(request: NextRequest) {
  try {
    const { description, applicationName, styleColors } = await request.json();

    console.log(
      "Generate Home Page API - Description length:",
      description?.length || 0
    );
    console.log(
      "Generate Home Page API - Application name:",
      applicationName || "Not provided"
    );
    console.log(
      "Generate Home Page API - Style colors provided:",
      !!styleColors
    );
    if (styleColors) {
      console.log("Generate Home Page API - Colors:", styleColors);
    }
    console.log(
      "Generate Home Page API - Has API key:",
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

    console.log("Calling generateHomePageContent...");
    const html = await generateHomePageContent(
      description || "",
      applicationName,
      styleColors,
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
