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
--color-primary         // Main primary color
--color-primary-light   // Slightly lighter
--color-primary-dark    // Slightly darker
--color-primary-lighter // Much lighter
--color-primary-darker  // Much darker
```

---

### 2. Secondary Color - Navy Blue

| Property     | Value                    |
| ------------ | ------------------------ |
| Hex          | `#0f3057`                |
| CSS Variable | `var(--secondary-color)` |
| RGB          | `15, 48, 87`             |

**When to use:**

- Gradient endpoints (paired with primary)
- Footer backgrounds
- Dark section backgrounds
- Secondary buttons (dark variant)
- Important headings
- Depth and shadow effects

**Examples:**

```scss
// Dark section
.dark-section {
  background-color: var(--secondary-color);
  color: #fff;
}

// Gradient divider
.divider {
  background: linear-gradient(var(--primary-color) 0%, var(--secondary-color) 100%);
}
```

---

### 3. Tertiary Color - Warm Cream

| Property     | Value                   |
| ------------ | ----------------------- |
| Hex          | `#e7e7de`               |
| CSS Variable | `var(--tertiary-color)` |
| RGB          | `231, 231, 222`         |

**When to use:**

- Navigation bar background
- Light section backgrounds
- Card backgrounds (subtle)
- Dividers and borders
- Neutral background areas
- Hover states on light backgrounds

**Examples:**

```scss
// Navbar
.navbar {
  background-color: var(--tertiary-color);
}

// Light card background
.card-light {
  background-color: var(--tertiary-color);
}
```

---

### 4. Fourth Color - Bright Teal (Accent)

| Property     | Value                 |
| ------------ | --------------------- |
| Hex          | `#008891`             |
| CSS Variable | `var(--fourth-color)` |
| RGB          | `0, 136, 145`         |

**When to use:**

- Links and interactive elements
- Hover states
- Success indicators
- Accent highlights
- Icon colors
- Button gradients (endpoint)
- Call-to-action emphasis

**Examples:**

```scss
// Link styling
a {
  color: var(--fourth-color);

  &:hover {
    color: var(--primary-color);
  }
}

// Accent button gradient
button.accent {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--fourth-color) 100%);
}
```

---

### 5. Fifth Color - Forest Green

| Property     | Value                |
| ------------ | -------------------- |
| Hex          | `#005816`            |
| CSS Variable | `var(--fifth-color)` |
| RGB          | `0, 88, 22`          |

**When to use:**

- Success messages and states
- Completed/fulfilled wish indicators
- Positive feedback
- "Available" status indicators
- Special dialog backgrounds (wish dialogs)

**Examples:**

```scss
// Success state
.success {
  color: var(--fifth-color);
}

// Wish dialog background
.wish-dialog {
  background-color: var(--fifth-color);
}
```

---

### 6. Sixth Color - Charcoal (Text)

| Property     | Value                |
| ------------ | -------------------- |
| Hex          | `#333333`            |
| CSS Variable | `var(--sixth-color)` |
| RGB          | `51, 51, 51`         |

**When to use:**

- Body text
- Headings on light backgrounds
- Form labels
- Dark text on light backgrounds
- Menu items
- Paragraphs and content

**Examples:**

```scss
// Body text
body {
  color: var(--sixth-color);
}

// Heading
h1,
h2,
h3 {
  color: var(--sixth-color);
}
```

---

## Additional Colors (Non-Variable)

These colors are used sparingly and could be added as variables if needed:

| Color            | Hex       | Usage                                      |
| ---------------- | --------- | ------------------------------------------ |
| White            | `#ffffff` | Text on dark backgrounds, card backgrounds |
| Off-white        | `#fafafa` | Page background                            |
| Light Teal       | `#e4f2f3` | Service card backgrounds                   |
| Light Gray       | `#6b7280` | Secondary text, placeholders               |
| Error Red        | `#dc2626` | Error messages, validation                 |
| Error Background | `#fef2f2` | Error message backgrounds                  |

---

## Common Color Patterns

### Gradients

**Primary to Secondary (Hero sections, branding):**

```scss
background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
```

**Primary to Accent (Buttons, CTAs):**

```scss
background: linear-gradient(135deg, var(--primary-color) 0%, var(--fourth-color) 100%);
```

### Shadows

**Card shadow:**

```scss
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
```

**Elevated shadow:**

```scss
box-shadow:
  0 25px 50px -12px rgba(0, 0, 0, 0.15),
  0 12px 24px -8px rgba(0, 0, 0, 0.1);
```

**Button hover shadow:**

```scss
box-shadow: 0 8px 20px rgba(52, 98, 108, 0.3); // Uses primary color RGB
```

---

## Taiga UI Integration

The application uses Taiga UI components. The primary color is mapped to Taiga's theming system:

```scss
:root {
  --tui-primary: var(--primary-color) !important;
  --tui-primary-hover: #{color.adjust(#34626c, $lightness: 2%)} !important;
  --tui-primary-active: #{color.adjust(#34626c, $lightness: -2%)} !important;
}
```

---

## Accessibility Guidelines

1. **Contrast Ratios:**
   - Use `#ffffff` (white) text on primary, secondary, and fourth colors
   - Use `var(--sixth-color)` for text on tertiary and light backgrounds
   - Ensure minimum 4.5:1 contrast ratio for body text
   - Ensure minimum 3:1 contrast ratio for large text and UI components

2. **Color Blindness:**
   - Don't rely solely on color to convey information
   - Use icons or text labels alongside color indicators
   - Test designs with color blindness simulators

3. **Focus States:**
   - Always provide visible focus indicators
   - Use `var(--fourth-color)` or `var(--primary-color)` for focus rings

---

## Quick Reference

| Purpose                       | Color Variable      | Hex       |
| ----------------------------- | ------------------- | --------- |
| Primary buttons, headers      | `--primary-color`   | `#34626c` |
| Gradients (dark end), footers | `--secondary-color` | `#0f3057` |
| Navbar, light backgrounds     | `--tertiary-color`  | `#e7e7de` |
| Links, accents, hover         | `--fourth-color`    | `#008891` |
| Success, completed states     | `--fifth-color`     | `#005816` |
| Body text, headings           | `--sixth-color`     | `#333333` |
