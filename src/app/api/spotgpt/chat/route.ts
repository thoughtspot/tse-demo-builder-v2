import { NextRequest, NextResponse } from "next/server";
import { generateGeneralResponse } from "../../../../services/spotgptService";

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Use environment variable for API key
    const response = await generateGeneralResponse(
      question,
      process.env.SPOTGPT_API_KEY
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
