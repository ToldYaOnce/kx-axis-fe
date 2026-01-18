# Delete Flow & Status Filter Feature

## Overview
Added delete functionality and status filtering to the Flows List page.

---

## Changes Made

### **1. Delete Flow Functionality**

#### **UI Changes:**
- ✅ Added red **Delete** button (trash icon) to each row's action column
- ✅ Confirmation dialog before deletion to prevent accidental deletes
- ✅ Loading state during deletion ("Deleting..." button text + spinner)
- ✅ Dialog explains consequences: "All draft and published versions will be permanently deleted"

#### **API Integration:**
Added `deleteFlow` method to `flowClient.ts`:
```typescript
async deleteFlow(flowId: string): Promise<void> {
  const response = await fetch(`${this.baseURL}/agent/flows?flowId=${flowId}`, {
    method: 'DELETE',
    headers: this.getHeaders(),
  });

  if (!response.ok) {
    return handleApiError(response);
  }

  // DELETE typically returns 204 No Content
  if (response.status !== 204) {
    await response.json();
  }
}
```

#### **Backend Endpoint:**
- `DELETE /agent/flows?flowId={flowId}`
- Deletes flow and all associated versions (draft + published)
- Returns `204 No Content` on success

#### **User Flow:**
1. User clicks red delete icon (🗑️) on a flow row
2. Confirmation dialog appears:
   - Shows flow name
   - Warns about permanent deletion
   - Cancel / Delete buttons
3. User clicks "Delete"
   - Button shows "Deleting..." with spinner
   - API request sent
4. On success:
   - Flow removed from list immediately
   - Dialog closes
5. On error:
   - Alert shown with error message
   - Dialog remains open

---

### **2. Status Filter**

#### **UI Changes:**
- ✅ Added **toggle button group** above the table:
  - **All (9)** - Shows all flows
  - **Draft (6)** - Shows only draft flows
  - **Published (3)** - Shows only published flows
- ✅ Counts update dynamically based on actual flow statuses
- ✅ Selected filter is highlighted
- ✅ Empty state shown when filter returns no results

#### **Filter Logic:**
```typescript
const filteredFlows = flows.filter((flow) => {
  if (statusFilter === 'ALL') return true;
  return flow.status === statusFilter;
});
```

#### **Empty State:**
When a filter returns no results:
```
┌─────────────────────────────┐
│                             │
│   No draft flows            │
│                             │
└─────────────────────────────┘
```

#### **Flow Count:**
Updates to show filtered count:
- "9 flows" (when All is selected)
- "6 flows" (when Draft is selected and shows 6)
- "3 flows" (when Published is selected and shows 3)

---

## Actions Column (Final State)

Each row now has 5-6 action buttons:

1. **✏️ Edit** - Opens draft for editing (always visible)
2. **👁️ View** - Views published version (only if published)
3. **📋 Duplicate** - Duplicates flow (disabled for now)
4. **📤 Publish** - Publishes draft (only for drafts, disabled for now)
5. **📥 Unpublish** - Unpublishes flow (only for published, disabled for now)
6. **🗑️ Delete** - Deletes flow (always visible, functional ✅)

---

## Files Modified

### **1. `packages/kx-axis-fe/src/components/FlowsList/FlowsList.tsx`**

**Imports Added:**
- `Dialog`, `DialogTitle`, `DialogContent`, `DialogContentText`, `DialogActions`
- `ToggleButtonGroup`, `ToggleButton`
- `DeleteIcon`

**State Added:**
```typescript
const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [flowToDelete, setFlowToDelete] = useState<FlowListItem | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
```

**Functions Added:**
- `handleDeleteClick(flow)` - Opens delete confirmation dialog
- `handleDeleteConfirm()` - Executes deletion and updates state
- `handleDeleteCancel()` - Closes dialog without deleting
- `filteredFlows` computed value - Filters flows by status

**UI Components Added:**
- Status filter toggle button group
- Delete confirmation dialog
- Delete button in actions column
- Empty state for filtered results

**Changes:**
- Flow count now uses `filteredFlows.length` instead of `flows.length`
- Table uses `filteredFlows.map()` instead of `flows.map()`
- Added conditional empty state for filtered results

---

### **2. `packages/kx-axis-fe/src/api/flowClient.ts`**

**Method Added:**
```typescript
async deleteFlow(flowId: string): Promise<void>
```

Calls `DELETE /agent/flows?flowId={flowId}` and handles the response.

---

## Backend Requirements

### **DELETE Endpoint (if not implemented yet):**

```typescript
DELETE /agent/flows?flowId={flowId}

Headers:
  - x-service-key or Authorization: Bearer <jwt>
  - x-tenant-id: <tenantId>

Response:
  - 204 No Content (success)
  - 404 Not Found (flow doesn't exist)
  - 403 Forbidden (no permission)
  - 401 Unauthorized (not authenticated)
```

**DynamoDB Operations:**
1. Query for all items with `PK = TENANT#xxx` and `SK` begins with `FLOW#xxx`
2. Delete all items (flow metadata, draft, versions)
3. Return 204 on success

---

## Testing Checklist

### **Delete Flow:**
- [ ] Click delete button on a flow
- [ ] Verify confirmation dialog appears with correct flow name
- [ ] Click "Cancel" → dialog closes, flow still in list
- [ ] Click delete again
- [ ] Click "Delete" → button shows "Deleting...", spinner appears
- [ ] Verify flow disappears from list after successful deletion
- [ ] Verify flow count updates
- [ ] Test error handling (disconnect network, click delete)

### **Status Filter:**
- [ ] Verify "All" is selected by default
- [ ] Verify counts are correct: All (9), Draft (6), Published (3)
- [ ] Click "Draft" → only draft flows visible
- [ ] Click "Published" → only published flows visible
- [ ] Click "All" → all flows visible again
- [ ] Delete a draft flow → verify Draft count decrements
- [ ] Delete a published flow → verify Published count decrements
- [ ] Filter to Draft, delete last draft → verify empty state appears

### **Edge Cases:**
- [ ] Delete the only flow → verify empty state appears
- [ ] Delete while filtered → flow disappears, list updates correctly
- [ ] Rapid clicks on delete (should not cause duplicate deletes)
- [ ] Delete with slow network (should show loading state)

---

## User Experience

### **Before:**
- ❌ No way to delete flows (had to manually delete from DB)
- ❌ All flows shown together (no filtering)
- ❌ Hard to manage large lists of flows

### **After:**
- ✅ One-click delete with confirmation
- ✅ Clear warning about permanent deletion
- ✅ Filter by status (All/Draft/Published)
- ✅ Counts update dynamically
- ✅ Empty states for filtered views
- ✅ Immediate UI feedback after deletion

---

## Future Enhancements

### **Delete:**
- Add bulk delete (select multiple flows)
- Add "soft delete" with recovery period (trash bin)
- Add delete confirmation checkbox ("I understand this is permanent")
- Add audit log of deletions

### **Filtering:**
- Add search by name/description
- Add filter by industry
- Add sort by name/date/status
- Add "Recently deleted" view (if soft delete implemented)
- Add saved filter preferences (localStorage)

---

## Notes

- Delete is **permanent** and cannot be undone
- All versions (draft + published) are deleted together
- Status filter is client-side (all flows loaded, then filtered)
- For large lists, consider server-side filtering in the future
- Delete button uses `color="error"` for visual distinction

