import React from 'react';
import { PREDEFINED_THEMES, Theme } from '../types/themes';

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
}

export default function ThemeSelector({ selectedTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h4
        style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '8px',
        }}
      >
        Theme Selection
      </h4>
      <p
        style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '16px',
        }}
      >
        Choose a predefined theme to quickly apply a complete color scheme, then customize individual elements as needed.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {PREDEFINED_THEMES.map((theme) => (
          <div
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            style={{
              padding: '16px',
              border: selectedTheme === theme.id ? '2px solid #3182ce' : '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: selectedTheme === theme.id ? '#eff6ff' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  backgroundColor: theme.styles.topBar?.backgroundColor || '#ffffff',
                  border: '1px solid #d1d5db',
                  marginRight: '8px',
                }}
              />
              <span
                style={{
                  fontWeight: selectedTheme === theme.id ? '600' : '500',
                  color: selectedTheme === theme.id ? '#1e40af' : '#374151',
                }}
              >
                {theme.name}
              </span>
            </div>
            <p
              style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: '0',
                lineHeight: '1.4',
              }}
            >
              {theme.description}
            </p>
            
            {/* Color preview */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '2px',
                  backgroundColor: theme.styles.topBar?.backgroundColor || '#ffffff',
                  border: '1px solid #d1d5db',
                }}
              />
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '2px',
                  backgroundColor: theme.styles.sidebar?.backgroundColor || '#f5f5f5',
                  border: '1px solid #d1d5db',
                }}
              />
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '2px',
                  backgroundColor: theme.styles.buttons?.primary?.backgroundColor || '#3182ce',
                  border: '1px solid #d1d5db',
                }}
              />
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '2px',
                  backgroundColor: theme.styles.backgrounds?.mainBackground || '#f7fafc',
                  border: '1px solid #d1d5db',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
