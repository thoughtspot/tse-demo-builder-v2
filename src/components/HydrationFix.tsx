"use client";

import { useEffect } from "react";

/**
 * Component to fix hydration mismatches caused by browser extensions
 * that add attributes to the HTML element after server-side rendering
 */
export default function HydrationFix() {
  useEffect(() => {
    // Fix hydration mismatches caused by browser extensions
    const htmlElement = document.documentElement;

    // Remove attributes that commonly cause hydration issues
    const problematicAttributes = [
      "_mindisisolatedcontentloaded",
      "_mindisisolatedcontentloaded_",
      "data-adblockkey",
      "data-adblock",
      "data-ublock-origin",
      "data-ublock-origin_",
    ];

    problematicAttributes.forEach((attr) => {
      if (htmlElement.hasAttribute(attr)) {
        htmlElement.removeAttribute(attr);
      }
    });

    // Also handle any other dynamically added attributes that might cause issues
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName) {
          const attrName = mutation.attributeName;
          if (
            attrName.startsWith("_mindisisolated") ||
            attrName.startsWith("data-adblock") ||
            attrName.startsWith("data-ublock")
          ) {
            htmlElement.removeAttribute(attrName);
          }
        }
      });
    });

    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ["_mindisisolated*", "data-adblock*", "data-ublock*"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}
