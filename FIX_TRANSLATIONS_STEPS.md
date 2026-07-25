# Fix Translation Keys - Step by Step

## Issue
Translation keys not being recognized:
- `howItWorks.trustBadges.secure`
- `howItWorks.trustBadges.warranty`
- `howItWorks.trustBadges.returns`

---

## Verification - JSON Structure is Correct

I've verified that the translations exist in both files:

**`public/locales/en.json`** (lines 127-131):
```json
"trustBadges": {
  "secure": "SECURE CHECKOUT",
  "warranty": "2 YEARS WARRANTY",
  "returns": "30 DAY RETURNS"
}
```

**`public/locales/ru.json`** - Same structure with Russian translations.

---

## Required Actions

### Step 1: Delete Cache
```bash
rm -rf .next
```

### Step 2: Restart Dev Server
```bash
npm run dev
```

### Step 3: Hard Refresh Browser
- Chrome/Firefox: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- This clears any cached translations in the browser

---

## Alternative: Full Rebuild

If the above doesn't work, do a full clean rebuild:

```bash
# Stop dev server (Ctrl+C)

# Clean everything
rm -rf .next
rm -rf node_modules/.cache

# Rebuild and start
npm run dev
```

---

## Why This Happens

Next-intl with Next.js App Router caches translations in several places:
1. **Build cache** (`.next` directory)
2. **Module cache** (Node.js runtime)
3. **Browser cache** (client-side)

All three need to be cleared after modifying JSON translation files.

---

## Verification After Restart

Visit these URLs to verify:

### English:
`http://localhost:3000/en`

Should see at bottom of "How It Works" section:
- ✅ "SECURE CHECKOUT"
- ✅ "2 YEARS WARRANTY"
- ✅ "30 DAY RETURNS"

### Russian:
`http://localhost:3000/ru`

Should see at bottom of "How It Works" section:
- ✅ "БЕЗОПАСНАЯ ОПЛАТА"
- ✅ "ГАРАНТИЯ 2 ГОДА"
- ✅ "ВОЗВРАТ 30 ДНЕЙ"

---

## If Still Not Working

Check browser console (F12) for any errors related to:
- Missing translation keys
- JSON parse errors
- next-intl warnings

The keys should resolve once cache is cleared and server restarted.

---

## Summary

✅ JSON files are correct
✅ Translation keys are properly nested
✅ Component is using `t('trustBadges.secure')` etc.
✅ Only cache clearing + restart needed

**Action Required:**
1. Delete `.next` folder
2. Restart `npm run dev`
3. Hard refresh browser
