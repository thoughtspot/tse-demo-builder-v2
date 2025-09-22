import { useEffect } from "react";
import { StylingConfig } from "../types/thoughtspot";

interface StylingProviderProps {
  stylingConfig: StylingConfig;
  children: React.ReactNode;
}

export default function StylingProvider({
  stylingConfig,
  children,
}: StylingProviderProps) {
  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Apply application styling to CSS custom properties
    if (stylingConfig.application) {
      const { application } = stylingConfig;

      // Background colors
      if (application.backgrounds?.mainBackground) {
        root.style.setProperty(
          "--main-background",
          application.backgrounds.mainBackground
        );
      }
      if (application.backgrounds?.contentBackground) {
        root.style.setProperty(
          "--content-background",
          application.backgrounds.contentBackground
        );
      }
      if (application.backgrounds?.cardBackground) {
        root.style.setProperty(
          "--card-background",
          application.backgrounds.cardBackground
        );
      }
      if (application.backgrounds?.borderColor) {
        root.style.setProperty(
          "--border-color",
          application.backgrounds.borderColor
        );
      }

      // Typography colors
      if (application.typography?.primaryColor) {
        root.style.setProperty(
          "--primary-text-color",
          application.typography.primaryColor
        );
      }
      if (application.typography?.secondaryColor) {
        root.style.setProperty(
          "--secondary-text-color",
          application.typography.secondaryColor
        );
      }
      if (application.typography?.linkColor) {
        root.style.setProperty(
          "--link-color",
          application.typography.linkColor
        );
      }
      if (application.typography?.linkHoverColor) {
        root.style.setProperty(
          "--link-hover-color",
          application.typography.linkHoverColor
        );
      }

      // Button colors
      if (application.buttons?.primary?.backgroundColor) {
        root.style.setProperty(
          "--primary-button-bg",
          application.buttons.primary.backgroundColor
        );
      }
      if (application.buttons?.primary?.foregroundColor) {
        root.style.setProperty(
          "--primary-button-text",
          application.buttons.primary.foregroundColor
        );
      }
      if (application.buttons?.primary?.borderColor) {
        root.style.setProperty(
          "--primary-button-border",
          application.buttons.primary.borderColor
        );
      }
      if (application.buttons?.primary?.hoverBackgroundColor) {
        root.style.setProperty(
          "--primary-button-hover-bg",
          application.buttons.primary.hoverBackgroundColor
        );
      }
      if (application.buttons?.primary?.hoverForegroundColor) {
        root.style.setProperty(
          "--primary-button-hover-text",
          application.buttons.primary.hoverForegroundColor
        );
      }

      if (application.buttons?.secondary?.backgroundColor) {
        root.style.setProperty(
          "--secondary-button-bg",
          application.buttons.secondary.backgroundColor
        );
      }
      if (application.buttons?.secondary?.foregroundColor) {
        root.style.setProperty(
          "--secondary-button-text",
          application.buttons.secondary.foregroundColor
        );
      }
      if (application.buttons?.secondary?.borderColor) {
        root.style.setProperty(
          "--secondary-button-border",
          application.buttons.secondary.borderColor
        );
      }
      if (application.buttons?.secondary?.hoverBackgroundColor) {
        root.style.setProperty(
          "--secondary-button-hover-bg",
          application.buttons.secondary.hoverBackgroundColor
        );
      }
      if (application.buttons?.secondary?.hoverForegroundColor) {
        root.style.setProperty(
          "--secondary-button-hover-text",
          application.buttons.secondary.hoverForegroundColor
        );
      }
    }
  }, [stylingConfig]);

  return <>{children}</>;
}
