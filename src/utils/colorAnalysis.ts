/**
 * Utility functions for analyzing images and extracting dominant colors
 */

export interface ColorInfo {
  r: number;
  g: number;
  b: number;
  hex: string;
  frequency: number;
}

export interface ColorAnalysisResult {
  dominantColors: ColorInfo[];
  suggestedBackground: string;
  isLight: boolean;
}

/**
 * Convert RGB values to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Calculate the luminance of a color to determine if it's light or dark
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate color distance between two RGB colors
 */
function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Generate a complementary background color based on the dominant color
 */
function generateComplementaryBackground(dominantColor: ColorInfo): string {
  const { r, g, b } = dominantColor;

  // Calculate complementary color (opposite on color wheel)
  const complementaryR = 255 - r;
  const complementaryG = 255 - g;
  const complementaryB = 255 - b;

  // Adjust for better contrast and aesthetics
  const luminance = getLuminance(r, g, b);

  if (luminance > 0.5) {
    // If the dominant color is light, create a darker complementary
    return rgbToHex(
      Math.max(0, complementaryR - 50),
      Math.max(0, complementaryG - 50),
      Math.max(0, complementaryB - 50)
    );
  } else {
    // If the dominant color is dark, create a lighter complementary
    return rgbToHex(
      Math.min(255, complementaryR + 30),
      Math.min(255, complementaryG + 30),
      Math.min(255, complementaryB + 30)
    );
  }
}

/**
 * Generate a neutral background color that complements the image
 */
function generateNeutralBackground(dominantColor: ColorInfo): string {
  const { r, g, b } = dominantColor;
  const luminance = getLuminance(r, g, b);

  if (luminance > 0.6) {
    // Light image - use a subtle dark background
    return "#f8f9fa";
  } else if (luminance < 0.3) {
    // Dark image - use a light background
    return "#ffffff";
  } else {
    // Medium image - use a neutral gray
    return "#f7fafc";
  }
}

/**
 * Analyze an image and extract dominant colors
 */
export async function analyzeImageColors(
  imageUrl: string
): Promise<ColorAnalysisResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Set canvas size (use smaller size for performance)
        const maxSize = 200;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample pixels and count colors
        const colorMap = new Map<
          string,
          { r: number; g: number; b: number; count: number }
        >();
        const sampleRate = 4; // Sample every 4th pixel for performance

        for (let i = 0; i < data.length; i += sampleRate * 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Quantize colors to reduce noise (group similar colors)
          const quantizedR = Math.round(r / 16) * 16;
          const quantizedG = Math.round(g / 16) * 16;
          const quantizedB = Math.round(b / 16) * 16;

          const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;

          if (colorMap.has(colorKey)) {
            colorMap.get(colorKey)!.count++;
          } else {
            colorMap.set(colorKey, {
              r: quantizedR,
              g: quantizedG,
              b: quantizedB,
              count: 1,
            });
          }
        }

        // Convert to array and sort by frequency
        const colors: ColorInfo[] = Array.from(colorMap.entries())
          .map(([, color]) => ({
            r: color.r,
            g: color.g,
            b: color.b,
            hex: rgbToHex(color.r, color.g, color.b),
            frequency: color.count,
          }))
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 5); // Get top 5 dominant colors

        if (colors.length === 0) {
          reject(new Error("No colors found in image"));
          return;
        }

        const dominantColor = colors[0];
        const isLight =
          getLuminance(dominantColor.r, dominantColor.g, dominantColor.b) > 0.5;

        // Generate suggested background
        let suggestedBackground: string;

        // Try complementary first, but fall back to neutral if it's too extreme
        const complementary = generateComplementaryBackground(dominantColor);
        const complementaryLuminance = getLuminance(
          parseInt(complementary.slice(1, 3), 16),
          parseInt(complementary.slice(3, 5), 16),
          parseInt(complementary.slice(5, 7), 16)
        );

        // Use complementary if it provides good contrast, otherwise use neutral
        if (
          Math.abs(
            complementaryLuminance -
              getLuminance(dominantColor.r, dominantColor.g, dominantColor.b)
          ) > 0.3
        ) {
          suggestedBackground = complementary;
        } else {
          suggestedBackground = generateNeutralBackground(dominantColor);
        }

        resolve({
          dominantColors: colors,
          suggestedBackground,
          isLight,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageUrl;
  });
}

/**
 * Get a human-readable description of the suggested background color
 */
export function getBackgroundColorDescription(color: string): string {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const luminance = getLuminance(r, g, b);

  if (luminance > 0.8) return "Light background";
  if (luminance > 0.5) return "Medium background";
  if (luminance > 0.2) return "Dark background";
  return "Very dark background";
}
