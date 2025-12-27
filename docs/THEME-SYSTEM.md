# WishShare Theme System & Color Scheme Guide

This document defines the official theming system for the WishShare application, including the color palette, CSS variables, and guidelines for supporting both light and dark modes.

## Table of Contents

1. [Theme System Overview](#theme-system-overview)
2. [CSS Variables Reference](#css-variables-reference)
3. [Light & Dark Mode](#light--dark-mode)
4. [Usage Guidelines](#usage-guidelines)
5. [Migration from Legacy Variables](#migration-from-legacy-variables)

---

## Theme System Overview

The WishShare theme system is built on CSS custom properties (variables) that automatically adapt to light and dark modes. The system supports:

- **Manual theme switching** via `data-theme` attribute
- **System preference detection** via `prefers-color-scheme` media query
- **Backwards compatibility** with legacy variable names

### Brand Colors (Constant)

These colors remain consistent across both themes:

| Name      | Hex       | SCSS Variable      | Usage                |
| --------- | --------- | ------------------ | -------------------- |
| Primary   | `#34626c` | `$brand-primary`   | Main brand color     |
| Secondary | `#0f3057` | `$brand-secondary` | Dark brand color     |
| Accent    | `#008891` | `$brand-accent`    | Interactive elements |
| Success   | `#005816` | `$brand-success`   | Success states       |

---

## CSS Variables Reference

### Brand & Primary Colors

```scss
// Brand colors (constant across themes)
--color-brand-primary: #34626c;
--color-brand-secondary: #0f3057;
--color-brand-accent: #008891;
--color-brand-success: #005816;

// Primary color with variations
--color-primary          // Main primary color
--color-primary-light    // Slightly lighter (+2%)
--color-primary-dark     // Slightly darker (-2%)
--color-primary-lighter  // Much lighter (+15%)
--color-primary-darker   // Much darker (-10%)
```

### Semantic Colors

```scss
// Status colors
--color-success: #16a34a; // Success states
--color-success-light: #dcfce7; // Success backgrounds
--color-warning: #ca8a04; // Warning states
--color-warning-light: #fef9c3; // Warning backgrounds
--color-error: #dc2626; // Error states
--color-error-light: #fef2f2; // Error backgrounds
--color-info: #008891; // Info states
--color-info-light: #e0f7fa; // Info backgrounds
```

### Background Colors

```scss
--bg-page             // Main page background (#fafafa light, #121212 dark)
--bg-surface          // Card/panel surfaces (#ffffff light, #1e1e1e dark)
--bg-surface-elevated // Elevated surfaces (#ffffff light, #2d2d2d dark)
--bg-surface-hover    // Hover state backgrounds
--bg-surface-active   // Active state backgrounds
--bg-muted            // Subtle backgrounds (#f5f7fa light, #262626 dark)
--bg-navbar           // Navigation bar (#e7e7de light, #1a1a1a dark)
--bg-card             // Card backgrounds
--bg-card-secondary   // Secondary card backgrounds (#e4f2f3 light)
--bg-input            // Form input backgrounds
--bg-overlay          // Modal overlays
```

### Text Colors

```scss
--text-primary      // Main text color (#333333 light, #e5e5e5 dark)
--text-secondary    // Secondary text (#6b7280 light, #a3a3a3 dark)
--text-muted        // Muted/disabled text (#9ca3af light, #737373 dark)
--text-inverse      // Inverse text (for dark on light or vice versa)
--text-on-primary   // Text on primary color backgrounds (#ffffff)
--text-on-brand     // Text on brand color backgrounds (#ffffff)
--text-link         // Link text color
--text-link-hover   // Link hover color
```

### Border Colors

```scss
--border-default    // Default borders (#e5e7eb light, #404040 dark)
--border-light      // Light borders (#f3f4f6 light, #333333 dark)
--border-focus      // Focus ring borders
--border-error      // Error state borders
```

### Shadows

```scss
--shadow-color        // Base shadow color
--shadow-color-heavy  // Heavy shadow color
--shadow-primary      // Primary color shadow (for buttons)
--card-shadow         // Standard card shadow
--card-shadow-elevated // Elevated card shadow
--button-shadow-hover // Button hover shadow
```

### Gradients

```scss
--gradient-brand        // Primary to secondary gradient
--gradient-brand-accent // Primary to accent gradient
--gradient-page         // Page background gradient
```

### Spacing

The theme system includes a comprehensive spacing scale based on a 4px base unit (0.25rem). This ensures consistent spacing throughout the application.

#### Spacing Scale

```scss
// Base scale (4px increments)
--spacing-0: 0; // 0px
--spacing-1: 0.25rem; // 4px
--spacing-2: 0.5rem; // 8px
--spacing-3: 0.75rem; // 12px
--spacing-4: 1rem; // 16px
--spacing-5: 1.25rem; // 20px
--spacing-6: 1.5rem; // 24px
--spacing-8: 2rem; // 32px
--spacing-10: 2.5rem; // 40px
--spacing-12: 3rem; // 48px
--spacing-16: 4rem; // 64px
--spacing-20: 5rem; // 80px
--spacing-24: 6rem; // 96px
// ... and more (up to --spacing-96: 24rem / 384px)
```

#### Semantic Spacing Aliases

For improved readability and consistency:

```scss
--spacing-xs: 0.5rem; // 8px  (--spacing-2)
--spacing-sm: 0.75rem; // 12px (--spacing-3)
--spacing-md: 1rem; // 16px (--spacing-4)
--spacing-lg: 1.5rem; // 24px (--spacing-6)
--spacing-xl: 2rem; // 32px (--spacing-8)
--spacing-2xl: 3rem; // 48px (--spacing-12)
--spacing-3xl: 4rem; // 64px (--spacing-16)
```

#### Layout-Specific Spacing

Pre-defined spacing values for common layout elements:

```scss
--spacing-section: 4rem; // 64px  - Between major sections
--spacing-container: 1.5rem; // 24px  - Container padding
--spacing-card-padding: 1.5rem; // 24px  - Card internal padding
--spacing-input-padding: 0.75rem; // 12px - Input field padding
--spacing-button-padding: 1rem; // 16px - Button padding
```

---

## Light & Dark Mode

### Automatic System Detection

The theme system automatically respects the user's system preference:

```scss
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    // Dark theme variables applied automatically
  }
}
```

### Manual Theme Switching

To manually set the theme, add the `data-theme` attribute to the `<html>` element:

```html
<!-- Force light theme -->
<html data-theme="light">
  <!-- Force dark theme -->
  <html data-theme="dark">
    <!-- Follow system preference (default) -->
    <html></html>
  </html>
</html>
```

### Theme Toggle Implementation

Here's how to implement a theme toggle in your application:

```typescript
// theme.service.ts
import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'wishare-theme';
  currentTheme = signal<Theme>(this.getStoredTheme());

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    localStorage.setItem(this.storageKey, theme);
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    const current = this.currentTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  private getStoredTheme(): Theme {
    return (localStorage.getItem(this.storageKey) as Theme) || 'system';
  }

  private applyTheme(theme: Theme): void {
    const html = document.documentElement;
    if (theme === 'system') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', theme);
    }
  }
}
```

---

## Usage Guidelines

### When to Use Each Variable Category

#### Brand Colors (`--color-brand-*`)

Use for elements that should remain consistent regardless of theme:

- Logo and branding elements
- Gradient overlays on images
- Fixed brand sections (hero areas, special promotions)

#### Primary Colors (`--color-primary*`)

Use for main interactive elements:

- Primary buttons
- Active navigation items
- Selected states
- Focus rings

#### Semantic Colors (`--color-success/warning/error/info`)

Use for status feedback:

- Form validation messages
- Toast notifications
- Status badges
- Alert boxes

#### Background Colors (`--bg-*`)

Use for structural elements:

- Page backgrounds → `--bg-page`
- Cards and panels → `--bg-surface` or `--bg-card`
- Form inputs → `--bg-input`
- Navbar → `--bg-navbar`

#### Text Colors (`--text-*`)

Use for all text content:

- Main content → `--text-primary`
- Descriptions, labels → `--text-secondary`
- Placeholders, disabled → `--text-muted`
- Links → `--text-link`

### Common Patterns

#### Spacing & Layout

```scss
// Container with consistent padding
.container {
  padding: var(--spacing-container);
  margin-bottom: var(--spacing-section);
}

// Card with standard spacing
.card {
  padding: var(--spacing-card-padding);
  gap: var(--spacing-md);
}

// Button with proper spacing
.button {
  padding: var(--spacing-input-padding) var(--spacing-button-padding);
  gap: var(--spacing-xs);
}

// Form with consistent spacing
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-label {
  margin-bottom: var(--spacing-sm);
}

// Grid layout with spacing
.grid {
  display: grid;
  gap: var(--spacing-lg);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

// Flex layout with spacing
.flex-container {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}
```

#### Cards

```scss
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-default);
  box-shadow: var(--card-shadow);
  color: var(--text-primary);
}
```

#### Buttons

```scss
.button-primary {
  background: var(--gradient-brand-accent);
  color: var(--text-on-primary);

  &:hover {
    box-shadow: var(--button-shadow-hover);
  }
}

.button-secondary {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
```

#### Form Inputs

```scss
.input {
  background-color: var(--bg-input);
  border: 1px solid var(--border-default);
  color: var(--text-primary);

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--border-focus);
  }

  &.error {
    border-color: var(--border-error);
  }
}
```

#### Error Messages

```scss
.error-message {
  color: var(--color-error);
  background: var(--color-error-light);
  border-left: 3px solid var(--color-error);
}
```

#### Links

```scss
a {
  color: var(--text-link);

  &:hover {
    color: var(--text-link-hover);
  }
}
```

---

## Migration from Legacy Variables

The theme system maintains backwards compatibility with legacy variable names. However, we recommend migrating to the new semantic naming convention.

### Legacy to New Mapping

| Legacy Variable     | New Variable              | Notes                |
| ------------------- | ------------------------- | -------------------- |
| `--primary-color`   | `--color-primary`         | Mapped automatically |
| `--secondary-color` | `--color-brand-secondary` | Mapped automatically |
| `--tertiary-color`  | `--bg-navbar`             | Mapped automatically |
| `--fourth-color`    | `--color-brand-accent`    | Mapped automatically |
| `--fifth-color`     | `--color-brand-success`   | Mapped automatically |
| `--sixth-color`     | `--text-primary`          | Mapped automatically |

### Hardcoded Color Migration

Replace hardcoded colors with variables:

| Hardcoded          | Replace With               |
| ------------------ | -------------------------- |
| `#333` / `#333333` | `var(--text-primary)`      |
| `#6b7280`          | `var(--text-secondary)`    |
| `#fafafa`          | `var(--bg-page)`           |
| `#ffffff`          | `var(--bg-surface)`        |
| `#e4f2f3`          | `var(--bg-card-secondary)` |
| `#dc2626`          | `var(--color-error)`       |
| `#fef2f2`          | `var(--color-error-light)` |

---

## Taiga UI Integration

The theme system integrates with Taiga UI components:

```scss
:root {
  --tui-primary: var(--color-primary) !important;
  --tui-primary-hover: var(--color-primary-light) !important;
  --tui-primary-active: var(--color-primary-dark) !important;
}
```

---

## Accessibility Guidelines

### Contrast Ratios

The theme system is designed to meet WCAG 2.1 AA standards:

- **Light mode:** Dark text on light backgrounds (minimum 4.5:1 for body text)
- **Dark mode:** Light text on dark backgrounds (minimum 4.5:1 for body text)
- **Interactive elements:** Minimum 3:1 contrast ratio

### Focus States

Always use visible focus indicators:

```scss
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

### Motion Preferences

Respect reduced motion preferences:

```scss
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.01ms !important;
  }
}
```

---

## Quick Reference

### Light Theme Colors

| Category   | Variable           | Value     |
| ---------- | ------------------ | --------- |
| Background | `--bg-page`        | `#fafafa` |
| Surface    | `--bg-surface`     | `#ffffff` |
| Navbar     | `--bg-navbar`      | `#e7e7de` |
| Text       | `--text-primary`   | `#333333` |
| Text Muted | `--text-secondary` | `#6b7280` |
| Border     | `--border-default` | `#e5e7eb` |

### Dark Theme Colors

| Category   | Variable           | Value     |
| ---------- | ------------------ | --------- |
| Background | `--bg-page`        | `#121212` |
| Surface    | `--bg-surface`     | `#1e1e1e` |
| Navbar     | `--bg-navbar`      | `#1a1a1a` |
| Text       | `--text-primary`   | `#e5e5e5` |
| Text Muted | `--text-secondary` | `#a3a3a3` |
| Border     | `--border-default` | `#404040` |

### Spacing Scale

| Alias                      | Variable       | Value (rem) | Value (px) | Common Use Case           |
| -------------------------- | -------------- | ----------- | ---------- | ------------------------- |
| `--spacing-xs`             | `--spacing-2`  | 0.5rem      | 8px        | Tight spacing, icons      |
| `--spacing-sm`             | `--spacing-3`  | 0.75rem     | 12px       | Small gaps, input padding |
| `--spacing-md`             | `--spacing-4`  | 1rem        | 16px       | Default spacing           |
| `--spacing-lg`             | `--spacing-6`  | 1.5rem      | 24px       | Card padding, margins     |
| `--spacing-xl`             | `--spacing-8`  | 2rem        | 32px       | Large gaps                |
| `--spacing-2xl`            | `--spacing-12` | 3rem        | 48px       | Section spacing           |
| `--spacing-3xl`            | `--spacing-16` | 4rem        | 64px       | Major sections            |
| `--spacing-section`        | -              | 4rem        | 64px       | Between sections          |
| `--spacing-container`      | -              | 1.5rem      | 24px       | Container padding         |
| `--spacing-card-padding`   | -              | 1.5rem      | 24px       | Card internal padding     |
| `--spacing-input-padding`  | -              | 0.75rem     | 12px       | Form input padding        |
| `--spacing-button-padding` | -              | 1rem        | 16px       | Button padding            |
