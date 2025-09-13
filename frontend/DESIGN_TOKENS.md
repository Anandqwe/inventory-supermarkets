# Design Tokens Documentation

This document describes the design system tokens used throughout the Inventory Management application.

## Color System

### Primary Colors
- **Primary**: Indigo-600 (`#4f46e5`) for main actions, links, and brand elements
- **Primary Hover**: Indigo-700 (`#4338ca`) for hover states
- **Accent**: Sky-500 (`#0ea5e9`) for highlights and secondary actions

### Semantic Colors
- **Success**: Emerald-500 (`#10b981`) for positive states, confirmations
- **Warning**: Amber-500 (`#f59e0b`) for cautions, alerts
- **Danger**: Rose-500 (`#ef4444`) for errors, destructive actions

### Surface Colors (Adaptive)
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--color-bg-primary` | White | Slate-950 | Main backgrounds |
| `--color-bg-secondary` | Slate-50 | Slate-900 | Card backgrounds |
| `--color-bg-tertiary` | Slate-100 | Slate-800 | Subtle backgrounds |

### Text Colors (Adaptive)
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--color-text-primary` | Slate-900 | Slate-50 | Headlines, body text |
| `--color-text-secondary` | Slate-500 | Slate-400 | Supporting text |
| `--color-text-muted` | Slate-400 | Slate-500 | Placeholder text |

### Border Colors (Adaptive)
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `--color-border-primary` | Slate-200 | Slate-700 | Default borders |
| `--color-border-secondary` | Slate-300 | Slate-600 | Subtle dividers |

## Typography

### Font Family
- **Primary**: Inter (with system fallbacks)
- Loaded from Google Fonts with weights: 300, 400, 500, 600, 700

### Type Scale
| Size | Value | Line Height | Usage |
|------|-------|-------------|-------|
| `xs` | 0.75rem | 1.5 | Captions, badges |
| `sm` | 0.875rem | 1.5 | Small text, labels |
| `base` | 1rem | 1.5 | Body text |
| `lg` | 1.125rem | 1.5 | Large body text |
| `xl` | 1.25rem | 1.2 | Small headings |
| `2xl` | 1.5rem | 1.2 | Medium headings |
| `3xl` | 1.875rem | 1.2 | Large headings |

### Line Heights
- **Body**: 1.5 for optimal reading
- **Headings**: 1.2 for tighter spacing

## Spacing System

Uses Tailwind's default spacing scale with additions:
- `xs`: 0.25rem (4px)
- `sm`: 0.5rem (8px)
- `md`: 1rem (16px)
- `lg`: 1.5rem (24px)
- `xl`: 2rem (32px)
- `2xl`: 3rem (48px)

### Layout Spacing
- **Section separation**: `py-6` (24px vertical)
- **Card padding**: `p-5` (20px all sides)
- **Component margins**: Use multiples of 4px

## Border Radius

| Size | Value | Usage |
|------|-------|-------|
| `sm` | 6px | Buttons, inputs, small cards |
| `md` | 10px | Cards, modals |
| `lg` | 14px | Large containers |

## Shadows

| Size | Value | Usage |
|------|-------|-------|
| `sm` | Subtle 1px shadow | Input focus, small elevation |
| `md` | Standard 4px shadow | Cards, buttons |
| `lg` | Prominent 10px shadow | Modals, dropdowns |

## Motion & Transitions

### Duration
- **Fast**: 150ms for hover states
- **Normal**: 200ms (default) for most transitions
- **Slow**: 300ms for complex animations

### Easing
- **Default**: `ease-out` (cubic-bezier(0.4, 0, 0.2, 1))

### Animations
- `fade-in`: Simple opacity transition
- `slide-in`: Vertical slide with fade
- `scale-in`: Scale with fade for modals

### Reduced Motion
Respects `prefers-reduced-motion: reduce` by disabling animations.

## Accessibility

### Color Contrast
All color combinations meet WCAG AA standards (4.5:1 ratio):
- Dark text on light backgrounds
- Light text on dark backgrounds
- Sufficient contrast for colored elements

### Focus States
- **Focus ring**: 2px solid primary color
- **Offset**: 2px from element
- **Border radius**: Consistent with element shape

## Usage Examples

### CSS Custom Properties
```css
/* Use semantic color tokens */
.card {
  background-color: rgb(var(--color-bg-primary));
  border: 1px solid rgb(var(--color-border-primary));
  color: rgb(var(--color-text-primary));
}

/* Success state */
.success-message {
  background-color: rgb(var(--color-success) / 0.1);
  color: rgb(var(--color-success));
}
```

### Tailwind Classes
```html
<!-- Primary button -->
<button class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md">
  Submit
</button>

<!-- Card with proper spacing -->
<div class="bg-white dark:bg-surface-800 p-5 rounded-lg shadow-md">
  <h3 class="text-xl font-semibold text-primary mb-4">Card Title</h3>
  <p class="text-secondary">Card content with proper contrast</p>
</div>
```

## Dark Mode Implementation

### Strategy
- Uses Tailwind's `class` strategy
- Theme preference stored in localStorage
- Smooth transitions between themes

### Color Tokens
All colors are defined as CSS custom properties that change based on the `.dark` class on the root element.

### Component Patterns
```html
<!-- Light/dark adaptive styling -->
<div class="bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-50">
  Content adapts to theme
</div>
```

## Best Practices

1. **Always use semantic tokens** instead of hardcoded colors
2. **Maintain consistent spacing** using the defined scale
3. **Ensure proper contrast** in both light and dark modes
4. **Respect user motion preferences**
5. **Use consistent border radius** across similar elements
6. **Apply proper focus states** for accessibility
7. **Test both themes** during development