# Developer Notebook

## 2025-10-31
- Installed the local package `@matching-platform/payment-widget` via `npm install /Users/nirnaykulshreshtha/IdeaProjects/payment-widget` so the application can import the widget directly from the package without relying on a webpack override, keeping Turbopack compatibility and a single source of truth.
- No additional aliases were required because the package exposes its `dist` entry points through `package.json`.

## Multi-Theme System Architecture

### Overview
The example app now supports multiple themes (Default, Supabase, Perptuity) with independent light/dark modes for each theme. The theme system uses a hybrid approach combining CSS variables with data attributes and CSS classes.

### Architecture Components

#### 1. CSS Variables (`app/globals.css`)
Theme-specific CSS variables are defined using data attributes on the HTML element:
- **Default Theme**: Uses `:root` and `[data-theme="default"]` selectors
- **Supabase Theme**: Uses `[data-theme="supabase"]` and `[data-theme="supabase"].dark`
- **Perptuity Theme**: Uses `[data-theme="perptuity"]` and `[data-theme="perptuity"].dark`

**Where to add CSS variables for each theme:**
- All theme CSS variables are located in `app/globals.css`
- Each theme has two sections: light mode and dark mode
- Light mode variables are defined at the theme level: `[data-theme="theme-name"]`
- Dark mode variables use combined selector: `[data-theme="theme-name"].dark`
- Variables follow a consistent naming pattern: `--background`, `--foreground`, `--primary`, etc.

#### 2. Theme Hook (`hooks/use-theme.ts`)
Custom hook that manages theme name and mode separately:
- **Theme Name**: Stored in localStorage under key `theme-name`
- **Theme Mode**: Managed by next-themes (light/dark)
- **Data Attribute**: Automatically applies `data-theme` attribute to HTML element
- **Persistence**: Theme name persists across page reloads

#### 3. ModeToggle Component (`components/mode-toggle.tsx`)
Dropdown menu component that allows users to:
- Select theme (Default, Supabase, Perptuity)
- Select mode (Light, Dark) for the selected theme
- See visual feedback with checkmarks for current selection
- Access theme menu via sun/moon icon button

### How It Works

1. **Theme Application**:
   - The `useTheme` hook reads theme name from localStorage on mount
   - Sets `data-theme` attribute on `<html>` element via `useEffect`
   - next-themes handles the `.dark` class for dark mode

2. **CSS Cascade**:
   - CSS variables are scoped to `[data-theme="theme-name"]` selectors
   - Dark mode combines both: `[data-theme="theme-name"].dark`
   - This ensures correct theme variables are applied based on both theme and mode

3. **User Selection**:
   - User selects theme and mode from dropdown
   - Hook updates both theme name (localStorage) and mode (next-themes)
   - React re-renders, CSS variables update, UI transitions smoothly

### Best Practices

1. **Adding New Themes**:
   - Add theme variables in `globals.css` following the existing pattern
   - Add theme option to `themes` array in `ModeToggle` component
   - Add theme name to `ThemeName` type in `use-theme.ts`

2. **Modifying Theme Colors**:
   - Edit CSS variables in the appropriate theme section in `globals.css`
   - Use OKLCH color space for better color consistency
   - Test both light and dark modes

3. **Theme Consistency**:
   - All themes should define the same set of CSS variables
   - Maintain naming conventions across themes
   - Keep variable structure consistent for maintainability

### Files Modified
- `app/globals.css`: Added theme-specific CSS variable definitions
- `hooks/use-theme.ts`: Created custom theme management hook
- `components/mode-toggle.tsx`: Updated to support multi-theme dropdown

