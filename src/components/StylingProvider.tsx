import { useEffect } from "react";
import { StylingConfig } from "../types/thoughtspot";

const FONT_STACKS: Record<string, string> = {
  system:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  inter: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  roboto: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
  "dm-sans": "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
};

const GOOGLE_FONT_URLS: Record<string, string> = {
  inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  roboto: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
  "dm-sans": "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
};

const BORDER_RADIUS: Record<string, [string, string, string]> = {
  sharp:       ["0px",  "2px",  "4px"],
  soft:        ["4px",  "8px",  "12px"],
  round:       ["8px",  "14px", "20px"],
};

const SPACING_UNIT: Record<string, string> = {
  compact:     "6px",
  default:     "8px",
  comfortable: "12px",
};

const SHADOWS: Record<string, [string, string, string, string]> = {
  flat: [
    "none",
    "none",
    "none",
    "none",
  ],
  subtle: [
    "0 1px 2px rgba(0,0,0,0.05)",
    "0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    "0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)",
    "0 1px 2px rgba(0,0,0,0.06)",
  ],
  elevated: [
    "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)",
    "0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)",
    "0 1px 3px rgba(0,0,0,0.1)",
  ],
};

const TRANSITION: Record<string, [string, string]> = {
  none:    ["0ms",   "0ms"],
  fast:    ["100ms", "150ms"],
  default: ["150ms", "250ms"],
};

const TOPBAR_HEIGHT: Record<string, string> = {
  compact: "40px",
  default: "56px",
  tall:    "72px",
};

interface StylingProviderProps {
  stylingConfig: StylingConfig;
  children: React.ReactNode;
}

export default function StylingProvider({
  stylingConfig,
  children,
}: StylingProviderProps) {
  // Inject Google Fonts link tag when a web font is selected
  useEffect(() => {
    const fontFamily = stylingConfig.layout?.fontFamily ?? "system";
    const url = GOOGLE_FONT_URLS[fontFamily];
    const linkId = "tse-google-font";

    const existing = document.getElementById(linkId) as HTMLLinkElement | null;

    if (url) {
      if (!existing || existing.href !== url) {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = url;
        existing?.remove();
        document.head.appendChild(link);
      }
    } else {
      existing?.remove();
    }
  }, [stylingConfig.layout?.fontFamily]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const { application } = stylingConfig;
    const layout = stylingConfig.layout;

    // --- Application color CSS vars ---
    if (application?.backgrounds?.mainBackground)
      root.style.setProperty("--main-background", application.backgrounds.mainBackground);
    if (application?.backgrounds?.contentBackground)
      root.style.setProperty("--content-background", application.backgrounds.contentBackground);
    if (application?.backgrounds?.cardBackground)
      root.style.setProperty("--card-background", application.backgrounds.cardBackground);
    if (application?.backgrounds?.borderColor)
      root.style.setProperty("--border-color", application.backgrounds.borderColor);

    if (application?.typography?.primaryColor)
      root.style.setProperty("--primary-text-color", application.typography.primaryColor);
    if (application?.typography?.secondaryColor)
      root.style.setProperty("--secondary-text-color", application.typography.secondaryColor);
    if (application?.typography?.linkColor)
      root.style.setProperty("--link-color", application.typography.linkColor);
    if (application?.typography?.linkHoverColor)
      root.style.setProperty("--link-hover-color", application.typography.linkHoverColor);

    if (application?.buttons?.primary?.backgroundColor)
      root.style.setProperty("--primary-button-bg", application.buttons.primary.backgroundColor);
    if (application?.buttons?.primary?.foregroundColor)
      root.style.setProperty("--primary-button-text", application.buttons.primary.foregroundColor);
    if (application?.buttons?.primary?.borderColor)
      root.style.setProperty("--primary-button-border", application.buttons.primary.borderColor);
    if (application?.buttons?.primary?.hoverBackgroundColor)
      root.style.setProperty("--primary-button-hover-bg", application.buttons.primary.hoverBackgroundColor);
    if (application?.buttons?.primary?.hoverForegroundColor)
      root.style.setProperty("--primary-button-hover-text", application.buttons.primary.hoverForegroundColor);

    if (application?.buttons?.secondary?.backgroundColor)
      root.style.setProperty("--secondary-button-bg", application.buttons.secondary.backgroundColor);
    if (application?.buttons?.secondary?.foregroundColor)
      root.style.setProperty("--secondary-button-text", application.buttons.secondary.foregroundColor);
    if (application?.buttons?.secondary?.borderColor)
      root.style.setProperty("--secondary-button-border", application.buttons.secondary.borderColor);
    if (application?.buttons?.secondary?.hoverBackgroundColor)
      root.style.setProperty("--secondary-button-hover-bg", application.buttons.secondary.hoverBackgroundColor);
    if (application?.buttons?.secondary?.hoverForegroundColor)
      root.style.setProperty("--secondary-button-hover-text", application.buttons.secondary.hoverForegroundColor);

    if (!layout) return;

    // --- Font ---
    const fontFamily = layout.fontFamily ?? "system";
    const fontStack =
      fontFamily === "custom" && layout.customFontFamily
        ? `${layout.customFontFamily}, sans-serif`
        : (FONT_STACKS[fontFamily] ?? FONT_STACKS.system);
    root.style.setProperty("--font-family", fontStack);

    // --- Border radius ---
    const [sm, md, lg] = BORDER_RADIUS[layout.borderRadius ?? "soft"] ?? BORDER_RADIUS.soft;
    root.style.setProperty("--radius-sm", sm);
    root.style.setProperty("--radius-md", md);
    root.style.setProperty("--radius-lg", lg);

    // --- Spacing ---
    root.style.setProperty("--spacing-unit", SPACING_UNIT[layout.density ?? "default"] ?? SPACING_UNIT.default);

    // --- Shadows ---
    const [shadowSm, shadowMd, shadowLg, shadowTopbar] =
      SHADOWS[layout.shadowStyle ?? "subtle"] ?? SHADOWS.subtle;
    root.style.setProperty("--shadow-sm", shadowSm);
    root.style.setProperty("--shadow-md", shadowMd);
    root.style.setProperty("--shadow-lg", shadowLg);
    root.style.setProperty("--shadow-topbar", shadowTopbar);

    // --- Transitions ---
    const [fast, base] = TRANSITION[layout.animationSpeed ?? "default"] ?? TRANSITION.default;
    root.style.setProperty("--transition-fast", fast);
    root.style.setProperty("--transition-base", base);

    // --- TopBar height ---
    root.style.setProperty("--topbar-height", TOPBAR_HEIGHT[layout.topBarHeight ?? "default"] ?? TOPBAR_HEIGHT.default);
  }, [stylingConfig]);

  return <>{children}</>;
}
