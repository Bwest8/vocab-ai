# iPad Design Guide - Visual Reference

## Screen Size Reference

### iPad Models Supported
- **iPad (10.2")**: 810 x 1080 (portrait), 1080 x 810 (landscape)
- **iPad Air (10.9")**: 820 x 1180 (portrait), 1180 x 820 (landscape)  
- **iPad Pro 11"**: 834 x 1194 (portrait), 1194 x 834 (landscape)
- **iPad Pro 12.9"**: 1024 x 1366 (portrait), 1366 x 1024 (landscape)

## Navigation Bar

```
┌─────────────────────────────────────────────────────────┐
│  🎓 Vocab AI      🏠 Home  📝 Create  🎴 Study         │  h-16 md:h-20
└─────────────────────────────────────────────────────────┘
```

- Sticky top navigation
- White background with blur effect
- Active state: gradient background (purple → blue)
- Responsive: icons only on mobile, text + icons on tablet+

## Home Page Layout

### Mobile (< 640px)
```
┌─────────────┐
│   Header    │
├─────────────┤
│   Create    │
├─────────────┤
│   Study     │
├─────────────┤
│   Games     │
├─────────────┤
│  Features   │
│   (2 cols)  │
├─────────────┤
│   Setup     │
└─────────────┘
```

### iPad Portrait (768px - 1024px)
```
┌───────────────────────────┐
│         Header            │
├─────────────┬─────────────┤
│   Create    │    Study    │
├─────────────┴─────────────┤
│          Games            │
├───────────────────────────┤
│        Features           │
│        (2 cols)           │
├───────────────────────────┤
│          Setup            │
└───────────────────────────┘
```

### iPad Landscape / Desktop (> 1024px)
```
┌──────────────────────────────────────┐
│              Header                  │
├───────────┬───────────┬──────────────┤
│  Create   │   Study   │    Games     │
├───────────┴───────────┴──────────────┤
│            Features                  │
│            (2 cols)                  │
├──────────────────────────────────────┤
│              Setup                   │
└──────────────────────────────────────┘
```

## Study Page Layout

### Mobile (< 1024px)
```
┌─────────────────────┐
│  Vocab Sets List    │
├─────────────────────┤
│  Mastery Overview   │
├─────────────────────┤
│                     │
│   Current Word      │
│   ┌─────────────┐   │
│   │   Word      │   │
│   │   Details   │   │
│   └─────────────┘   │
│                     │
├─────────────────────┤
│  ← Prev  |  Next → │
├─────────────────────┤
│  ❌ Practice | ✓ OK │
└─────────────────────┘
```

### iPad Landscape (> 1024px)
```
┌──────────┬──────────────────────────────┐
│  Vocab   │                              │
│  Sets    │      Current Word            │
│          │   ┌──────────────────────┐   │
│──────────┤   │                      │   │
│          │   │   Word Details       │   │
│ Mastery  │   │                      │   │
│ Overview │   └──────────────────────┘   │
│          │                              │
│          │  ← Previous  |  Next →       │
│          │  ❌ Practice  |  ✓ Knew It   │
└──────────┴──────────────────────────────┘
```

Sidebar: 300px (lg) → 340px (xl)
Main: flex-1

## Create Page Layout

### All Screens (Centered, max-width-5xl)
```
┌─────────────────────────────────┐
│    Create Vocabulary Set        │
├─────────────────────────────────┤
│  Lesson Name:  [__________]     │
│  Grade Level:  [__________]     │
│  Description:  [__________]     │
├─────────────────────────────────┤
│  Vocabulary Words:              │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │   Textarea (10-12 rows)   │  │
│  │                           │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│ [Process Vocabulary] [Example]  │
└─────────────────────────────────┘
```

Mobile: buttons stack vertically
Tablet+: buttons side-by-side

## Image Modal (Study Page)

### Layout
```
┌────────────────────────────────────────┐
│  Create Images for "word"          ✕   │
├────────────────────────────────────────┤
│                                        │
│         Image Preview Area             │
│         (300-420px height)             │
│                                        │
├────────────────────────────────────────┤
│   "Example sentence displayed here"    │
├────────────────────────────────────────┤
│   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐      │
│   │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │      │
│   └───┘ └───┘ └───┘ └───┘ └───┘      │
├────────────────────────────────────────┤
│            [Generate Image]            │
└────────────────────────────────────────┘
```

## Component Sizes

### Touch Targets (minimum 44x44px)
- **Navigation items**: 
  - Mobile: h-16 (64px)
  - Tablet: h-20 (80px)
- **Buttons**:
  - Small: py-2 (32px total with px)
  - Medium: py-3 (44px total)
  - Large: py-4 (56px total)
- **Example selector**: 
  - Mobile: h-20 (80px)
  - Tablet: h-24 (96px)

### Text Sizes
- **Headings**:
  - H1: text-3xl md:text-4xl lg:text-5xl (30px → 36px → 48px)
  - H2: text-xl md:text-2xl lg:text-3xl (20px → 24px → 30px)
- **Body**: text-sm md:text-base (14px → 16px)
- **Labels**: text-xs md:text-sm (12px → 14px)

### Spacing
- **Container padding**: 
  - Mobile: px-3 py-6 (12px, 24px)
  - Tablet: px-4 py-8 (16px, 32px)
  - Desktop: px-6 py-12 (24px, 48px)
- **Card gaps**:
  - Mobile: gap-4 (16px)
  - Tablet: gap-6 (24px)
  - Desktop: gap-8 (32px)

### Border Radius
- **Small elements**: rounded-xl (12px) → rounded-2xl (16px)
- **Large cards**: rounded-2xl (16px) → rounded-3xl (24px)
- **Buttons**: rounded-xl (12px) → rounded-full (9999px)

## Color Palette

### Backgrounds
```css
bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50
bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100
bg-white/80 (with backdrop-blur-sm)
bg-white/90 (with backdrop-blur-sm)
```

### Buttons
```css
Primary:   bg-gradient-to-r from-blue-600 to-purple-600
Secondary: border-2 border-gray-300 text-gray-700
Success:   bg-green-500 text-white
Error:     border-2 border-red-400 text-red-500
```

### Status Messages
```css
Error:   bg-red-50 border-red-200 text-red-700
Success: bg-green-50 border-green-200 text-green-800
Warning: bg-yellow-50 border-yellow-200 text-yellow-700
Info:    bg-blue-50 border-blue-200 text-blue-700
```

## Interaction States

### Buttons
```css
Default:  shadow-lg
Hover:    hover:shadow-xl hover:scale-105
Active:   active:scale-100 (or active:bg-*-800)
Disabled: opacity-50 cursor-not-allowed
```

### Cards
```css
Default:  shadow-lg
Hover:    hover:shadow-xl hover:scale-105
Active:   active:scale-100
Selected: border-2 border-blue-500 shadow-md
```

## Animations

All animations use:
- `transition-all` or `transition-colors`
- Hardware-accelerated transforms (scale, translate)
- Smooth duration (200ms default)

### Loading States
- Spinner: `animate-spin` with border animation
- Skeleton: `animate-pulse` with bg opacity

## Best Practices Applied

1. **Touch First**: All interactions designed for touch
2. **Readable**: Large text, high contrast
3. **Responsive**: Fluid layouts that adapt
4. **Performant**: Hardware-accelerated, optimized scrolling
5. **Accessible**: Semantic HTML, ARIA labels, focus states
6. **Visual Hierarchy**: Clear size/color/spacing differences
7. **Consistent**: Reusable patterns throughout
8. **Feedback**: Visual feedback on all interactions

## Testing Checklist

- [ ] Navigation works on all screen sizes
- [ ] All buttons are easily tappable (44x44px minimum)
- [ ] Text is readable without zooming
- [ ] Scrolling is smooth
- [ ] Modals fit on screen with padding
- [ ] Forms are easy to fill out
- [ ] Landscape and portrait orientations work
- [ ] No horizontal scrolling
- [ ] Loading states are clear
- [ ] Error messages are visible and helpful
