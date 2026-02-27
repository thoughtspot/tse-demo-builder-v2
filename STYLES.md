# Styles Guide - TSE Demo Builder v2

This guide covers how to create, configure, and manage styles in the TSE Demo Builder. The styling system has two main layers: **Application Styles** (the demo app shell) and **Embedded Content Styles** (ThoughtSpot components rendered inside the app).

## Table of Contents

- [Accessing the Styling Settings](#accessing-the-styling-settings)
- [Application Styles](#application-styles)
  - [Predefined Themes](#predefined-themes)
  - [Component-Level Customization](#component-level-customization)
  - [CSS Custom Properties](#css-custom-properties)
- [Embedded Content Styles](#embedded-content-styles)
  - [Custom CSS URL](#custom-css-url)
  - [CSS Variables](#css-variables)
  - [CSS Rules (rules_UNSTABLE)](#css-rules-rules_unstable)
  - [String Mappings](#string-mappings)
  - [Spotter Icon Selection](#spotter-icon-selection)
- [Style Wizard (AI-Powered)](#style-wizard-ai-powered)
- [Exporting and Importing Styles](#exporting-and-importing-styles)
  - [Export a Style](#export-a-style)
  - [Import from File](#import-from-file)
  - [Load from GitHub](#load-from-github)
- [Clearing Styles](#clearing-styles)
- [How Styles Are Applied](#how-styles-are-applied)
  - [Application Styles Flow](#application-styles-flow)
  - [Embedded Content Styles Flow](#embedded-content-styles-flow)
- [Style Configuration Structure](#style-configuration-structure)
- [Creating a Custom Theme from Scratch](#creating-a-custom-theme-from-scratch)
- [Tips and Best Practices](#tips-and-best-practices)

---

## Accessing the Styling Settings

1. Click the **Settings** gear icon in the sidebar.
2. Navigate to the **Styling** tab.
3. You will see two sub-tabs:
   - **Application Styles** — controls the demo app UI (top bar, sidebar, footer, buttons, backgrounds, typography).
   - **Embedded Content** — controls how ThoughtSpot embeds are styled (CSS variables, CSS rules, string overrides).

At the top of the Styling page you will also find action buttons for the **Style Wizard**, **Export Style**, **Import Style**, **Load from GitHub**, and **Clear Styles**.

---

## Application Styles

Application styles control the look and feel of the demo app itself — the navigation chrome, buttons, backgrounds, and text.

### Predefined Themes

The quickest way to restyle your demo is to pick a predefined theme. Six themes ship out of the box:

| Theme    | Description                          |
|----------|--------------------------------------|
| Default  | Clean, professional light theme      |
| Dark     | Modern dark theme with high contrast |
| Blue     | Professional blue theme              |
| Orange   | Warm and energetic orange theme      |
| Green    | Fresh and natural green theme        |
| Purple   | Creative and modern purple theme     |

**To apply a theme:**
1. Open **Settings > Styling > Application Styles**.
2. Under **Theme Selection**, click a theme card.
3. All application colors update immediately.
4. You can further customize individual colors after selecting a theme.

### Component-Level Customization

After (or instead of) selecting a theme, you can fine-tune colors for each UI component using the color pickers:

#### Top Bar
| Property          | Description                         | Default   |
|-------------------|-------------------------------------|-----------|
| Background Color  | Top navigation bar background       | `#ffffff` |
| Foreground Color  | Title text and icon color           | `#333333` |

#### Sidebar
| Property          | Description                         | Default   |
|-------------------|-------------------------------------|-----------|
| Background Color  | Sidebar navigation background       | `#f5f5f5` |
| Foreground Color  | Menu item text color                | `#333333` |
| Hover Color       | Background on hover                 | —         |
| Selected Color    | Background of active menu item      | —         |
| Selected Text     | Text color of active menu item      | —         |

#### Footer
| Property          | Description                         | Default   |
|-------------------|-------------------------------------|-----------|
| Background Color  | Footer background                   | `#ffffff` |
| Foreground Color  | Footer text color                   | `#333333` |

#### Dialogs
| Property          | Description                         | Default   |
|-------------------|-------------------------------------|-----------|
| Background Color  | Modal/dialog background             | `#ffffff` |
| Foreground Color  | Modal/dialog text color             | `#333333` |

#### Primary Buttons
| Property             | Description                      | Default   |
|----------------------|----------------------------------|-----------|
| Background Color     | Button fill                      | `#3182ce` |
| Text Color           | Button label color               | `#ffffff` |
| Border Color         | Button border                    | `#3182ce` |
| Hover Background     | Fill on hover                    | `#2c5aa0` |
| Hover Text Color     | Label color on hover             | `#ffffff` |

#### Secondary Buttons
| Property             | Description                      | Default   |
|----------------------|----------------------------------|-----------|
| Background Color     | Button fill                      | `#ffffff` |
| Text Color           | Button label color               | `#374151` |
| Border Color         | Button border                    | `#d1d5db` |
| Hover Background     | Fill on hover                    | `#f9fafb` |
| Hover Text Color     | Label color on hover             | `#374151` |

#### Backgrounds
| Property              | Description                     | Default   |
|-----------------------|---------------------------------|-----------|
| Main Background       | Page-level background           | `#f7fafc` |
| Content Background    | Content area background         | `#ffffff` |
| Card Background       | Card component background       | `#ffffff` |
| Border Color          | Default border color            | `#e2e8f0` |

#### Typography
| Property          | Description                         | Default   |
|-------------------|-------------------------------------|-----------|
| Primary Color     | Main body text                      | `#1f2937` |
| Secondary Color   | Secondary/muted text                | `#6b7280` |
| Link Color        | Hyperlink text                      | `#3182ce` |
| Link Hover Color  | Hyperlink on hover                  | `#2c5aa0` |

### CSS Custom Properties

Application styles are also published as CSS custom properties on the `<html>` element via the `StylingProvider` component. This means any custom HTML or CSS you add can reference these variables:

```css
/* Background variables */
--main-background
--content-background
--card-background
--border-color

/* Typography variables */
--primary-text-color
--secondary-text-color
--link-color
--link-hover-color

/* Primary button variables */
--primary-button-bg
--primary-button-text
--primary-button-border
--primary-button-hover-bg
--primary-button-hover-text

/* Secondary button variables */
--secondary-button-bg
--secondary-button-text
--secondary-button-border
--secondary-button-hover-bg
--secondary-button-hover-text
```

---

## Embedded Content Styles

Embedded content styles control how ThoughtSpot components (Liveboards, Search, Spotter, Full App) look when rendered inside the demo. These are passed to the ThoughtSpot Visual Embed SDK during initialization.

### Custom CSS URL

Point to an external CSS stylesheet that will be loaded inside ThoughtSpot embeds.

**To set:**
1. Go to **Settings > Styling > Embedded Content**.
2. Enter the URL in the **Custom CSS URL** field (e.g., `https://example.com/custom-styles.css`).

### CSS Variables

ThoughtSpot embeds support a set of CSS custom properties (prefixed with `--ts-var-`) that control embed appearance.

**To configure:**
1. Go to **Settings > Styling > Embedded Content > Custom CSS Variables**.
2. Add key-value pairs. For example:

| Variable                            | Example Value | Effect                              |
|-------------------------------------|---------------|-------------------------------------|
| `--ts-var-root-background`          | `#1a1a2e`     | Embed root background               |
| `--ts-var-root-color`               | `#ffffff`     | Embed root text color               |
| `--ts-var-nav-background`           | `#16213e`     | Navigation background               |
| `--ts-var-nav-color`                | `#e0e0e0`     | Navigation text color               |
| `--ts-var-search-bar-background`    | `#0f3460`     | Search bar background               |
| `--ts-var-search-bar-text-color`    | `#ffffff`     | Search bar text color               |

Refer to the [ThoughtSpot CSS Variables documentation](https://developers.thoughtspot.com/docs/css-customization) for the full list of supported variables.

### CSS Rules (rules_UNSTABLE)

For advanced styling, you can define CSS rules that target specific selectors inside ThoughtSpot embeds.

**Format:** JSON object where keys are CSS selectors and values are style objects.

```json
{
  ".bk-sage-embed-container": {
    "background-color": "#1a1a2e",
    "border-radius": "12px"
  },
  ".answer-module__searchCurtain": {
    "background-color": "transparent"
  }
}
```

**To configure:**
1. Go to **Settings > Styling > Embedded Content > Custom CSS Rules (rules_UNSTABLE)**.
2. Add selector/property pairs using the editor.

> **Note:** The `rules_UNSTABLE` API may change in future ThoughtSpot SDK versions.

### String Mappings

Override text strings displayed inside ThoughtSpot embeds with custom values.

There are two mapping types:

- **String Mappings** — Map exact ThoughtSpot strings to custom replacements.
- **String ID Mappings** — Map ThoughtSpot string IDs to custom values. For example:
  - `liveboard.highlights.title` → `"Shopper Highlights"`
  - `convAssist.landingpage.description2` → `"Ask a question about sales."`

### Spotter Icon Selection

Choose a custom icon for the Spotter (AI Search) embed and sidebar navigation. This sets the `iconSpriteUrl` in the embed configuration.

---

## Style Wizard (AI-Powered)

The Style Wizard uses AI to generate a complete style configuration from a text description.

**To use:**
1. Open **Settings > Styling**.
2. Click the **Style Wizard** button (purple).
3. Describe the look you want in plain language, e.g.:
   - *"Dark theme with blue accents, suitable for a fintech company"*
   - *"Clean, minimalist white theme with green highlights"*
   - *"Match the Salesforce brand colors"*
4. Click **Generate**.
5. The wizard generates both application styles and embedded content CSS variables.
6. Review the result — it is applied immediately.

---

## Exporting and Importing Styles

Styles can be exported as standalone JSON files, separate from the full demo configuration. This lets you share visual themes without affecting menu layouts, user configs, or content.

### Export a Style

1. Open **Settings > Styling**.
2. Click **Export Style**.
3. Optionally provide a custom name.
4. A `.json` file is downloaded containing the application styles, embedded content CSS, and string mappings.

### Import from File

1. Open **Settings > Styling**.
2. Click **Import Style**.
3. Select a previously exported style `.json` file.
4. Choose which parts to import:
   - **Application Styles** — colors, themes, button styles, etc.
   - **CSS Styles** — embedded content CSS variables and rules.
   - **String Mappings** — string and string ID overrides.
5. Click **Import Selected**.

### Load from GitHub

Pre-built styles can be loaded directly from a GitHub repository.

1. Open **Settings > Styling**.
2. Click **Load from GitHub**.
3. Browse available styles from the `thoughtspot/tse-demo-builders-pre-built` repository.
4. Select a style to apply.

---

## Clearing Styles

To reset all styling back to defaults:

1. Open **Settings > Styling**.
2. Click **Clear Styles** (red button).
3. Confirm the action.

This resets:
- All application styles to the Default theme
- All embedded content CSS variables and rules
- All string mappings

---

## How Styles Are Applied

### Application Styles Flow

1. Styles are stored in the `StylingConfig.application` object.
2. The `StylingProvider` component reads `stylingConfig.application` and sets CSS custom properties on `document.documentElement`.
3. Layout components (`TopBar`, `SideNav`, `Footer`, content areas) read colors directly from the styling config via React context (`useAppContext().stylingConfig`).
4. Changes are auto-saved (debounced at 1 second) to localStorage or IndexedDB.

### Embedded Content Styles Flow

1. Styles are stored in the `StylingConfig.embeddedContent` object.
2. During ThoughtSpot SDK `init()`, the embed config receives:
   - `customizations.style.customCSSUrl` — from `embeddedContent.cssUrl`
   - `customizations.style.customCSS.variables` — from `embeddedContent.customCSS.variables`
   - `customizations.style.customCSS.rules_UNSTABLE` — from `embeddedContent.customCSS.rules_UNSTABLE`
   - `customizations.content.strings` — from `embeddedContent.strings`
   - `customizations.content.stringIDs` — from `embeddedContent.stringIDs`
3. When embedded content styles change, the SDK is re-initialized with the new configuration.

---

## Style Configuration Structure

The complete `StylingConfig` TypeScript interface:

```typescript
interface StylingConfig {
  application: {
    topBar: { backgroundColor: string; foregroundColor: string; logoUrl?: string };
    sidebar: { backgroundColor: string; foregroundColor: string; hoverColor?: string; selectedColor?: string; selectedTextColor?: string };
    footer: { backgroundColor: string; foregroundColor: string };
    dialogs: { backgroundColor: string; foregroundColor: string };
    buttons: {
      primary: { backgroundColor: string; foregroundColor: string; borderColor: string; hoverBackgroundColor: string; hoverForegroundColor: string };
      secondary: { backgroundColor: string; foregroundColor: string; borderColor: string; hoverBackgroundColor: string; hoverForegroundColor: string };
    };
    backgrounds: { mainBackground: string; contentBackground: string; cardBackground: string; borderColor: string };
    typography: { primaryColor: string; secondaryColor: string; linkColor: string; linkHoverColor: string };
    selectedTheme?: string;
  };
  embeddedContent: {
    strings: Record<string, string>;
    stringIDs: Record<string, string>;
    cssUrl?: string;
    iconSpriteUrl?: string;
    customCSS: {
      variables?: Record<string, string>;
      rules_UNSTABLE?: Record<string, Record<string, string>>;
    };
  };
  embedFlags?: Record<string, Record<string, boolean>>;
  embedDisplay?: { hideTitle?: boolean; hideDescription?: boolean };
}
```

---

## Creating a Custom Theme from Scratch

Follow these steps to build a fully branded demo:

### Step 1: Start with a Base Theme

Pick the predefined theme closest to your target look (e.g., **Dark** for dark UIs, **Default** for light UIs).

### Step 2: Customize Application Colors

Using the color pickers under **Application Styles**, adjust:

1. **Top Bar** — set to your brand's primary color, with white or contrasting text.
2. **Sidebar** — use a complementary shade, often lighter or darker than the top bar.
3. **Buttons (Primary)** — match your brand's call-to-action color.
4. **Buttons (Secondary)** — use a neutral or outline style.
5. **Backgrounds** — set the main background, content area, and card colors.
6. **Typography** — ensure text colors have sufficient contrast against backgrounds.

### Step 3: Style Embedded Content

Switch to the **Embedded Content** sub-tab:

1. Set `--ts-var-root-background` to match your content background.
2. Set `--ts-var-root-color` to match your primary text color.
3. Adjust navigation, search bar, and button variables to match your brand.
4. Add any CSS rules for fine-grained control.

### Step 4: Override Strings (Optional)

Use **String ID Mappings** to customize text labels in ThoughtSpot embeds (e.g., change "Highlights" to your preferred term).

### Step 5: Export and Share

Export your finished style as a JSON file so others can import it into their demo instances.

---

## Tips and Best Practices

- **Contrast matters.** Always verify that foreground colors have sufficient contrast against their background. WCAG AA recommends at least 4.5:1 for normal text.
- **Start from a theme.** Even if you plan to customize everything, starting from a predefined theme ensures all properties are populated.
- **Use the Style Wizard for inspiration.** Describe what you want in natural language and refine from there.
- **Export early, export often.** Save your style as a JSON file before making major changes, so you can revert if needed.
- **Embedded styles require SDK re-init.** Changes to CSS variables or rules trigger a ThoughtSpot SDK re-initialization, which may briefly reload embed content.
- **Test with multiple embed types.** Styles may render differently across Liveboard, Search, Spotter, and Full App embeds — check each one.
- **Keep `rules_UNSTABLE` minimal.** These rules target internal ThoughtSpot selectors that may change between SDK versions. Prefer CSS variables when possible.
