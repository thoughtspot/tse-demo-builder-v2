/**
 * Custom Action Handlers Registry
 *
 * This service manages pre-built handlers for custom actions.
 * Pre-built handlers are reusable action handlers that can be selected
 * from a dropdown in the configuration UI instead of writing custom code.
 *
 * To add a new pre-built handler:
 * 1. Define the handler function
 * 2. Register it with registerPrebuiltHandler()
 */

import {
  PrebuiltHandlerDefinition,
  PrebuiltHandlerParam,
  CustomActionHandlerConfig,
} from "../types/thoughtspot";
import { getThoughtSpotAuthForRequest } from "./thoughtspotApi";

// Type for the actual handler function
export type CustomActionHandlerFn = (
  payload: CustomActionPayload,
  params?: Record<string, string | number | boolean | string[]>,
  embedInstance?: unknown
) => void | Promise<void>;

// Custom action payload from ThoughtSpot SDK
export interface CustomActionPayload {
  id: string;
  data?: {
    id?: string;
    [key: string]: unknown;
  };
  contextMenuPoints?: {
    clickedPoint: VizPoint;
    selectedPoints: VizPoint[];
  };
  embedAnswerData?: {
    name: string;
    id: string;
    columns: unknown[];
    data: unknown[][];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface VizPoint {
  selectedAttributes: Array<{
    column: { dataType: string; name: string };
    value: string;
  }>;
  selectedMeasures: Array<{
    column: { dataType: string; name: string };
    value: number;
  }>;
}

// Registry storage
interface HandlerRegistryEntry {
  definition: PrebuiltHandlerDefinition;
  handler: CustomActionHandlerFn;
}

const handlerRegistry = new Map<string, HandlerRegistryEntry>();

/**
 * Register a pre-built handler
 * @param definition The handler definition (id, name, description, parameters)
 * @param handler The actual handler function
 */
export function registerPrebuiltHandler(
  definition: PrebuiltHandlerDefinition,
  handler: CustomActionHandlerFn
): void {
  if (handlerRegistry.has(definition.id)) {
    console.warn(
      `Handler with id "${definition.id}" is already registered. Overwriting.`
    );
  }
  handlerRegistry.set(definition.id, { definition, handler });
}

/**
 * Get all registered pre-built handler definitions
 * (for displaying in the UI dropdown)
 */
export function getPrebuiltHandlerDefinitions(): PrebuiltHandlerDefinition[] {
  return Array.from(handlerRegistry.values()).map((entry) => entry.definition);
}

/**
 * Get a pre-built handler definition by ID
 */
export function getPrebuiltHandlerDefinition(
  id: string
): PrebuiltHandlerDefinition | undefined {
  return handlerRegistry.get(id)?.definition;
}

/**
 * Get a pre-built handler function by ID
 */
export function getPrebuiltHandler(
  id: string
): CustomActionHandlerFn | undefined {
  return handlerRegistry.get(id)?.handler;
}

/**
 * Check if a handler is registered
 */
export function isHandlerRegistered(id: string): boolean {
  return handlerRegistry.has(id);
}

/**
 * Execute a custom action handler based on configuration
 * @param config The handler configuration from the custom action
 * @param payload The payload from the custom action event
 * @param embedInstance Optional embed instance reference
 */
export async function executeCustomActionHandler(
  config: CustomActionHandlerConfig,
  payload: CustomActionPayload,
  embedInstance?: unknown
): Promise<void> {
  if (config.type === "prebuilt") {
    // Execute pre-built handler
    if (!config.prebuiltHandlerId) {
      console.error("Pre-built handler ID is missing");
      return;
    }

    const handler = getPrebuiltHandler(config.prebuiltHandlerId);
    if (!handler) {
      console.error(
        `Pre-built handler "${config.prebuiltHandlerId}" not found`
      );
      return;
    }

    try {
      await handler(payload, config.prebuiltHandlerParams, embedInstance);
    } catch (error) {
      console.error(
        `Error executing pre-built handler "${config.prebuiltHandlerId}":`,
        error
      );
    }
  } else if (config.type === "custom") {
    // Execute custom JavaScript code
    if (!config.customJavaScript?.trim()) {
      console.warn("Custom JavaScript is empty");
      return;
    }

    try {
      // Dynamically import tse-data-classes and create actionData for the user
      const dataClasses = await import("tse-data-classes");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actionData = dataClasses.ActionData.createFromJSON(payload as any);

      // Create and execute the custom function
      // The function receives: actionData (pre-created), payload (raw), embedInstance
      const customFunction = new Function(
        "actionData",
        "payload",
        "embedInstance",
        config.customJavaScript
      );
      await customFunction(actionData, payload, embedInstance);
    } catch (error) {
      console.error("Error executing custom JavaScript handler:", error);
    }
  }
}

// ============================================================================
// Pre-built Handlers
// ============================================================================
// Add your pre-built handlers below. Each handler should:
// 1. Define its parameters (if any)
// 2. Register itself using registerPrebuiltHandler()

/**
 * Example: Console Log Handler
 * Logs the custom action payload to the console (useful for debugging)
 */
const consoleLogHandlerParams: PrebuiltHandlerParam[] = [
  {
    name: "prefix",
    type: "string",
    label: "Log Prefix",
    description: "Optional prefix to add before the log message",
    required: false,
    defaultValue: "[Custom Action]",
  },
  {
    name: "logLevel",
    type: "select",
    label: "Log Level",
    description: "Console log level to use",
    required: false,
    defaultValue: "log",
    options: [
      { value: "log", label: "Log" },
      { value: "info", label: "Info" },
      { value: "warn", label: "Warning" },
      { value: "debug", label: "Debug" },
    ],
  },
];

registerPrebuiltHandler(
  {
    id: "console-log",
    name: "Console Log",
    description:
      "Logs the custom action payload to the browser console. Useful for debugging and development.",
    category: "Debug",
    parameters: consoleLogHandlerParams,
  },
  (payload, params) => {
    const prefix = (params?.prefix as string) || "[Custom Action]";
    const logLevel = (params?.logLevel as string) || "log";

    const logFn =
      logLevel === "info"
        ? console.info
        : logLevel === "warn"
        ? console.warn
        : logLevel === "debug"
        ? console.debug
        : console.log;

    logFn(`${prefix}`, payload);
  }
);

/**
 * Example: Alert Handler
 * Shows an alert dialog with customizable message
 */
registerPrebuiltHandler(
  {
    id: "show-alert",
    name: "Show Alert",
    description:
      "Displays a browser alert dialog with information about the selected data.",
    category: "UI",
    parameters: [
      {
        name: "title",
        type: "string",
        label: "Alert Title",
        description:
          "Title to show in the alert (use {actionId} for action ID)",
        required: false,
        defaultValue: "Custom Action Triggered",
      },
      {
        name: "showData",
        type: "boolean",
        label: "Show Data Summary",
        description: "Include a summary of the selected data in the alert",
        required: false,
        defaultValue: true,
      },
    ],
  },
  (payload, params) => {
    const title = (
      (params?.title as string) || "Custom Action Triggered"
    ).replace("{actionId}", payload.id || "unknown");
    const showData = params?.showData !== false;

    let message = title;
    if (showData && payload.embedAnswerData) {
      const rowCount = payload.embedAnswerData.data?.length || 0;
      const colCount = payload.embedAnswerData.columns?.length || 0;
      message += `\n\nData: ${rowCount} rows x ${colCount} columns`;
    }

    alert(message);
  }
);

/**
 * Example: Copy to Clipboard Handler
 * Copies the selected data to clipboard as JSON or CSV
 */
registerPrebuiltHandler(
  {
    id: "copy-to-clipboard",
    name: "Copy to Clipboard",
    description:
      "Copies the selected data to the clipboard in the specified format.",
    category: "Data",
    parameters: [
      {
        name: "format",
        type: "select",
        label: "Format",
        description: "Format to copy the data as",
        required: false,
        defaultValue: "json",
        options: [
          { value: "json", label: "JSON" },
          { value: "csv", label: "CSV" },
        ],
      },
      {
        name: "includeHeaders",
        type: "boolean",
        label: "Include Headers",
        description: "Include column headers in the output (CSV only)",
        required: false,
        defaultValue: true,
      },
    ],
  },
  async (payload, params) => {
    const format = (params?.format as string) || "json";
    const includeHeaders = params?.includeHeaders !== false;

    let text = "";

    if (format === "json") {
      text = JSON.stringify(payload, null, 2);
    } else if (format === "csv" && payload.embedAnswerData) {
      const { columns, data } = payload.embedAnswerData;
      const rows: string[] = [];

      if (includeHeaders && columns) {
        rows.push(
          columns
            .map((col: unknown) => {
              if (typeof col === "object" && col !== null && "name" in col) {
                return `"${(col as { name: string }).name}"`;
              }
              return '""';
            })
            .join(",")
        );
      }

      if (data) {
        data.forEach((row: unknown[]) => {
          rows.push(
            row
              .map((cell) => {
                if (typeof cell === "string") {
                  return `"${cell.replace(/"/g, '""')}"`;
                }
                return String(cell ?? "");
              })
              .join(",")
          );
        });
      }

      text = rows.join("\n");
    } else {
      text = JSON.stringify(payload, null, 2);
    }

    try {
      await navigator.clipboard.writeText(text);
      console.log("Data copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  }
);

/**
 * Example: Open URL Handler
 * Opens a URL, optionally with data parameters
 */
registerPrebuiltHandler(
  {
    id: "open-url",
    name: "Open URL",
    description:
      "Opens a URL in a new tab, optionally appending data as query parameters.",
    category: "Navigation",
    parameters: [
      {
        name: "url",
        type: "string",
        label: "Base URL",
        description: "The URL to open (can include {actionId} placeholder)",
        required: true,
        defaultValue: "https://example.com",
      },
      {
        name: "appendData",
        type: "boolean",
        label: "Append Data as Query Params",
        description: "Append the action payload as URL query parameters",
        required: false,
        defaultValue: false,
      },
      {
        name: "target",
        type: "select",
        label: "Open In",
        description: "Where to open the URL",
        required: false,
        defaultValue: "_blank",
        options: [
          { value: "_blank", label: "New Tab" },
          { value: "_self", label: "Same Tab" },
        ],
      },
    ],
  },
  (payload, params) => {
    let url = ((params?.url as string) || "https://example.com").replace(
      "{actionId}",
      payload.id || ""
    );
    const appendData = params?.appendData === true;
    const target = (params?.target as string) || "_blank";

    if (appendData) {
      const urlObj = new URL(url);
      urlObj.searchParams.set("actionId", payload.id || "");
      if (payload.embedAnswerData) {
        urlObj.searchParams.set(
          "data",
          JSON.stringify(payload.embedAnswerData)
        );
      }
      url = urlObj.toString();
    }

    window.open(url, target);
  }
);

/**
 * Download PDF with Watermark Handler
 * Downloads a liveboard as PDF and applies a watermark
 */
registerPrebuiltHandler(
  {
    id: "download-pdf-watermark",
    name: "Download PDF with Watermark",
    description:
      "Downloads the liveboard as a PDF and applies a custom watermark text across each page.",
    category: "Export",
    parameters: [
      {
        name: "watermarkText",
        type: "string",
        label: "Watermark Text",
        description: "The text to display as a watermark on each page",
        required: true,
        defaultValue: "CONFIDENTIAL",
      },
      {
        name: "watermarkOpacity",
        type: "select",
        label: "Watermark Opacity",
        description: "How transparent the watermark should be",
        required: false,
        defaultValue: "0.15",
        options: [
          { value: "0.1", label: "Very Light (10%)" },
          { value: "0.15", label: "Light (15%)" },
          { value: "0.2", label: "Medium (20%)" },
          { value: "0.3", label: "Bold (30%)" },
        ],
      },
      {
        name: "watermarkColor",
        type: "select",
        label: "Watermark Color",
        description: "Color of the watermark text",
        required: false,
        defaultValue: "gray",
        options: [
          { value: "gray", label: "Gray" },
          { value: "red", label: "Red" },
          { value: "blue", label: "Blue" },
          { value: "black", label: "Black" },
        ],
      },
    ],
  },
  async (payload, params) => {
    const watermarkText = (params?.watermarkText as string) || "CONFIDENTIAL";
    const watermarkOpacity = parseFloat(
      (params?.watermarkOpacity as string) || "0.15"
    );
    const watermarkColor = (params?.watermarkColor as string) || "gray";

    // Log the full payload to help debug
    console.log("[Download PDF] Full payload received:", payload);

    // Get the liveboard ID and name from the payload
    // The ThoughtSpotEmbed component enhances the payload with embedContext
    let liveboardId: string | undefined;
    let liveboardName: string | undefined;

    // Cast payload to access nested properties
    const payloadData = payload as Record<string, unknown>;

    // FIRST: Check for liveboardId added by ThoughtSpotEmbed (most reliable)
    if (payloadData.liveboardId) {
      liveboardId = payloadData.liveboardId as string;
      console.log("[Download PDF] Found liveboardId from enhanced payload");
    }

    // SECOND: Check embedContext added by ThoughtSpotEmbed
    if (payloadData.embedContext) {
      const embedContext = payloadData.embedContext as Record<string, unknown>;
      if (
        !liveboardId &&
        embedContext.contentType === "liveboard" &&
        embedContext.contentId
      ) {
        liveboardId = embedContext.contentId as string;
        console.log("[Download PDF] Found liveboardId from embedContext");
      }
      // Get the liveboard name from embedContext
      if (embedContext.contentName) {
        liveboardName = embedContext.contentName as string;
        console.log(
          "[Download PDF] Found liveboardName from embedContext:",
          liveboardName
        );
      }
    }

    // FALLBACK: Check various ThoughtSpot SDK payload locations
    // Check for liveboardEmbed context
    if (!liveboardId && payloadData.liveboardEmbed) {
      const liveboardEmbed = payloadData.liveboardEmbed as Record<
        string,
        unknown
      >;
      if (liveboardEmbed.liveboardId) {
        liveboardId = liveboardEmbed.liveboardId as string;
        console.log("[Download PDF] Found liveboardId from liveboardEmbed");
      }
    }

    // Check in data object
    if (!liveboardId && payloadData.data) {
      const data = payloadData.data as Record<string, unknown>;
      if (data.liveboardId) {
        liveboardId = data.liveboardId as string;
        console.log("[Download PDF] Found liveboardId from data object");
      }
    }

    if (!liveboardId) {
      console.error(
        "[Download PDF] Could not determine liveboard ID from payload:",
        payload
      );
      console.error("[Download PDF] Payload keys:", Object.keys(payloadData));
      alert(
        "Error: Could not determine liveboard ID. Please check the console for the payload structure."
      );
      return;
    }

    console.log("[Download PDF] Using liveboard ID:", liveboardId);

    // Sanitize the liveboard name for use as filename (remove invalid characters)
    const sanitizedName = liveboardName
      ? liveboardName.replace(/[<>:"/\\|?*]/g, "_").trim()
      : null;

    // Show loading indicator
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "pdf-download-loading";
    loadingDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    loadingDiv.innerHTML = `
      <div style="background: white; padding: 32px 48px; border-radius: 12px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
        <div style="font-size: 24px; margin-bottom: 16px;">📄</div>
        <div style="font-size: 16px; font-weight: 600; color: #374151;">Generating PDF...</div>
        <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">This may take a moment</div>
      </div>
    `;
    document.body.appendChild(loadingDiv);

    try {
      // Get the ThoughtSpot URL from the enhanced payload (most reliable)
      // Falls back to localStorage or default for backwards compatibility
      let thoughtSpotHost = payloadData.thoughtSpotUrl as string | undefined;

      if (!thoughtSpotHost) {
        // Fallback: try embedContext
        const embedContext = payloadData.embedContext as
          | Record<string, unknown>
          | undefined;
        thoughtSpotHost = embedContext?.thoughtSpotUrl as string | undefined;
      }

      if (!thoughtSpotHost) {
        // Final fallback: localStorage or default
        thoughtSpotHost =
          localStorage.getItem("thoughtspot_host") ||
          "https://training.thoughtspot.cloud";
        console.warn(
          "[Download PDF] ThoughtSpot URL not found in payload, using fallback:",
          thoughtSpotHost
        );
      }

      // Ensure the URL doesn't have a trailing slash
      thoughtSpotHost = thoughtSpotHost.replace(/\/$/, "");

      console.log("[Download PDF] Using ThoughtSpot URL:", thoughtSpotHost);

      const auth = await getThoughtSpotAuthForRequest();

      // Call the ThoughtSpot report/liveboard API
      const response = await fetch(
        `${thoughtSpotHost}/api/rest/2.0/report/liveboard`,
        {
          method: "POST",
          headers: {
            Accept: "application/octet-stream",
            "Content-Type": "application/json",
            ...auth.headers,
          },
          credentials: auth.credentials,
          body: JSON.stringify({
            metadata_identifier: liveboardId,
            file_format: "PDF",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `API call failed: ${response.status} ${response.statusText}`
        );
      }

      // Get the PDF as an ArrayBuffer
      const pdfBytes = await response.arrayBuffer();

      // Dynamically import pdf-lib to avoid SSR issues
      const { PDFDocument, rgb, degrees } = await import("pdf-lib");

      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Get color values based on selection
      let colorRgb: { r: number; g: number; b: number };
      switch (watermarkColor) {
        case "red":
          colorRgb = { r: 0.8, g: 0.1, b: 0.1 };
          break;
        case "blue":
          colorRgb = { r: 0.1, g: 0.2, b: 0.8 };
          break;
        case "black":
          colorRgb = { r: 0, g: 0, b: 0 };
          break;
        default: // gray
          colorRgb = { r: 0.5, g: 0.5, b: 0.5 };
      }

      // Get all pages and add watermark to each
      const pages = pdfDoc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();

        // Calculate font size to make watermark span a good portion of the page diagonal
        // For a 45° rotated text, we want it to span roughly 60% of the page diagonal
        const pageDiagonal = Math.sqrt(width * width + height * height);
        const targetTextWidth = pageDiagonal * 0.5;
        const charsInText = watermarkText.length;
        // Approximate: each character is about 0.5x the font size wide (for standard fonts)
        const fontSize = Math.min(targetTextWidth / (charsInText * 0.5), 120);

        // Calculate the text dimensions
        const textWidth = charsInText * fontSize * 0.5;
        const textHeight = fontSize;

        // For 45° rotation, calculate the center position properly
        // The text is drawn from (x, y) and rotates around that point
        // To center: we need the middle of the rotated text to be at page center
        const angle = Math.PI / 4; // 45 degrees in radians

        // The rotated text's bounding box center offset from origin
        const rotatedCenterX =
          (textWidth / 2) * Math.cos(angle) -
          (textHeight / 2) * Math.sin(angle);
        const rotatedCenterY =
          (textWidth / 2) * Math.sin(angle) +
          (textHeight / 2) * Math.cos(angle);

        // Position so the rotated center is at page center
        const x = width / 2 - rotatedCenterX;
        const y = height / 2 - rotatedCenterY;

        // Draw the watermark text
        page.drawText(watermarkText, {
          x: x,
          y: y,
          size: fontSize,
          color: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
          opacity: watermarkOpacity,
          rotate: degrees(45),
        });
      }

      // Save the modified PDF
      const modifiedPdfBytes = await pdfDoc.save();

      // Create a blob and download
      const blob = new Blob([modifiedPdfBytes as BlobPart], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement("a");
      link.href = url;
      link.download = sanitizedName
        ? `${sanitizedName}.pdf`
        : `liveboard-${liveboardId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      console.log("PDF downloaded successfully with watermark");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(
        `Error downloading PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Remove loading indicator
      const loading = document.getElementById("pdf-download-loading");
      if (loading) {
        loading.remove();
      }
    }
  }
);

// Export the handler registry for testing purposes
export { handlerRegistry };
