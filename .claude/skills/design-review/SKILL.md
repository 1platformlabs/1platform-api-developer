---
name: design-review
description: Review UI design consistency — dark theme, spacing, typography, component patterns, responsive design
user_invocable: true
---

# Design Review Skill

When invoked, review HTML/CSS for design consistency following the 1Platform design system.

## Design System Reference

### Colors (from CLAUDE.md)
- Background: `#0a0a0a` or similar deep black
- Accent: electric blue, purple gradients, green accents
- Text: high contrast white/light gray on dark

### Typography
- Monospace + sans-serif pairing
- Check font stack consistency across pages
- Heading sizes follow a clear scale
- Line height is readable (1.5+ for body text)

### Review Areas

#### Visual Consistency
- CSS custom properties used consistently (no hardcoded colors)
- Spacing follows a consistent scale (4px/8px base)
- Border radius consistent across components
- Shadow/glow effects match across pages
- Gradient usage is consistent

#### Component Patterns
- Buttons: consistent padding, hover states, focus states
- Cards: same shadow, border, padding pattern
- Code blocks: syntax highlighting, copy buttons
- Navigation: consistent across all pages
- Footer: consistent structure and links

#### Responsive Design
- Mobile breakpoints are consistent
- No horizontal scroll at any breakpoint
- Touch targets are 44x44px minimum
- Font sizes readable on mobile (min 16px body)
- Navigation collapses properly on mobile
- Grid layouts adapt correctly

#### Dark Theme Quality
- No white flashes on page load
- Subtle glow effects, not overwhelming
- Grid/dot backgrounds don't interfere with content
- Code snippets have proper syntax highlighting colors
- Hover states are visible but subtle

#### Animations
- Smooth micro-animations (ease, 200-300ms)
- Scroll-triggered transitions work correctly
- `prefers-reduced-motion` is respected
- No janky or stuttering animations
- Animations don't block interaction

#### Layout
- Consistent max-width for content areas
- Proper use of CSS Grid and Flexbox
- No layout overflow issues
- Proper spacing between sections

## Output Format

Rate each area: EXCELLENT / GOOD / NEEDS WORK / POOR

| Area | Rating | Issues Found | Recommendations |

Top 5 design improvements ranked by visual impact.
