# KxAxis Composer - UI Visual Guide

## Main Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  📊 Fitness Onboarding Flow                    [Simulate] [Validate]  [Publish]     │
├──────────────────┬──────────────────────────────────────────────────┬───────────────┤
│                  │                                                  │               │
│  Available       │                  CANVAS AREA                     │   INSPECTOR   │
│  Captures        │                  ═══════════                     │   ═════════   │
│  ────────────    │                                                  │               │
│  📋 9 captures   │  ┌─────────────────────────────────────────┐    │  Context:     │
│  from Fitness    │  │  GATED PATH                             │    │  SELECTED     │
│  registry:       │  │  ───────────                            │    │               │
│                  │  │  (vertical flow with dependencies)      │    │  📝 Node      │
│  • Current       │  │                                         │    │  Details      │
│    Weight        │  └─────────────────────────────────────────┘    │               │
│  • Current       │                                                  │  Title:       │
│    Body Fat %    │  ┌─────────────────────────────────────────┐    │  [............]│
│  • Target        │  │  FREEFORM POOL                          │    │               │
│    Weight        │  │  ──────────────                         │    │  Kind:        │
│  • Target        │  │  (floating cards, minimal connections)  │    │  [Dropdown ▼] │
│    Body Fat %    │  │                                         │    │               │
│  • Goal          │  │  ┌──────────┐  ┌──────────┐           │    │  Purpose:     │
│    Timeline      │  │  │ Welcome  │  │ Capture  │           │    │  [............]│
│  • [+5 more]     │  │  │ & Intro  │  │ Current  │           │    │  [............]│
│                  │  │  │          │  │ Stats    │           │    │               │
│  ════════════    │  │  │ 💬 EXPL  │  │ 📊 DATA  │           │    │  ────────────  │
│                  │  │  └──────────┘  └──────────┘           │    │               │
│  Capturing       │  │                                         │    │  Eligibility  │
│  ──────────      │  │  ┌──────────┐  ┌──────────┐           │    │  Channels:    │
│  ✓ 4 active      │  │  │ Capture  │  │ Explain  │           │    │  • SMS        │
│  in this flow:   │  │  │ Goals    │  │ Approach │           │    │  • Web Chat   │
│                  │  │  │          │  │          │           │    │               │
│  ✓ Current       │  │  │ 📊 DATA  │  │ 💬 EXPL  │           │    │  Priority     │
│    Weight        │  │  └──────────┘  └──────────┘           │    │  Base: ▬▬●───  │
│    [Required]    │  │                                         │    │  Cap:  ▬▬▬▬●  │
│    [80%]         │  │  ┌──────────┐  ┌──────────┐           │    │               │
│                  │  │  │ Commit-  │  │ Book     │           │    │  Execution    │
│  • Target        │  │  │ ment     │  │ Consult  │           │    │  Speech Act:  │
│    Weight        │  │  │ Check    │  │          │           │    │  [............]│
│    [Required]    │  │  │          │  │          │           │    │               │
│    [85%]         │  │  │ ❓ REFL  │  │ 📅 BOOK  │           │    │  [x] Allow    │
│                  │  │  └──────────┘  └──────────┘           │    │      Prefix   │
│  • Goal          │  │                                         │    │               │
│    Timeline      │  │  ┌──────────┐                          │    │               │
│    [Required]    │  │  │ Handoff  │                          │    │  [🗑️ Delete]  │
│    [75%]         │  │  │ to       │                          │    │               │
│                  │  │  │ Trainer  │                          │    │               │
│  • Current       │  │  │          │                          │    │               │
│    Body Fat %    │  │  │ 🤝 HAND  │                          │    │               │
│    [Optional]    │  │  └──────────┘                          │    │               │
│    [70%]         │  │                                         │    │               │
│                  │  └─────────────────────────────────────────┘    │               │
│  [Click to add → │                                                  │               │
│   from available]│  [+ Add Node]        Zoom: 100%                 │               │
│                  │                                                  │               │
└──────────────────┴──────────────────────────────────────────────────┴───────────────┘
```

## Component Breakdown

### 1. Top Bar
```
┌────────────────────────────────────────────────────────────────┐
│ 📊 Flow Name │ Description        [Simulate] [Validate] | [Publish] │
└────────────────────────────────────────────────────────────────┘
```

- **Left**: Flow title and description
- **Right**: Action buttons
  - Simulate: Opens simulation panel
  - Validate: Runs validation (mock)
  - Publish: Triggers publish callback

### 2. Left Panel - Captures
```
┌─────────────────┐
│ Capturing (4)   │  ← Active captures in this flow
├─────────────────┤
│ ✓ Current Weight│  ← Click to configure
│   [Required]    │
│   [80%]         │
├─────────────────┤
│ • Target Weight │
│   [Required]    │
│   [85%]         │
├─────────────────┤
│     ...         │
└─────────────────┘
│                 │
├─────────────────┤
│ Available (5)   │  ← From industry registry
├─────────────────┤
│ Training Exp [+]│  ← Click + to add
├─────────────────┤
│ Dietary Rest [+]│
├─────────────────┤
│     ...         │
└─────────────────┘
```

### 3. Canvas - Node Card
```
┌──────────────────────┐
│ 📊 DATA CAPTURE      │  ← Icon + Kind
├──────────────────────┤
│ Capture Current Stats│  ← Title (clear, concise)
│                      │
│ [Requires 0]         │  ← Only if prerequisites exist
│ [Satisfies 2]        │  ← Only if captures exist
└──────────────────────┘
     (Click to edit)
```

**Node States:**
- Normal: 1px gray border
- Hover: Colored border (by kind)
- Selected: 2px colored border + shadow

**Node Colors:**
- 🔵 DATA_CAPTURE: Blue
- 🟣 ACTION_BOOKING: Purple
- 🟢 EXPLANATION: Green
- 🟠 REFLECTIVE_QUESTION: Orange
- 🔴 HANDOFF: Red

### 4. Inspector Panel (Context-Sensitive)

**When Node Selected:**
```
┌─────────────────┐
│ Node Details 🗑️ │
├─────────────────┤
│ Title:          │
│ [............]  │
│                 │
│ Kind:           │
│ [Dropdown ▼]    │
│                 │
│ Purpose:        │
│ [............]  │
│ [............]  │
│                 │
│ ───────────     │
│ Eligibility     │
│ [x] Req Contact │
│ Channels: ...   │
│                 │
│ ───────────     │
│ Priority        │
│ Base: ●─────    │
│ Cap:  ─────●    │
│                 │
│ ───────────     │
│ Execution       │
│ Speech Act:     │
│ [............]  │
│ [x] Allow Prefix│
└─────────────────┘
```

**When Capture Selected:**
```
┌─────────────────┐
│ Capture Details │
├─────────────────┤
│ Current Weight  │  ← Name (read-only)
│ Description...  │
│                 │
│ [number][Fitness]│  ← Chips
│                 │
│ ───────────     │
│ Configuration   │
│ [x] Required    │
│                 │
│ Confidence: 80% │
│ ●───────────    │  ← Slider
│                 │
│ Usage Label:    │
│ [............]  │
│                 │
│ ───────────     │
│ Usage in Flow   │
│ Satisfied by:   │
│ [Node 1][Node 2]│
└─────────────────┘
```

**When Nothing Selected:**
```
┌─────────────────┐
│ Flow Overview   │
├─────────────────┤
│ Total Nodes: 7  │
│ Active Caps: 4  │
│ Required: 3     │
│                 │
│ ───────────     │
│ Node Types      │
│ [DATA: 2]       │
│ [EXPL: 2]       │
│ [BOOK: 1]       │
│ ...             │
│                 │
│ ───────────     │
│ Active Captures │
│ • Current Weight│
│   [Required][80%]│
│ • Target Weight │
│   [Required][85%]│
│ ...             │
└─────────────────┘
```

### 5. Simulate Panel (Drawer)
```
┌─────────────────────────────┐
│ Simulate Flow          [x]  │
├─────────────────────────────┤
│ Scenario Inputs             │
│                             │
│ Channel: [SMS ▼]            │
│ Lead State: [New ▼]         │
│ Vulnerability: ●─────── 50% │
│ [x] Contact Captured        │
│                             │
│ [▶️ Run Simulation]          │
│                             │
│ ─────────────────           │
│ Simulation Results          │
│                             │
│ Eligible Nodes (3):         │
│ [Intro][Capture][Goals]     │
│                             │
│ Selected Node:              │
│ ✓ Welcome & Introduction    │
│                             │
│ Example Message:            │
│ "Hi! I'm your fitness..."   │
└─────────────────────────────┘
```

## Interaction Flows

### Add and Configure a Node
1. Click **[+ Add Node]** on canvas
2. New node appears at random position
3. Inspector automatically switches to node details
4. Edit title, kind, purpose, etc.
5. Click canvas to deselect

### Add and Configure a Capture
1. Find capture in "Available Captures"
2. Click **[+]** button next to it
3. Capture moves to "Capturing" list
4. Click the capture in "Capturing"
5. Inspector switches to capture details
6. Toggle required, adjust confidence, add label

### Link Capture to Node
1. Select node in canvas
2. Scroll to "Dependencies" section in Inspector
3. See "Satisfies" chips (shows which captures)
4. To add: manually edit (or use advanced linking UI)

### Simulate a Flow
1. Click **[Simulate]** in top bar
2. Drawer opens from right
3. Set scenario parameters
4. Click **[▶️ Run Simulation]**
5. View eligible nodes and selected node
6. See example generated message
7. Close drawer when done

### Validate and Publish
1. Click **[Validate]** → Shows alert (mock)
2. Click **[Publish]** → Triggers callback with flow config

## Design Language

### Colors
- **Background**: #FAFAFA (light gray)
- **Paper**: #FFFFFF (white)
- **Text Primary**: #212121 (dark gray)
- **Text Secondary**: #757575 (medium gray)
- **Divider**: #E0E0E0 (light gray)
- **Accents**: Node-specific colors

### Typography
- **Font**: Inter, Roboto, Helvetica, Arial
- **Headings**: Medium weight (500)
- **Body**: Regular (400)
- **Captions**: Uppercase, tracked

### Spacing
- **Small**: 8px
- **Medium**: 16px
- **Large**: 24px
- **XLarge**: 32px

### Elevation
- **Flat**: No shadow (default)
- **Raised**: 1-2px shadow (cards)
- **Floating**: 4-8px shadow (dialogs)

### Borders
- **Subtle**: 1px solid divider color
- **Emphasis**: 2px solid accent color
- **Dashed**: 2px dashed for zones

## Responsive Behavior

**Fixed Layout:**
- Designed for desktop/tablet
- Minimum width: 1280px recommended
- Top bar: Fixed height 64px
- Left panel: Fixed width 320px
- Right panel: Fixed width 360px
- Canvas: Fills remaining space

**Not Mobile-Optimized:**
- This is a power-user tool
- Meant for desktop workflows
- Mobile support could be added later

## Accessibility

- All buttons have labels
- Color is not the only indicator
- Focus states on interactive elements
- Keyboard navigation (basic MUI support)

## Performance

- Lightweight components
- No heavy animations
- Efficient re-renders (React context)
- Handles 50+ nodes comfortably

---

This UI is designed to be **calm, clear, and uncluttering**. Every piece of information has its place, and nothing is shown inline that doesn't need to be.


