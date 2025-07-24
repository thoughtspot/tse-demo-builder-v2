# TSE Demo Builder

A modern React/Next.js application with Chakra UI for building and managing reports and analytics dashboards.

## Features

### Layout Components
- **TopBar**: Header with logo, title, and user dropdown menu
- **SideNav**: Left navigation with menu items and settings access
- **Layout**: Main layout wrapper combining TopBar and SideNav
- **SettingsModal**: Comprehensive settings panel with tabs

### Navigation
- **Home**: Dashboard overview with quick access cards
- **Reports 1 & 2**: Dynamic report pages (routes: `/reports/1`, `/reports/2`)
- **My Reports**: Personal reports management
- **Favorites**: Quick access to frequently used items
- **Spotter**: Search and discovery functionality
- **Settings**: Application configuration (accessible via gear icon)

### Settings Panel
The settings modal includes:
- **General**: Basic application settings
- **Reports**: Report generation and display configuration
- **Data**: Data source and connection settings
- **Security**: Authentication and security settings

Action buttons available on all settings tabs:
- **Apply**: Save current settings
- **Clear**: Reset all settings
- **Upload**: Import settings from JSON file
- **Download**: Export current settings to JSON file

## Technology Stack

- **React 19.1.0**: Latest React with concurrent features
- **Next.js 15.4.2**: App Router with server components
- **TypeScript**: Full type safety
- **Chakra UI 3.22.0**: Modern component library
- **CSS-in-JS**: Inline styles for component styling

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with ChakraProvider
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   ├── reports/
│   │   └── [id]/
│   │       └── page.tsx    # Dynamic reports pages
│   ├── my-reports/
│   │   └── page.tsx        # Personal reports page
│   ├── favorites/
│   │   └── page.tsx        # Favorites page
│   └── spotter/
│       └── page.tsx        # Search and discovery page
└── components/
    ├── Layout.tsx          # Main layout wrapper
    ├── TopBar.tsx          # Header component
    ├── SideNav.tsx         # Navigation sidebar
    └── SettingsModal.tsx   # Settings modal with tabs
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Start production server**:
   ```bash
   npm start
   ```

## Development Notes

- The application uses Next.js App Router with server and client components
- Dynamic routes are implemented for reports (`/reports/[id]`)
- All interactive components are marked with `'use client'` directive
- Settings are currently placeholder implementations ready for real data integration
- The UI is built with inline styles for simplicity and to avoid Chakra UI v3 API complexity

## Next Steps

1. **Add real data integration** for reports and settings
2. **Implement user authentication** and session management
3. **Add more interactive features** to the dashboard
4. **Enhance the search functionality** in the Spotter page
5. **Add real-time updates** and notifications
6. **Implement proper state management** (Redux, Zustand, etc.)

## Browser Support

- Modern browsers with ES6+ support
- Responsive design for desktop and tablet
- Accessibility features included (focus management, keyboard navigation)
