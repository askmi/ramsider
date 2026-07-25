# Restart Dev Server to Load New Translations

## ✅ Translations Added Successfully

The trust badge translations have been added to both `en.json` and `ru.json` files correctly.

---

## Translation Keys Added

### English (`public/locales/en.json`):
```json
"howItWorks": {
  ...
  "trustBadges": {
    "secure": "SECURE CHECKOUT",
    "warranty": "2 YEARS WARRANTY",
    "returns": "30 DAY RETURNS"
  }
}
```

### Russian (`public/locales/ru.json`):
```json
"howItWorks": {
  ...
  "trustBadges": {
    "secure": "БЕЗОПАСНАЯ ОПЛАТА",
    "warranty": "ГАРАНТИЯ 2 ГОДА",
    "returns": "ВОЗВРАТ 30 ДНЕЙ"
  }
}
```

---

## Component Updated

**File**: `components/sections/HowItWorksSection.tsx`

Using translation keys:
```tsx
<span>{t('trustBadges.secure')}</span>
<span>{t('trustBadges.warranty')}</span>
<span>{t('trustBadges.returns')}</span>
```

---

## Why Keys Not Recognized

The dev server needs to be **restarted** after JSON translation files are modified because:

1. Next-intl loads translations at build/start time
2. The messages are cached by Next.js
3. JSON file changes don't trigger hot reload for translations

---

## How to Fix

### Option 1: Restart Dev Server
```bash
# Stop current server (Ctrl+C in terminal)
# Then restart
npm run dev
```

### Option 2: Delete Cache and Restart
```bash
rm -rf .next
npm run dev
```

---

## Verification Steps

After restarting the server:

1. Visit English page: `http://localhost:3000/en`
   - Should show: "SECURE CHECKOUT", "2 YEARS WARRANTY", "30 DAY RETURNS"

2. Visit Russian page: `http://localhost:3000/ru`
   - Should show: "БЕЗОПАСНАЯ ОПЛАТА", "ГАРАНТИЯ 2 ГОДА", "ВОЗВРАТ 30 ДНЕЙ"

---

## Files Modified

✅ `public/locales/en.json` - Added howItWorks.trustBadges
✅ `public/locales/ru.json` - Added howItWorks.trustBadges
✅ `components/sections/HowItWorksSection.tsx` - Using t() for badges

---

## Result

Once the dev server is restarted:
✅ All trust badges will be properly localized
✅ English and Russian translations will work
✅ Keys will be recognized
✅ No more hardcoded English text

**Action Required**: Restart the dev server with `npm run dev`
