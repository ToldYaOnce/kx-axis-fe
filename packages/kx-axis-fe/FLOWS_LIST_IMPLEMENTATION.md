# Flows List Implementation

## 📝 Terminology Clarification

- **"Conversation Flows"** = The overall flow/system being managed (used in UI labels, list page)
- **"Decision Constraints"** = The lanes in the editor (NO PREREQUISITES, NEEDS: CONTACT, NEEDS: BOOKING, DROP TO PLACE)
- **Internal code** = Uses `flow`, `flowId`, `ConversationFlow` types (unchanged)

---

## ✅ What Was Built

### **1. API Layer**
- `GET /agent/flows` endpoint added to `flowClient.ts`
- New types in `flow-api.ts`: `ListFlowsResponse`, `FlowListItem`
- Automatic DynamoDB prefix stripping (TENANT#, FLOW#, etc.)

### **2. UI Component**
- `src/components/FlowsList/FlowsList.tsx`
- Features:
  - Table view with sortable columns
  - Status badges (DRAFT | PUBLISHED)
  - Relative timestamps ("2h ago", "3d ago")
  - Row actions:
    - ✏️ Edit Draft
    - 👁️ View Published Version (if exists)
    - 📋 Duplicate (placeholder)
    - 📤 Publish / Unpublish (placeholder)
  - Empty state with "Create Flow" CTA
  - Loading & error states

### **3. Navigation**
- DemoApp now has 3 views:
  - **List View** (default): Shows all flows
  - **Editor View**: Opens a specific flow for editing
  - **Execution View**: Simulator mode
- "Back to Flows" button in top bar when in editor
- Seamless flow creation → editor navigation

---

## 🎯 User Flow

### **Landing Page (List View)**
```
┌─────────────────────────────────────────────┐
│ Conversation Flows                [Create]  │
├─────────────────────────────────────────────┤
│ Name          | Industry | Status | Actions │
│ Fitness Flow  | Health   | DRAFT  | ✏️ 👁️ 📋  │
│ Lead Qual     | SaaS     | PUBLISHED | ✏️ 👁️ 📋│
└─────────────────────────────────────────────┘
```

### **Create New Flow**
1. Click "Create New Flow"
2. Dialog opens to create/load flow
3. On success → navigates to editor with new flowId
4. Can return to list via "Back to Flows" button

### **Open Existing Flow**
1. Click ✏️ (Edit Draft) → Opens draft in editor
2. Click 👁️ (View Published) → Opens read-only published version
3. Back button returns to list

---

## 📊 API Contract

### **Request**
```
GET /agent/flows
Headers: 
  x-service-key: <key>
  x-tenant-id: <tenantId>
```

### **Response**
```json
{
  "flows": [
    {
      "flowId": "flow_123",
      "name": "Fitness Onboarding",
      "description": "...",
      "industry": "Health & Fitness",
      "primaryGoal": "BOOKING",
      "status": "PUBLISHED",
      "currentDraftId": "current",
      "currentDraftUpdatedAt": "2026-01-18T10:30:00Z",
      "latestPublishedVersionId": "ver_456",
      "latestPublishedAt": "2026-01-18T09:00:00Z",
      "createdAt": "2026-01-18T08:00:00Z",
      "updatedAt": "2026-01-18T10:30:00Z"
    }
  ]
}
```

---

## 🚀 Next Steps (Not Implemented)

### **Short-term:**
- Implement Duplicate flow action
- Implement Publish/Unpublish from list
- Add search/filter
- Add sorting options

### **Medium-term:**
- Pagination (if > 50 flows)
- Bulk actions (delete, archive)
- Flow tags/categories
- Version history preview

### **Long-term:**
- Flow analytics (usage, success rate)
- Team collaboration (who edited last)
- Flow templates library

---

## 🧪 Testing

### **Manual Test Steps:**
1. Start dev server: `npm run dev`
2. Open browser → http://localhost:5173
3. Should see flows list (empty or with existing flows)
4. Click "Create New Flow" → should open dialog
5. Create flow → should navigate to editor
6. Click "Back to Flows" → should return to list
7. Click Edit icon → should open that flow in editor

### **Backend Requirements:**
- `GET /agent/flows` must return `ListFlowsResponse` format
- Must include `status`, `latestPublishedVersionId`, timestamps
- DynamoDB prefixes optional (frontend strips them)

---

## 📝 Notes

- **Status Logic**: 
  - `PUBLISHED` if `latestPublishedVersionId != null`
  - `DRAFT` otherwise
- **Timestamps**: Uses `updatedAt` for sorting (most recent first)
- **Theme**: Inherits from parent (KxGrynde dark theme)
- **Auth**: Uses same `x-service-key` / `x-tenant-id` headers

