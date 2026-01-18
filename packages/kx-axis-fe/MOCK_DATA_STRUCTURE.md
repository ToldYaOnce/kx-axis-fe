# Enhanced Mock Data for Execution Mode

## ✅ **UPDATED: Complex Mock Data with Multiple Fork Points**

The simulator fixtures now include **rich, multi-level branching** to demonstrate true hierarchical tree structures.

---

## 🌳 **Fitness Scenario Structure**

### **Visual Tree**

```
Main
  T1  🤖 "Hey! Ready to crush some goals?" (DIVERGENCE: 3 paths)
     ├─ Main Path: Cardio/Running
     │  ├─ T2  👤 "I want to improve my cardio and run a 5K"
     │  ├─ T3  🤖 "Awesome! Running a 5K is a great goal..."
     │  ├─ T4  👤 "I used to run in high school but took a long break"
     │  └─ T5  🤖 "Perfect! Getting back into running is easier..."
     │
     ├─ Path 2: Strength Training
     │  ├─ T2  👤 "I want to bench 300 lbs"
     │  ├─ T3  🤖 "Nice! 300 on bench is solid..."
     │  ├─ T4  👤 "Currently at 225, been stuck for a few months" (DIVERGENCE: 2 paths)
     │  │     ├─ Main: Normal Timeline
     │  │     │  ├─ T5  🤖 "That's a 75lb jump - ambitious!..."
     │  │     │  ├─ T6  👤 "Just doing my own thing, 3x a week"
     │  │     │  └─ T7  🤖 "Got it. A structured program will be key..."
     │  │     │
     │  │     └─ Alt: Urgent Timeline
     │  │        ├─ T5  👤 "I need to hit 300 in 6 weeks for a competition"
     │  │        ├─ T6  🤖 "Whoa - 6 weeks is really tight..."
     │  │        ├─ T7  👤 "The comp is locked in, I have to try"
     │  │        └─ T8  🤖 "Alright, I respect the commitment..."
     │
     └─ Path 3: Weight Loss
        ├─ T2  👤 "I need to lose 30 pounds"
        ├─ T3  🤖 "Okay, 30 pounds is definitely achievable..."
        ├─ T4  👤 "Health reasons - my doctor recommended it"
        └─ T5  🤖 "That's important. Health-driven goals tend to stick..."
```

---

## 📊 **Node Counts**

- **Total Nodes:** 21
- **Total Branches:** 4
- **Divergence Points:** 2 (T1 with 3 paths, T4 in strength branch with 2 paths)
- **Maximum Depth:** 8 turns (urgent timeline branch)
- **Unique Conversation Paths:** 4

---

## 🔍 **Key Features Demonstrated**

### **1. Multi-Way Divergence (3 paths from T1)**
```
node-001 (T1) has 3 children:
  - node-002 (cardio/running)
  - node-101 (strength)
  - node-201 (weight loss)
```

**Tests:**
- ✅ Tree shows "3 paths" badge
- ✅ Visual connectors (├─, ├─, └─)
- ✅ Each path has distinct conversation

---

### **2. Nested Divergence (2 paths from T4 in strength branch)**
```
node-103 (T4 in strength branch) has 2 children:
  - node-104 (normal timeline continuation)
  - node-301 (urgent timeline)
```

**Tests:**
- ✅ Divergence within a branch
- ✅ Proper indentation (depth 2)
- ✅ Shows nested "2 paths" badge
- ✅ Ancestry filtering works correctly

---

### **3. Varying Path Depths**

**Main Path (Cardio):** 5 turns total  
**Strength (Normal):** 7 turns total  
**Strength (Urgent):** 8 turns total  
**Weight Loss:** 5 turns total  

**Tests:**
- ✅ Different end points per path
- ✅ Leaf detection works at different depths
- ✅ Composer enabled/disabled correctly

---

### **4. Realistic Conversation Flow**

Each path demonstrates a different use case:

**Cardio Path:**
- User has past experience
- Agent asks about history
- Builds progressive plan
- Explores timeline

**Strength Path (Normal):**
- Ambitious goal
- Current plateau
- Discusses program structure
- Sets realistic expectations

**Strength Path (Urgent):**
- Time-constrained competition
- Aggressive timeline
- Reality check from agent
- Compromise on expectations

**Weight Loss Path:**
- Health-driven motivation
- Doctor recommendation
- Focus on sustainability

---

## 🏗️ **Data Structure**

### **Branches**

```typescript
branches: [
  {
    branchId: 'branch-main',
    parentBranchId: null,
    forkFromNodeId: null,
    label: 'Main',
  },
  {
    branchId: 'branch-strength',
    parentBranchId: 'branch-main',
    forkFromNodeId: 'node-001',  // First divergence
    label: 'Alt: Strength Goal',
  },
  {
    branchId: 'branch-weight-loss',
    parentBranchId: 'branch-main',
    forkFromNodeId: 'node-001',  // First divergence
    label: 'Alt: Weight Loss Goal',
  },
  {
    branchId: 'branch-urgent',
    parentBranchId: 'branch-strength',  // Nested!
    forkFromNodeId: 'node-103',  // Second divergence
    label: 'Alt: Urgent Timeline',
  },
]
```

---

### **Parent-Child Relationships**

**Main Path (Cardio):**
```
node-001 (parent: null)
  └─ node-002 (parent: node-001)
       └─ node-003 (parent: node-002)
            └─ node-004 (parent: node-003)
                 └─ node-005 (parent: node-004)
```

**Strength Path (Normal):**
```
node-001 (parent: null) [shared root]
  └─ node-101 (parent: node-001)
       └─ node-102 (parent: node-101)
            └─ node-103 (parent: node-102)
                 └─ node-104 (parent: node-103)
                      └─ node-105 (parent: node-104)
                           └─ node-106 (parent: node-105)
```

**Strength Path (Urgent):**
```
node-001 (parent: null) [shared root]
  └─ node-101 (parent: node-001) [shared]
       └─ node-102 (parent: node-101) [shared]
            └─ node-103 (parent: node-102) [shared]
                 └─ node-301 (parent: node-103) [diverges here]
                      └─ node-302 (parent: node-301)
                           └─ node-303 (parent: node-302)
                                └─ node-304 (parent: node-303)
```

---

## 🎯 **Testing Scenarios**

### **Test 1: Multi-Way Divergence**
1. Load simulator
2. Click T1 in tree
3. **Verify:**
   - ✅ "3 paths" badge appears
   - ✅ Three connectors visible
   - ✅ All three alternate paths labeled correctly

---

### **Test 2: Nested Divergence**
1. Expand strength branch
2. Navigate to T4 (node-103)
3. **Verify:**
   - ✅ "2 paths" badge on T4
   - ✅ Proper indentation (depth 2)
   - ✅ Both continuations visible

---

### **Test 3: Path Selection**
1. Click node-105 (strength normal, T6)
2. **Verify playback shows:**
   - ✅ T1: Agent greeting
   - ✅ T2: "I want to bench 300 lbs"
   - ✅ T3: Agent response
   - ✅ T4: "Currently at 225..."
   - ✅ T5: Agent offers plan
   - ✅ T6: "Just doing my own thing"
   - ❌ **NOT** T5-T8 from urgent branch

---

### **Test 4: Deep Path Selection**
1. Click node-304 (strength urgent, T8)
2. **Verify playback shows:**
   - ✅ T1-T4: Shared history
   - ✅ T5: "I need to hit 300 in 6 weeks..." (urgent)
   - ✅ T6-T8: Urgent timeline conversation
   - ❌ **NOT** normal timeline T5-T7

---

### **Test 5: Forking from Different Depths**
1. Select node-003 (cardio path, T3)
2. Click fork icon
3. Type alternate reply: "Actually, do you also do nutrition coaching?"
4. Submit
5. **Verify:**
   - ✅ New branch created
   - ✅ Divergence point at T3
   - ✅ Proper ancestry maintained

---

## 🛠️ **Helper Function**

```typescript
const createMockNode = (
  nodeId: string,
  parentNodeId: string | null,
  branchId: string,
  turnNumber: number,
  userMessage?: string,
  agentMessage?: string,
  timestamp: string = '2026-01-12T10:00:00Z'
): SimulationNode => { ... }
```

**Purpose:** Reduces boilerplate when creating mock nodes

**Usage:**
```typescript
createMockNode('node-001', null, 'branch-main', 1, undefined, 
  'Hey! Ready to crush some goals?')
```

---

## 📈 **Benefits**

✅ **Realistic Complexity:** Demonstrates real-world branching scenarios  
✅ **Multiple Depths:** Shows tree at different nesting levels  
✅ **Easy Testing:** Multiple test cases in one scenario  
✅ **Clear Structure:** Parent-child relationships explicit  
✅ **Variety:** Different conversation types (goals, constraints, timelines)  

---

## 🚀 **Next Steps for More Complexity**

Want even more depth? Add:

1. **Triple-nested divergence:** Fork from node-304 (urgent path)
2. **More siblings:** Add 4-5 paths from T1
3. **Cross-branch references:** Show dependencies between branches
4. **Error states:** Add DRIFTED/INVALID nodes
5. **Longer conversations:** Extend paths to 10-15 turns

---

**Implementation Status:** ✅ Complete  
**Date:** 2026-01-12  
**Total Mock Nodes:** 21  
**Divergence Points:** 2  
**Maximum Depth:** 8 turns



