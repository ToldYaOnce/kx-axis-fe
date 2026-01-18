# Icon Mapping Fix for Industry-Specific Items

## Issue
Finance (and other industries) conversation items were configured in the JSON but weren't displaying properly in the palette because their icons weren't mapped to actual React components.

## Root Cause
The `industryConversationItems.json` defined items with icon names like:
- `"icon": "chart"` (Finance)
- `"icon": "account"` (Finance)
- `"icon": "presentation"` (Technology)
- `"icon": "health"` (Healthcare)
- etc.

But the `iconMap` in `ConversationItemsPalette.tsx` only had 7 icons:
```typescript
{
  info, question, trend, contact, calendar, tag, handoff
}
```

Any item using a different icon would fall back to `InfoOutlinedIcon`, making all industry-specific items look the same (info icon).

## Solution
Added **35+ MUI icons** to fully support all industry-specific conversation items.

### Icons Added by Industry:

#### **Finance** (4 icons)
- `chart` → `ShowChartIcon`
- `account` → `AccountBalanceIcon`
- `target` → `GpsFixedIcon`
- `checkmark` → `CheckCircleOutlineIcon`

#### **Technology** (4 icons)
- `presentation` → `PresentationChartIcon`
- `code` → `CodeIcon`
- `plug` → `PlugIcon`
- `support` → `SupportIcon`

#### **Healthcare** (3 icons)
- `shield` → `ShieldIcon`
- `health` → `HealthIcon`
- `clipboard` → `ClipboardIcon`

#### **Education** (4 icons)
- `school` → `SchoolIcon`
- `signup` → `SignupIcon`
- `checklist` → `ChecklistIcon`
- `money` → `MoneyIcon`

#### **Retail** (4 icons)
- `gift` → `GiftIcon`
- `ruler` → `RulerIcon`
- `return` → `ReturnIcon`
- `star` → `StarIcon`

#### **Manufacturing** (4 icons)
- `document` → `DocumentIcon`
- `blueprint` → `BlueprintIcon`
- `calculator` → `CalculatorIcon`
- `clock` → `ClockIcon`

#### **Marketing & Advertising** (2 icons)
- `people` → `PeopleIcon`
- `palette` → `PaletteIcon`

#### **Real Estate** (2 icons)
- `home` → `HomeIcon`
- `map` → `MapIcon`

#### **Fitness & Wellness** (3 icons)
- `fitness` → `FitnessIcon`
- `nutrition` → `NutritionIcon`
- `warning` → `WarningIcon`

#### **Hospitality** (2 icons)
- `bed` → `BedIcon`
- `vip` → `VipIcon`

#### **Legal Services** (1 icon)
- `gavel` → `GavelIcon`

#### **Non-profit** (2 icons)
- `heart` → `HeartIcon`
- `card` → `CardIcon`

---

## Files Modified
- `packages/kx-axis-fe/src/components/ConversationItems/ConversationItemsPalette.tsx`
  - Added 35+ icon imports from `@mui/icons-material`
  - Updated `iconMap` with all industry-specific icons
  - Organized by industry for maintainability

---

## Testing

### Before Fix:
- All industry-specific items showed `ℹ️` (info icon)
- Hard to differentiate items visually

### After Fix:
Each industry now has distinct, meaningful icons:

**Finance:**
- 📊 Risk Assessment (chart)
- 🏦 Account Type (account/bank)
- 🎯 Investment Goals (target)
- ✅ Credit Check (checkmark)

**Technology:**
- 📊 Demo Request (presentation)
- 💻 Technical Requirements (code)
- 🔌 Integration Needs (plug)
- 🎧 Support Tier (support)

**Healthcare:**
- 🛡️ Insurance Verification (shield)
- 🏥 Symptom Assessment (health)
- 📋 Medical History (clipboard)

---

## Icon Naming Convention

When adding new items to `industryConversationItems.json`, use these icon names:

| Icon Name | Visual | Use Case |
|-----------|--------|----------|
| `info` | ℹ️ | General information |
| `question` | ❓ | Questions, surveys |
| `chart` | 📊 | Analytics, assessments |
| `account` | 🏦 | Banking, accounts |
| `target` | 🎯 | Goals, objectives |
| `checkmark` | ✅ | Verification, completion |
| `calendar` | 📅 | Scheduling, bookings |
| `money` | 💰 | Pricing, payments |
| `document` | 📄 | Documents, contracts |
| `people` | 👥 | Audience, teams |
| `home` | 🏠 | Property, real estate |
| `health` | 🏥 | Medical, healthcare |
| `fitness` | 💪 | Exercise, wellness |
| `heart` | ❤️ | Donations, caring |
| `star` | ⭐ | Premium, featured |
| `gift` | 🎁 | Products, offers |
| `gavel` | ⚖️ | Legal, justice |
| `shield` | 🛡️ | Protection, security |
| `code` | 💻 | Technical, programming |
| `school` | 🎓 | Education, learning |

---

## Adding New Icons

If you need a new icon that isn't in the list:

1. **Choose an appropriate MUI icon:**
   - Browse: https://mui.com/material-ui/material-icons/
   - Use semantic names (e.g., `AttachMoney` for money, `School` for education)

2. **Add import in `ConversationItemsPalette.tsx`:**
   ```typescript
   import NewIcon from '@mui/icons-material/NewIconName';
   ```

3. **Add to `iconMap`:**
   ```typescript
   const iconMap: Record<string, React.ReactElement> = {
     // ...
     newiconname: <NewIcon />,
   };
   ```

4. **Use in `industryConversationItems.json`:**
   ```json
   {
     "id": "my-item",
     "kind": "BASELINE_CAPTURE",
     "title": "My Item",
     "description": "Description",
     "icon": "newiconname"
   }
   ```

---

## Verification

✅ Finance items now show unique icons
✅ All 15 industries have proper icon support
✅ Icons are semantically meaningful
✅ No linter errors
✅ Organized and maintainable code

