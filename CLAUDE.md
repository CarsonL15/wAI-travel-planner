# wAI Travel Planner - Style Guide

This document defines the design system for the wAI Travel Planner application. Follow these guidelines to maintain visual consistency across all components and pages.

## Design Philosophy

- **Executive/Premium Business** aesthetic - professional, trustworthy, refined
- **Subtle animations** - enhance UX without distraction
- **Consistency** - always use design tokens, never hardcode values
- **Accessibility** - maintain WCAG AA contrast ratios

---

## Color System

### Primary Palette

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#1E3A5F` | Primary buttons, links, key UI elements |
| `primaryLight` | `#2D5A8A` | Hover states, secondary emphasis |
| `primaryDark` | `#152A45` | Active/pressed states |
| `accent` | `#0EA5E9` | Call-to-action highlights, focus rings |
| `accentLight` | `#38BDF8` | Accent hover states |
| `highlight` | `#C9A227` | Premium/gold accents, selected states |

### Neutral Palette

| Token | Value | Usage |
|-------|-------|-------|
| `bgPrimary` | `#FAFAFA` | Page background |
| `bgSecondary` | `#F5F5F5` | Section backgrounds, subtle separation |
| `bgCard` | `#FFFFFF` | Card backgrounds, elevated surfaces |
| `textPrimary` | `#111827` | Headings, important text |
| `textSecondary` | `#4B5563` | Body text, descriptions |
| `textMuted` | `#9CA3AF` | Placeholder text, disabled states |
| `border` | `#E5E7EB` | Default borders |
| `borderHover` | `#D1D5DB` | Border hover states |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `success` | `#059669` | Success messages, confirmations |
| `warning` | `#D97706` | Warnings, caution states |
| `error` | `#DC2626` | Errors, destructive actions |
| `info` | `#0284C7` | Informational messages |

### Gradients

```css
/* Primary gradient - buttons, hero elements */
--gradient-primary: linear-gradient(135deg, #1E3A5F 0%, #2D5A8A 100%);

/* Accent gradient - CTAs, highlights */
--gradient-accent: linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%);

/* Hero background gradient */
--gradient-hero: linear-gradient(180deg, #F5F5F5 0%, #FAFAFA 100%);

/* Card hover overlay */
--gradient-card-hover: linear-gradient(180deg, rgba(30,58,95,0.02) 0%, rgba(14,165,233,0.03) 100%);
```

---

## Typography

### Font Families

```css
/* Headlines - elegant, professional serif */
--font-display: 'DM Serif Display', Georgia, serif;

/* Body text - clean, readable sans-serif */
--font-body: 'Inter', system-ui, -apple-system, sans-serif;
```

### Font Scale

| Token | Size | Usage |
|-------|------|-------|
| `text-xs` | 0.75rem (12px) | Fine print, labels |
| `text-sm` | 0.875rem (14px) | Secondary text, captions |
| `text-base` | 1rem (16px) | Body text |
| `text-lg` | 1.125rem (18px) | Large body text |
| `text-xl` | 1.25rem (20px) | Section headers |
| `text-2xl` | 1.5rem (24px) | Card titles |
| `text-3xl` | 1.875rem (30px) | Page section titles |
| `text-4xl` | 2.25rem (36px) | Page titles |
| `text-5xl` | 3rem (48px) | Hero headings |
| `text-6xl` | 3.75rem (60px) | Large hero text |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasis, buttons |
| `font-semibold` | 600 | Subheadings |
| `font-bold` | 700 | Headings |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `tracking-tight` | -0.025em | Headlines |
| `tracking-normal` | 0 | Body text |
| `tracking-wide` | 0.025em | Buttons, labels |

---

## Spacing

Use consistent spacing throughout the application:

| Token | Value | Pixels |
|-------|-------|--------|
| `space-1` | 0.25rem | 4px |
| `space-2` | 0.5rem | 8px |
| `space-3` | 0.75rem | 12px |
| `space-4` | 1rem | 16px |
| `space-5` | 1.25rem | 20px |
| `space-6` | 1.5rem | 24px |
| `space-8` | 2rem | 32px |
| `space-10` | 2.5rem | 40px |
| `space-12` | 3rem | 48px |
| `space-16` | 4rem | 64px |
| `space-20` | 5rem | 80px |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Small elements, badges |
| `radius-md` | 6px | Buttons, inputs |
| `radius-lg` | 8px | Cards |
| `radius-xl` | 12px | Modals, large containers |
| `radius-2xl` | 16px | Hero sections |
| `radius-full` | 9999px | Pills, avatars |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)` | Subtle elevation |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.04)` | Cards, buttons |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.03)` | Hover states, dropdowns |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.03)` | Modals, popovers |
| `shadow-glow` | `0 0 20px rgba(14,165,233,0.15)` | Focus states |

---

## Animation

### Timing Functions

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);  /* Smooth default */
--ease-in: cubic-bezier(0.4, 0, 1, 1);          /* Accelerate */
--ease-out: cubic-bezier(0, 0, 0.2, 1);         /* Decelerate */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);    /* Smooth both */
```

### Durations

| Token | Value | Usage |
|-------|-------|-------|
| `duration-fast` | 150ms | Hovers, focus states |
| `duration-normal` | 200ms | Standard transitions |
| `duration-slow` | 300ms | Modal animations |
| `duration-slower` | 400ms | Complex animations |

### Animation Guidelines

1. **Subtle is better** - animations should enhance, not distract
2. **Use CSS transitions** over JavaScript animations when possible
3. **Respect reduced motion** - check `prefers-reduced-motion`
4. **Consistent timing** - use the defined duration tokens

---

## Component Patterns

### Buttons

**Primary Button**
```css
background: var(--gradient-primary);
color: white;
padding: 10px 20px;
border-radius: var(--radius-md);
font-weight: 500;
letter-spacing: 0.025em;
box-shadow: var(--shadow-md);
transition: all 200ms ease;

/* Hover */
transform: translateY(-1px);
box-shadow: var(--shadow-lg);
```

**Secondary Button**
```css
background: white;
color: var(--color-primary);
border: 1px solid var(--color-primary);
padding: 10px 20px;
border-radius: var(--radius-md);

/* Hover */
background: var(--color-primary);
color: white;
```

**Ghost Button**
```css
background: transparent;
color: var(--color-primary);
padding: 10px 20px;

/* Hover */
background: rgba(30, 58, 95, 0.05);
```

### Cards

```css
background: var(--color-bg-card);
border: 1px solid var(--color-border);
border-radius: var(--radius-lg);
padding: var(--space-6);
box-shadow: var(--shadow-md);
transition: all 200ms ease;

/* Hover */
transform: translateY(-1px);
box-shadow: var(--shadow-lg);
```

### Inputs

```css
background: white;
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
padding: var(--space-3) var(--space-4);
font-size: var(--text-base);
transition: all 150ms ease;

/* Focus */
border-color: var(--color-accent);
box-shadow: var(--shadow-glow);
outline: none;
```

### Modals

```css
/* Backdrop */
background: rgba(15, 23, 42, 0.6);
backdrop-filter: blur(4px);

/* Modal Container */
background: white;
border-radius: var(--radius-xl);
box-shadow: var(--shadow-xl);
padding: var(--space-8);
```

---

## Map Styling

The interactive world map uses Mapbox GL JS with these color configurations:

| Element | Color | Description |
|---------|-------|-------------|
| Ocean | `#1E293B` | Dark slate background |
| Land (default) | `#334155` | Lighter slate |
| Land (hover) | `#0EA5E9` | Accent blue highlight |
| Land (selected) | `#C9A227` | Gold highlight |
| Borders | `rgba(255,255,255,0.1)` | Subtle white borders |
| Labels | `#94A3B8` | Muted gray text |

---

## Code Patterns

### Using Design Tokens in React

```tsx
import { DESIGN } from '@/lib/constants';

// In component styles
const buttonStyle = {
  background: DESIGN.gradients.primary,
  borderRadius: DESIGN.radius.md,
  boxShadow: DESIGN.shadows.md,
  transition: DESIGN.transitions.normal,
};
```

### CSS Custom Properties

All design tokens are available as CSS custom properties:

```css
.my-element {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

---

## Accessibility

1. **Color contrast** - Maintain WCAG AA minimum (4.5:1 for text, 3:1 for UI)
2. **Focus indicators** - Always visible focus states using `shadow-glow`
3. **Motion** - Respect `prefers-reduced-motion` preference
4. **Touch targets** - Minimum 44x44px for interactive elements
5. **Semantic HTML** - Use appropriate heading hierarchy and landmarks

---

## Do's and Don'ts

### Do
- Use design tokens for all values
- Keep animations subtle and purposeful
- Maintain consistent spacing
- Test on multiple screen sizes
- Use semantic HTML elements

### Don't
- Hardcode color values
- Use more than 2 font families
- Create jarring or fast animations
- Mix different radius values on nested elements
- Forget hover and focus states
