import type { ConversationFlow } from '../types';

/**
 * Example Fitness Onboarding Flow
 * 
 * Demonstrates:
 * - Goal Lens selection
 * - Adaptive baseline capture
 * - Deadline enforcement
 * - Lane-based eligibility
 */

export const fitnessOnboardingFlow: ConversationFlow = {
  id: 'fitness-onboarding-v2',
  name: 'Fitness Onboarding (Goal-Driven)',
  description: 'Adaptive conversation flow that adjusts based on selected goal lens',
  
  activeGoalLenses: [
    {
      lensId: 'BODY_COMPOSITION',
      required: false,
      usageLabel: 'For weight/body fat transformation goals',
    },
    {
      lensId: 'STRENGTH_PR',
      required: false,
      usageLabel: 'For strength personal records',
    },
    {
      lensId: 'PERFORMANCE',
      required: false,
      usageLabel: 'For athletic performance goals',
    },
  ],
  
  nodes: [
    // ========== BEFORE CONTACT ==========
    
    {
      id: 'welcome',
      kind: 'EXPLANATION',
      title: 'Welcome & Introduction',
      purpose: 'Greet prospect and explain what we do',
      ui: {
        x: 0,
        y: 0,
        lane: 'BEFORE_CONTACT',
      },
      priority: {
        baseRank: 95,
        capRank: 100,
      },
      execution: {
        speechAct: 'inform',
        allowPrefix: false,
      },
    },
    
    {
      id: 'goal-definition',
      kind: 'GOAL_DEFINITION',
      title: 'Define Goal',
      purpose: 'Capture which type of goal they want to achieve',
      ui: {
        x: 0,
        y: 0,
        lane: 'BEFORE_CONTACT',
      },
      satisfies: {
        states: ['GOAL_SET'],  // This unlocks goal-dependent nodes
        metrics: [],
        gates: [],
      },
      priority: {
        baseRank: 90,
      },
      execution: {
        speechAct: 'request',
        allowPrefix: true,
      },
    },
    
    {
      id: 'reflective-readiness',
      kind: 'REFLECTIVE_QUESTION',
      title: 'Readiness Check',
      purpose: 'Ask them to reflect on their commitment',
      requires: ['goal-definition'],  // Can only run after goal is set
      ui: {
        x: 0,
        y: 0,
        lane: 'BEFORE_CONTACT',
      },
      eligibility: {
        requiresGoalSet: true,
      },
      priority: {
        baseRank: 85,
      },
      execution: {
        speechAct: 'request',
        allowPrefix: true,
      },
    },
    
    // ========== CONTACT GATE ==========
    
    {
      id: 'capture-contact',
      kind: 'BASELINE_CAPTURE',
      title: 'Capture Contact Info',
      purpose: 'Get email/phone for booking and follow-up',
      ui: {
        x: 0,
        y: 0,
        lane: 'CONTACT_GATE',
      },
      satisfies: {
        gates: ['CONTACT'],
        metrics: ['contact_email', 'contact_phone'],
        states: [],
      },
      priority: {
        baseRank: 80,
      },
      execution: {
        speechAct: 'request',
        allowPrefix: false,
      },
    },
    
    // ========== AFTER CONTACT ==========
    
    {
      id: 'baseline-capture-adaptive',
      kind: 'BASELINE_CAPTURE',
      title: 'Adaptive Baseline Capture',
      purpose: 'Capture baseline metrics based on selected goal lens',
      requires: ['CONTACT', 'goal-definition'],
      ui: {
        x: 0,
        y: 0,
        lane: 'AFTER_CONTACT',
      },
      // THIS NODE ADAPTS TO GOAL LENS
      // If goal = BODY_COMPOSITION: asks current_weight, current_bodyfat
      // If goal = STRENGTH_PR: asks lift_type, current_lift_value, lift_context
      // If goal = PERFORMANCE: asks performance_metric, current_performance
      goalLensId: 'ADAPTIVE',  // Special ID meaning "adapt to selected lens"
      satisfies: {
        states: ['BASELINE_CAPTURED'],
        metrics: [], // Populated dynamically based on goal
        gates: [],
      },
      eligibility: {
        requiresGoalSet: true,
      },
      priority: {
        baseRank: 75,
      },
      execution: {
        speechAct: 'request',
        allowPrefix: true,
      },
    },
    
    {
      id: 'target-capture-adaptive',
      kind: 'BASELINE_CAPTURE',
      title: 'Adaptive Target Capture',
      purpose: 'Capture target metrics based on selected goal lens',
      requires: ['CONTACT', 'baseline-capture-adaptive'],
      ui: {
        x: 0,
        y: 0,
        lane: 'AFTER_CONTACT',
      },
      goalLensId: 'ADAPTIVE',
      satisfies: {
        states: ['TARGET_CAPTURED'],
        metrics: [],
        gates: [],
      },
      eligibility: {
        requiresGoalSet: true,
      },
      priority: {
        baseRank: 70,
      },
      execution: {
        speechAct: 'request',
        allowPrefix: true,
      },
    },
    
    {
      id: 'deadline-capture',
      kind: 'DEADLINE_CAPTURE',
      title: 'Capture Deadline',
      purpose: 'Get deadline per goal lens policy',
      requires: ['CONTACT', 'target-capture-adaptive'],
      ui: {
        x: 0,
        y: 0,
        lane: 'AFTER_CONTACT',
      },
      // Deadline enforcement based on goal lens
      deadlineEnforcement: {
        policy: 'EXACT_DATE',  // Default, but adapts to goal lens
        narrowingStrategy: 'FOLLOW_UP',  // If they say "3 months", follow up for specific date
      },
      satisfies: {
        states: ['DEADLINE_CAPTURED'],
        metrics: ['goal_deadline'],
        gates: [],
      },
      eligibility: {
        requiresGoalSet: true,
      },
      priority: {
        baseRank: 65,
      },
      execution: {
        speechAct: 'request',
        allowPrefix: true,
      },
    },
    
    {
      id: 'explain-approach',
      kind: 'EXPLANATION',
      title: 'Explain Our Approach',
      purpose: 'Describe coaching methodology based on their goal',
      requires: ['CONTACT', 'deadline-capture'],
      ui: {
        x: 0,
        y: 0,
        lane: 'AFTER_CONTACT',
      },
      eligibility: {
        requiresGoalSet: true,
      },
      priority: {
        baseRank: 60,
      },
      execution: {
        speechAct: 'inform',
        allowPrefix: true,
      },
    },
    
    {
      id: 'book-consultation',
      kind: 'ACTION_BOOKING',
      title: 'Book Initial Consultation',
      purpose: 'Schedule consultation call',
      requires: ['CONTACT'],
      ui: {
        x: 0,
        y: 0,
        lane: 'AFTER_CONTACT',
      },
      satisfies: {
        gates: ['BOOKING'],
        metrics: ['consultation_date'],
        states: [],
      },
      priority: {
        baseRank: 85,
      },
      execution: {
        speechAct: 'request',
        allowPrefix: false,
      },
    },
    
    // ========== AFTER BOOKING ==========
    
    {
      id: 'send-promo',
      kind: 'EXPLANATION',
      title: 'Send Promo Code',
      purpose: 'Provide exclusive discount for booked clients',
      requires: ['BOOKING'],
      ui: {
        x: 0,
        y: 0,
        lane: 'AFTER_BOOKING',
      },
      priority: {
        baseRank: 55,
      },
      execution: {
        speechAct: 'inform',
        allowPrefix: true,
      },
    },
    
    {
      id: 'handoff-trainer',
      kind: 'HANDOFF',
      title: 'Handoff to Trainer',
      purpose: 'Transfer to human trainer for personalized planning',
      requires: ['BOOKING'],
      ui: {
        x: 0,
        y: 0,
        lane: 'AFTER_BOOKING',
      },
      satisfies: {
        gates: ['HANDOFF'],
        metrics: [],
        states: ['HANDOFF_COMPLETE'],
      },
      priority: {
        baseRank: 50,
      },
      execution: {
        speechAct: 'inform',
        allowPrefix: true,
      },
    },
  ],
  
  metadata: {
    version: '2.0.0',
    industry: 'Fitness',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

/**
 * Example output for STRENGTH_PR goal lens
 */
export const strengthPRExample = {
  goalLens: 'STRENGTH_PR',
  baseline_questions_asked: [
    'Which lift are you focusing on?',
    'What\'s your current max for that lift?',
    'How long have you been training for this?',
  ],
  target_questions_asked: [
    'What\'s your target max?',
  ],
  deadline_policy: 'EXACT_DATE',
  deadline_narrowing: 'If user says "in 3 months", follow up with: "What specific date are you targeting?"',
};

/**
 * Example output for BODY_COMPOSITION goal lens
 */
export const bodyCompositionExample = {
  goalLens: 'BODY_COMPOSITION',
  baseline_questions_asked: [
    'What\'s your current weight?',
    '(Optional) What\'s your current body fat percentage?',
  ],
  target_questions_asked: [
    'What\'s your target weight?',
    '(Optional) What\'s your target body fat percentage?',
  ],
  deadline_policy: 'RANGE_OK',
  deadline_narrowing: 'Can accept "by summer" or "in 3 months" without follow-up',
};


