import { dump, load } from "js-yaml";
import {
  ConfigurationData,
  AppConfig,
  FullAppConfig,
  StylingConfig,
  HomePageConfig,
  StandardMenu,
} from "../types/thoughtspot";
import { DEFAULT_CONFIG } from "./configurationService";

// Fields whose values are images — excluded from YAML export even if not data URLs
const IMAGE_FIELD_NAMES = new Set(["logo", "favicon", "logoUrl"]);

function omitImageFields(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (IMAGE_FIELD_NAMES.has(key)) continue;
    // Skip data URL values regardless of field name
    if (typeof value === "string" && value.startsWith("data:")) continue;
    // Skip IndexedDB references (stored images)
    if (typeof value === "string" && value.startsWith("indexeddb://"))
      continue;
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      result[key] = omitImageFields(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Input type for generating YAML — the pieces available from SettingsModal state
export interface StarterSettingsExportInput {
  appConfig: AppConfig;
  fullAppConfig: FullAppConfig;
  stylingConfig: StylingConfig;
  homePageConfig: HomePageConfig;
  standardMenus: StandardMenu[];
  menuOrder: string[];
}

function buildExportObject(
  config: StarterSettingsExportInput
): Record<string, unknown> {
  return {
    appConfig: omitImageFields({
      thoughtspotUrl: config.appConfig.thoughtspotUrl,
      applicationName: config.appConfig.applicationName,
      earlyAccessFlags: config.appConfig.earlyAccessFlags,
      showFooter: config.appConfig.showFooter,
      showLogo: config.appConfig.showLogo,
      showVizPicker: config.appConfig.showVizPicker,
      showHelpButton: config.appConfig.showHelpButton,
      authConfig: config.appConfig.authConfig as unknown as Record<
        string,
        unknown
      >,
      chatbot: config.appConfig.chatbot as unknown as Record<string, unknown>,
      spotterViz: config.appConfig.spotterViz as unknown as Record<
        string,
        unknown
      >,
    }),
    fullAppConfig: config.fullAppConfig as unknown as Record<string, unknown>,
    homePageConfig: {
      type: config.homePageConfig.type,
      value: config.homePageConfig.value,
      backgroundColor: config.homePageConfig.backgroundColor,
      maintainAspectRatio: config.homePageConfig.maintainAspectRatio,
    },
    menuOrder: config.menuOrder,
    standardMenus: config.standardMenus.map((m) => ({
      id: m.id,
      name: m.name,
      enabled: m.enabled,
    })),
    stylingConfig: {
      application: omitImageFields(
        config.stylingConfig.application as unknown as Record<string, unknown>
      ),
      embeddedContent: {
        cssUrl: config.stylingConfig.embeddedContent.cssUrl,
        iconSpriteUrl: config.stylingConfig.embeddedContent.iconSpriteUrl,
        strings: config.stylingConfig.embeddedContent.strings,
        stringIDs: config.stylingConfig.embeddedContent.stringIDs,
        customCSS: config.stylingConfig.embeddedContent.customCSS,
      },
      embedFlags: config.stylingConfig.embedFlags,
      embedDisplay: config.stylingConfig.embedDisplay,
    },
  };
}

const YAML_HEADER = `# TSE Demo Builder - Starter Settings
# Version: 1.0
#
# This file defines your demo's starting configuration.
# Upload via Settings → Configuration → "Upload Starter Settings".
#
# Rules:
#   - Missing fields fall back to built-in defaults automatically.
#   - Unknown or renamed fields are safely ignored.
#   - Safe to use older files with newer app versions.
#   - Image fields (logo, favicon) are not included — configure via the UI.

`;

export function generateStarterSettingsYaml(
  config: StarterSettingsExportInput
): string {
  const exportObj = buildExportObject(config);
  return (
    YAML_HEADER +
    dump(exportObj, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
    })
  );
}

// Deep-merge overrides INTO defaults. Only applies keys that exist in defaults
// (unknown override keys are ignored). Recurses for nested objects.
function deepMergeIntoDefaults<T>(defaults: T, overrides: unknown): T {
  if (
    overrides === null ||
    overrides === undefined ||
    typeof overrides !== "object" ||
    Array.isArray(overrides)
  ) {
    return defaults;
  }
  if (
    defaults === null ||
    defaults === undefined ||
    typeof defaults !== "object" ||
    Array.isArray(defaults)
  ) {
    return defaults;
  }
  const result = { ...defaults } as Record<string, unknown>;
  const overridesObj = overrides as Record<string, unknown>;
  for (const key of Object.keys(result)) {
    if (!(key in overridesObj) || overridesObj[key] === undefined) continue;
    const dv = result[key];
    const ov = overridesObj[key];
    if (
      typeof dv === "object" &&
      dv !== null &&
      !Array.isArray(dv) &&
      typeof ov === "object" &&
      ov !== null &&
      !Array.isArray(ov)
    ) {
      result[key] = deepMergeIntoDefaults(dv, ov);
    } else {
      result[key] = ov;
    }
  }
  return result as T;
}

function applyMenuSettings(
  defaults: StandardMenu[],
  overrides: unknown
): StandardMenu[] {
  if (!Array.isArray(overrides)) return defaults;
  const overrideMap = new Map<string, Record<string, unknown>>();
  for (const item of overrides) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const entry = item as Record<string, unknown>;
      if (typeof entry.id === "string") {
        overrideMap.set(entry.id, entry);
      }
    }
  }
  return defaults.map((menu) => {
    const override = overrideMap.get(menu.id);
    if (!override) return menu;
    return {
      ...menu,
      ...(typeof override.name === "string" ? { name: override.name } : {}),
      ...(typeof override.enabled === "boolean"
        ? { enabled: override.enabled }
        : {}),
    };
  });
}

// Parse a YAML starter settings string and return a ConfigurationData rooted
// in DEFAULT_CONFIG. Unknown keys are ignored; missing keys use defaults.
export function applyStarterSettings(yamlStr: string): ConfigurationData {
  let parsed: Record<string, unknown>;
  try {
    const loaded = load(yamlStr);
    parsed =
      loaded !== null &&
      loaded !== undefined &&
      typeof loaded === "object" &&
      !Array.isArray(loaded)
        ? (loaded as Record<string, unknown>)
        : {};
  } catch (e) {
    throw new Error(
      "Invalid YAML: " + (e instanceof Error ? e.message : String(e))
    );
  }

  const result: ConfigurationData = { ...DEFAULT_CONFIG };

  if (parsed.appConfig && typeof parsed.appConfig === "object") {
    result.appConfig = deepMergeIntoDefaults(
      DEFAULT_CONFIG.appConfig,
      parsed.appConfig
    );
  }

  if (parsed.fullAppConfig && typeof parsed.fullAppConfig === "object") {
    result.fullAppConfig = deepMergeIntoDefaults(
      DEFAULT_CONFIG.fullAppConfig,
      parsed.fullAppConfig
    );
  }

  if (parsed.homePageConfig && typeof parsed.homePageConfig === "object") {
    result.homePageConfig = deepMergeIntoDefaults(
      DEFAULT_CONFIG.homePageConfig,
      parsed.homePageConfig
    );
  }

  if (Array.isArray(parsed.menuOrder)) {
    const validIds = new Set(DEFAULT_CONFIG.standardMenus.map((m) => m.id));
    result.menuOrder = (parsed.menuOrder as unknown[])
      .filter((id): id is string => typeof id === "string" && validIds.has(id));
  }

  if (parsed.standardMenus !== undefined) {
    result.standardMenus = applyMenuSettings(
      DEFAULT_CONFIG.standardMenus,
      parsed.standardMenus
    );
  }

  if (parsed.stylingConfig && typeof parsed.stylingConfig === "object") {
    result.stylingConfig = deepMergeIntoDefaults(
      DEFAULT_CONFIG.stylingConfig,
      parsed.stylingConfig
    );
  }

  return result;
}

export function downloadStarterSettings(
  config: StarterSettingsExportInput,
  filename?: string
): void {
  const yamlStr = generateStarterSettingsYaml(config);
  const blob = new Blob([yamlStr], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ||
    `tse-demo-settings-${new Date().toISOString().split("T")[0]}.yaml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Path to the code-based standard template served from public/
const STANDARD_TEMPLATE_PATH = "/default-settings.yaml";

// Fetch the standard template YAML from the server.
// Returns null if the fetch fails (e.g. offline).
export async function fetchStandardTemplateYaml(): Promise<string | null> {
  try {
    const response = await fetch(STANDARD_TEMPLATE_PATH);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

// Download the standard template file directly from the server.
export async function downloadStandardTemplate(): Promise<void> {
  const yamlStr = await fetchStandardTemplateYaml();
  if (!yamlStr) throw new Error("Could not fetch the standard template.");
  const blob = new Blob([yamlStr], { type: "text/yaml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tse-demo-standard-template.yaml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
