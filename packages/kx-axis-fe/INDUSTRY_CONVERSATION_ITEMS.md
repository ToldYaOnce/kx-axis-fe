# Industry-Specific Conversation Items

## Overview

Conversation items are now **industry-aware**! Each flow can select an industry, and the available conversation items in the palette will automatically include:

1. **General Items** (always available to all industries)
2. **Industry-Specific Items** (only for the selected industry)

---

## Configuration

### **JSON File**
All items are configured in: `src/config/industryConversationItems.json`

This JSON-driven approach allows easy updates without code changes (before migrating to database).

### **Structure**
```json
{
  "industries": ["Technology", "Healthcare", ...],
  "generalItems": [...],  // Available to ALL industries
  "industryItems": {
    "Technology": [...],
    "Healthcare": [...],
    ...
  }
}
```

---

## Supported Industries

1. **Technology** - Demo Request, Technical Requirements, Integration Needs, Support Tier
2. **Healthcare** - Insurance Verification, Symptom Assessment, Appointment Scheduling, Medical History
3. **Finance** - Risk Assessment, Account Type, Investment Goals, Credit Check
4. **Education** - Program Selection, Enrollment, Prerequisites Check, Financial Aid
5. **Retail** - Product Recommendation, Size/Fit Guide, Return Policy, Loyalty Program
6. **Manufacturing** - Quote Request, Specifications, Volume Pricing, Lead Time
7. **Marketing & Advertising** - Campaign Goals, Budget Range, Target Audience, Creative Brief
8. **Real Estate** - Property Preferences, Budget Range, Location Preferences, Viewing Schedule
9. **Fitness & Wellness** - Fitness Assessment, Nutrition Preferences, Class Schedule, Injury History
10. **Hospitality** - Reservation, Room Preferences, Special Requests, Loyalty Status
11. **Construction** - Project Scope, Budget Estimate, Timeline, Permit Requirements
12. **Legal Services** - Case Assessment, Document Review, Consultation Scheduling, Fee Structure
13. **Consulting** - Problem Definition, Scope Assessment, Engagement Type, Project Timeline
14. **Non-profit** - Donation Intent, Volunteer Interest, Impact Story, Membership
15. **Other** - General items only

---

## General Conversation Items

These are available to **ALL** industries:

- **Welcome / Introduction** - Greet and set expectations
- **Reflective Question** - Ask them to reflect on readiness
- **Goal Gap Tracker** - Target → Baseline → Delta → Category (NEW)
- **Contact Capture** - Get email/phone for follow-up
- **Book Consultation** - Schedule a session or call
- **Send Promo** - Share discount or offer
- **Handoff** - Transfer to human

---

## How It Works

### **1. User Selects Industry**
In the Conversation Flow Overview (right panel), select an industry from the dropdown.

### **2. Palette Updates Automatically**
The left sidebar automatically shows:
- General items (always)
- Industry-specific items (based on selection)

### **3. Drag & Drop**
Drag any item onto the canvas to add it to your flow.

---

## Adding New Items

### **Add Industry-Specific Item**
Edit `src/config/industryConversationItems.json`:

```json
"Healthcare": [
  {
    "id": "prescription-refill",
    "kind": "ACTION_BOOKING",
    "title": "Prescription Refill",
    "description": "Request medication refill",
    "icon": "calendar"
  }
]
```

### **Add General Item**
Edit the `generalItems` array in the same file.

### **Available Icon Names**
- `info` - Info icon
- `question` - Question mark
- `trend` - Chart/trend icon
- `contact` - Contact icon
- `calendar` - Calendar icon
- `tag` - Tag/offer icon
- `handoff` - Handshake icon

### **Available `kind` Values**
- `EXPLANATION` - Informational node
- `REFLECTIVE_QUESTION` - Question node
- `GOAL_GAP_TRACKER` - Goal tracking node
- `BASELINE_CAPTURE` - Data capture node
- `ACTION_BOOKING` - Booking/scheduling node
- `HANDOFF` - Human handoff node

---

## API Integration

### **TypeScript Utilities**
Located in: `src/utils/conversationItems.ts`

```typescript
// Get all items for an industry (general + industry-specific)
getConversationItemsForIndustry('Healthcare')

// Get only general items
getGeneralItems()

// Get only industry-specific items
getIndustrySpecificItems('Healthcare')

// Check if industry has specific items
hasIndustrySpecificItems('Technology') // true
```

---

## Future Enhancements

### **Short-term:**
- Add more icons (currently limited to 7)
- Add industry icons/colors
- Allow custom item creation per flow

### **Medium-term:**
- Migrate to database table
- Add versioning for items
- Allow tenants to customize items

### **Long-term:**
- AI-suggested items based on flow context
- Analytics on most-used items per industry
- Marketplace for community-created items

---

## Testing

1. Open a conversation flow
2. Change industry in Overview panel (right sidebar)
3. Observe conversation items update in left palette
4. Drag industry-specific items onto canvas
5. Switch industry again → items should update

---

## Notes

- Industry is stored in `flow.industry` field
- Changes are autosaved (if API integration enabled)
- Items are loaded dynamically (React memo + useEffect)
- General items are **always** visible regardless of industry
- "Other" industry = general items only

