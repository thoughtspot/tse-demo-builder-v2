import { ApplicationStyles } from './thoughtspot';

export interface Theme {
  id: string;
  name: string;
  description: string;
  styles: Partial<ApplicationStyles>;
}

export const PREDEFINED_THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean, professional light theme',
    styles: {
      topBar: {
        backgroundColor: '#ffffff',
        foregroundColor: '#333333',
      },
      sidebar: {
        backgroundColor: '#f5f5f5',
        foregroundColor: '#333333',
      },
      footer: {
        backgroundColor: '#ffffff',
        foregroundColor: '#333333',
      },
      dialogs: {
        backgroundColor: '#ffffff',
        foregroundColor: '#333333',
      },
      buttons: {
        primary: {
          backgroundColor: '#3182ce',
          foregroundColor: '#ffffff',
          borderColor: '#3182ce',
          hoverBackgroundColor: '#2c5aa0',
          hoverForegroundColor: '#ffffff',
        },
        secondary: {
          backgroundColor: '#ffffff',
          foregroundColor: '#374151',
          borderColor: '#d1d5db',
          hoverBackgroundColor: '#f9fafb',
          hoverForegroundColor: '#374151',
        },
      },
      backgrounds: {
        mainBackground: '#f7fafc',
        contentBackground: '#ffffff',
        cardBackground: '#ffffff',
        borderColor: '#e2e8f0',
      },
      typography: {
        primaryColor: '#1f2937',
        secondaryColor: '#6b7280',
        linkColor: '#3182ce',
        linkHoverColor: '#2c5aa0',
      },
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Modern dark theme with high contrast',
    styles: {
      topBar: {
        backgroundColor: '#1f2937',
        foregroundColor: '#ffffff',
      },
      sidebar: {
        backgroundColor: '#111827',
        foregroundColor: '#d1d5db',
      },
      footer: {
        backgroundColor: '#1f2937',
        foregroundColor: '#ffffff',
      },
      dialogs: {
        backgroundColor: '#374151',
        foregroundColor: '#ffffff',
      },
      buttons: {
        primary: {
          backgroundColor: '#3b82f6',
          foregroundColor: '#ffffff',
          borderColor: '#3b82f6',
          hoverBackgroundColor: '#2563eb',
          hoverForegroundColor: '#ffffff',
        },
        secondary: {
          backgroundColor: '#374151',
          foregroundColor: '#d1d5db',
          borderColor: '#4b5563',
          hoverBackgroundColor: '#4b5563',
          hoverForegroundColor: '#ffffff',
        },
      },
      backgrounds: {
        mainBackground: '#111827',
        contentBackground: '#1f2937',
        cardBackground: '#374151',
        borderColor: '#4b5563',
      },
      typography: {
        primaryColor: '#f9fafb',
        secondaryColor: '#d1d5db',
        linkColor: '#60a5fa',
        linkHoverColor: '#93c5fd',
      },
    },
  },
  {
    id: 'blue',
    name: 'Blue',
    description: 'Professional blue theme',
    styles: {
      topBar: {
        backgroundColor: '#1e40af',
        foregroundColor: '#ffffff',
      },
      sidebar: {
        backgroundColor: '#dbeafe',
        foregroundColor: '#1e3a8a',
      },
      footer: {
        backgroundColor: '#1e40af',
        foregroundColor: '#ffffff',
      },
      dialogs: {
        backgroundColor: '#ffffff',
        foregroundColor: '#1e3a8a',
      },
      buttons: {
        primary: {
          backgroundColor: '#1e40af',
          foregroundColor: '#ffffff',
          borderColor: '#1e40af',
          hoverBackgroundColor: '#1e3a8a',
          hoverForegroundColor: '#ffffff',
        },
        secondary: {
          backgroundColor: '#dbeafe',
          foregroundColor: '#1e3a8a',
          borderColor: '#93c5fd',
          hoverBackgroundColor: '#bfdbfe',
          hoverForegroundColor: '#1e3a8a',
        },
      },
      backgrounds: {
        mainBackground: '#eff6ff',
        contentBackground: '#ffffff',
        cardBackground: '#ffffff',
        borderColor: '#bfdbfe',
      },
      typography: {
        primaryColor: '#1e3a8a',
        secondaryColor: '#374151',
        linkColor: '#1e40af',
        linkHoverColor: '#1e3a8a',
      },
    },
  },
  {
    id: 'orange',
    name: 'Orange',
    description: 'Warm and energetic orange theme',
    styles: {
      topBar: {
        backgroundColor: '#ea580c',
        foregroundColor: '#ffffff',
      },
      sidebar: {
        backgroundColor: '#fed7aa',
        foregroundColor: '#9a3412',
      },
      footer: {
        backgroundColor: '#ea580c',
        foregroundColor: '#ffffff',
      },
      dialogs: {
        backgroundColor: '#ffffff',
        foregroundColor: '#9a3412',
      },
      buttons: {
        primary: {
          backgroundColor: '#ea580c',
          foregroundColor: '#ffffff',
          borderColor: '#ea580c',
          hoverBackgroundColor: '#dc2626',
          hoverForegroundColor: '#ffffff',
        },
        secondary: {
          backgroundColor: '#fed7aa',
          foregroundColor: '#9a3412',
          borderColor: '#fdba74',
          hoverBackgroundColor: '#fdba74',
          hoverForegroundColor: '#9a3412',
        },
      },
      backgrounds: {
        mainBackground: '#fff7ed',
        contentBackground: '#ffffff',
        cardBackground: '#ffffff',
        borderColor: '#fed7aa',
      },
      typography: {
        primaryColor: '#9a3412',
        secondaryColor: '#374151',
        linkColor: '#ea580c',
        linkHoverColor: '#dc2626',
      },
    },
  },
  {
    id: 'green',
    name: 'Green',
    description: 'Fresh and natural green theme',
    styles: {
      topBar: {
        backgroundColor: '#059669',
        foregroundColor: '#ffffff',
      },
      sidebar: {
        backgroundColor: '#d1fae5',
        foregroundColor: '#065f46',
      },
      footer: {
        backgroundColor: '#059669',
        foregroundColor: '#ffffff',
      },
      dialogs: {
        backgroundColor: '#ffffff',
        foregroundColor: '#065f46',
      },
      buttons: {
        primary: {
          backgroundColor: '#059669',
          foregroundColor: '#ffffff',
          borderColor: '#059669',
          hoverBackgroundColor: '#047857',
          hoverForegroundColor: '#ffffff',
        },
        secondary: {
          backgroundColor: '#d1fae5',
          foregroundColor: '#065f46',
          borderColor: '#a7f3d0',
          hoverBackgroundColor: '#a7f3d0',
          hoverForegroundColor: '#065f46',
        },
      },
      backgrounds: {
        mainBackground: '#f0fdf4',
        contentBackground: '#ffffff',
        cardBackground: '#ffffff',
        borderColor: '#a7f3d0',
      },
      typography: {
        primaryColor: '#065f46',
        secondaryColor: '#374151',
        linkColor: '#059669',
        linkHoverColor: '#047857',
      },
    },
  },
  {
    id: 'purple',
    name: 'Purple',
    description: 'Creative and modern purple theme',
    styles: {
      topBar: {
        backgroundColor: '#7c3aed',
        foregroundColor: '#ffffff',
      },
      sidebar: {
        backgroundColor: '#f3e8ff',
        foregroundColor: '#581c87',
      },
      footer: {
        backgroundColor: '#7c3aed',
        foregroundColor: '#ffffff',
      },
      dialogs: {
        backgroundColor: '#ffffff',
        foregroundColor: '#581c87',
      },
      buttons: {
        primary: {
          backgroundColor: '#7c3aed',
          foregroundColor: '#ffffff',
          borderColor: '#7c3aed',
          hoverBackgroundColor: '#6d28d9',
          hoverForegroundColor: '#ffffff',
        },
        secondary: {
          backgroundColor: '#f3e8ff',
          foregroundColor: '#581c87',
          borderColor: '#e9d5ff',
          hoverBackgroundColor: '#e9d5ff',
          hoverForegroundColor: '#581c87',
        },
      },
      backgrounds: {
        mainBackground: '#faf5ff',
        contentBackground: '#ffffff',
        cardBackground: '#ffffff',
        borderColor: '#e9d5ff',
      },
      typography: {
        primaryColor: '#581c87',
        secondaryColor: '#374151',
        linkColor: '#7c3aed',
        linkHoverColor: '#6d28d9',
      },
    },
  },
];

export const getThemeById = (id: string): Theme | undefined => {
  return PREDEFINED_THEMES.find(theme => theme.id === id);
};

export const applyTheme = (themeId: string, currentStyles: ApplicationStyles): ApplicationStyles => {
  const theme = getThemeById(themeId);
  if (!theme) {
    return currentStyles;
  }

  return {
    ...currentStyles,
    ...theme.styles,
    selectedTheme: themeId,
  };
};
