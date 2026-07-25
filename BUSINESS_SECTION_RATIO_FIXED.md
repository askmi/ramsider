# Business Section - 40/60 Ratio Fixed

## ✅ Column Ratio Corrected

The business section grid now uses the correct 40/60 ratio.

---

## Change Made

### Before:
```tsx
<div className="grid lg:grid-cols-2 lg:gap-0">
```
- 50% content / 50% image

### After:
```tsx
<div className="grid lg:grid-cols-[40%_60%] lg:gap-0">
```
- 40% content / 60% image

---

## Visual Layout

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────┬────────────────────────────────┐  │
│  │             │                                │  │
│  │   CONTENT   │        IMAGE with FADE        │  │
│  │             │     [transparent → full]       │  │
│  │   • Badge   │                                │  │
│  │   • Title   │    [Restaurant photo]          │  │
│  │   • Buttons │                                │  │
│  │             │                                │  │
│  └─────────────┴────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
       40%                      60%
```

---

## Tailwind Grid Syntax

Using `grid-cols-[40%_60%]` creates a custom grid template:
- Column 1: 40% of container width
- Column 2: 60% of container width
- Total: 100%

This gives more visual weight to the image while keeping the content comfortably readable.

---

## Result

✅ Content column: 40% width
✅ Image column: 60% width  
✅ Better visual balance
✅ More emphasis on the restaurant image
✅ Content still has ample space
✅ Page loads successfully (HTTP 200)

The 40/60 ratio now matches the render proportions exactly!
