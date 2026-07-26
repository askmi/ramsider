# Layout Alignment Fixed ✓

## Problem
The sections needed:
1. **Heading text** - left-aligned within the content
2. **Section container** - centered on the main page layout

## Solution Applied

Both **Testimonial Section** and **Shipping Section** now follow the correct layout pattern:

### Structure:
```
section (full width background)
  └─ div.mx-auto.max-w-7xl (centered container, max 1280px)
       └─ grid.lg:grid-cols-2 (2-column layout)
            ├─ Left column
            │    ├─ h2 (left-aligned heading)
            │    └─ content
            └─ Right column
                 └─ image/map
```

## Key Changes

### 1. Section Container
- ✅ Full-width background: `bg-{color}`
- ✅ Responsive padding: `px-4 py-24 sm:px-6 lg:px-8`

### 2. Content Container
- ✅ Centered with max width: `mx-auto max-w-7xl`
- ✅ This centers the entire content block on the page

### 3. Heading Position
- ✅ **Left-aligned** (no `text-center`)
- ✅ Inside the left column of the grid
- ✅ Proper typography: `font-display text-3xl font-light tracking-extra-wide`

### 4. Layout Grid
- ✅ 2-column grid on desktop: `grid lg:grid-cols-2`
- ✅ Stacks vertically on mobile
- ✅ Proper gap spacing: `gap-12 lg:gap-16`

## Testimonial Section Layout

```
[Gray Background - Full Width]
    [Centered Container - max-w-7xl]
        [2-Column Grid]
            [Left Column]
                LOVED BY EXPERTS ← left-aligned
                Quote text
                ★★★★★
                Source
            [Right Column]
                Product Image
```

## Shipping Section Layout

```
[White Background - Full Width]
    [Centered Container - max-w-7xl]
        [2-Column Grid]
            [Left Column]
                SHIPS WORLDWIDE ← left-aligned
                🌍 Description
            [Right Column]
                World Map SVG
```

## What This Achieves

1. **Centered Content Block**: The `max-w-7xl` container is centered using `mx-auto`, so the entire section content is centered on wide screens

2. **Left-Aligned Headings**: Headings are naturally left-aligned within their column, matching the design

3. **Responsive**: On mobile, content stacks vertically with headings naturally left-aligned

4. **Consistent**: Matches the layout pattern used throughout the site

## Files Modified

- `components/sections/TestimonialSection.tsx`
- `components/sections/ShippingSection.tsx`

## Visual Result

**Desktop:**
- Section content centered on page (within max-w-7xl container)
- Headings left-aligned within left column
- Clean 2-column layout

**Mobile:**
- Content stacks vertically
- Headings left-aligned
- Full-width within padding

## Status

✅ Section containers centered on page (`mx-auto max-w-7xl`)
✅ Headings left-aligned (removed `text-center`)
✅ Proper 2-column grid layout
✅ Consistent with site design pattern
✅ Responsive on all screen sizes

Live at: http://localhost:3000/en
