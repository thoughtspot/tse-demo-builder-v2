import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all environment variables (keys only, no values for security)
    const allEnvVars = Object.keys(process.env).sort();

    // Filter for specific patterns we're interested in
    const spotgptVars = allEnvVars.filter((key) =>
      key.toLowerCase().includes("spotgpt")
    );

    const vercelVars = allEnvVars.filter((key) => key.startsWith("VERCEL_"));

    const nextVars = allEnvVars.filter((key) => key.startsWith("NEXT_"));

    const awsVars = allEnvVars.filter((key) => key.startsWith("AWS_"));

    // Check specifically for our target variable
    const hasSpotgptApiKey = !!process.env.SPOTGPT_API_KEY;
    const spotgptApiKeyLength = process.env.SPOTGPT_API_KEY?.length || 0;

    return NextResponse.json({
      success: true,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        isVercel: !!process.env.VERCEL,
        vercelRegion: process.env.VERCEL_REGION,
        vercelUrl: process.env.VERCEL_URL,
        totalEnvVars: allEnvVars.length,
      },
      targetVariable: {
        name: "SPOTGPT_API_KEY",
        exists: hasSpotgptApiKey,
        length: spotgptApiKeyLength,
        prefix: hasSpotgptApiKey
          ? process.env.SPOTGPT_API_KEY?.substring(0, 8)
          : "N/A",
      },
      categorizedVars: {
        spotgpt: spotgptVars,
        vercel: vercelVars,
        next: nextVars,
        aws: awsVars,
        other: allEnvVars.filter(
          (key) =>
            !key.toLowerCase().includes("spotgpt") &&
            !key.startsWith("VERCEL_") &&
            !key.startsWith("NEXT_") &&
            !key.startsWith("AWS_")
        ),
      },
      allEnvVars: allEnvVars,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
