import type { ConversationFlow } from '../types';

/**
 * Demo flow showcasing GOAL_GAP_TRACKER
 * Delta-first philosophy: Target → Baseline → Delta → Category
 */
export const goalGapDemoFlow: ConversationFlow = {
  id: 'demo-conversation-flow',
  name: 'Sample Conversation Flow',
  description: 'A sample flow demonstrating conversation items and requirements',
  industry: 'Fitness & Wellness',
  
  // ========== EXECUTION METADATA (for deterministic controller) ==========
  entryNodeIds: ['welcome-1'],
  
  primaryGoal: {
    type: 'GATE',
    gate: 'BOOKING',
    description: 'User has booked a consultation',
  },
  
  gateDefinitions: {
    CONTACT: {
      satisfiedBy: {
        metricsAny: ['contact_email', 'contact_phone'], // email OR phone
      },
    },
    BOOKING: {
      satisfiedBy: {
        metricsAll: ['booking_date', 'booking_type'], // must have booking date AND type
      },
    },
    HANDOFF: {
      satisfiedBy: {
        statesAll: ['HANDOFF_COMPLETE'], // marked complete
      },
    },
  },
  
  factAliases: {
    target: 'goal_target',
    baseline: 'goal_baseline',
    delta: 'goal_delta',
    category: 'goal_category',
    email: 'contact_email',
    phone: 'contact_phone',
  },
  
  defaults: {
    retryPolicy: {
      maxAttempts: 2,
      onExhaust: 'BROADEN',
      cooldownTurns: 0,
      promptVariantStrategy: 'ROTATE',
    },
  },
  
  _semantics: {
    retryPolicy: 'RetryPolicy counts attempts to achieve a node\'s objective across turns. Attempts may re-ask/rephrase the node prompt without re-executing side effects. runPolicy.maxExecutions remains the hard cap for executing the node.',
  },
  // ========================================================================
  
  nodes: [
    // 1. Welcome - BEFORE CONTACT
    {
      id: 'welcome-1',
      type: 'EXPLANATION',
      title: 'Welcome / Introduction',
      purpose: 'Greet the user and set expectations',
      produces: ['WELCOME_SHOWN'], // completion marker
      ui: {
        x: 100,
        y: 50,
        lane: 'BEFORE_CONTACT',
      },
      importance: 'high',
      runPolicy: { maxExecutions: 1 },
    },

    // 2. Reflective Question - BEFORE CONTACT
    {
      id: 'reflect-1',
      type: 'REFLECTIVE_QUESTION',
      title: 'Reflective Question',
      purpose: 'Gauge readiness and motivation level',
      produces: ['REFLECTION_COMPLETE'], // completion marker
      ui: {
        x: 100,
        y: 180,
        lane: 'BEFORE_CONTACT',
      },
      importance: 'normal',
      runPolicy: { maxExecutions: 1 },
    },

    // 3. GOAL_GAP_TRACKER - BEFORE CONTACT (the star of the show!)
    {
      id: 'goal-gap-1',
      type: 'GOAL_GAP_TRACKER',
      title: 'Goal Gap Tracker',
      purpose: 'Capture target, baseline, compute delta, classify category',
      produces: ['target', 'baseline', 'delta', 'category'],
      ui: {
        x: 100,
        y: 310,
        lane: 'BEFORE_CONTACT',
      },
      goalGapTracker: {
        targetLabel: "What's the exact outcome you want to achieve?",
        baselineLabel: "Where are you at right now with that?",
        showExamples: true,
        examples: [
          "run 3 miles in 21 minutes",
          "bench press 300 lbs",
          "lose 15 pounds",
          "do 50 pushups without stopping",
          "hold plank for 3 minutes",
        ],
        computeMode: 'AUTO',
        askClarifierIfIncomparable: true,
        deadlinePolicyDefault: 'EXACT_DATE',
        categories: [
          {
            id: 'strength-pr',
            name: 'Strength PR',
            deadlinePolicyOverride: 'EXACT_DATE',
          },
          {
            id: 'endurance',
            name: 'Endurance / Pace',
            deadlinePolicyOverride: 'EXACT_DATE',
          },
          {
            id: 'body-comp',
            name: 'Body Composition',
            deadlinePolicyOverride: 'RANGE_OK',
          },
          {
            id: 'consistency',
            name: 'Consistency / Routine',
            deadlinePolicyOverride: 'DURATION_OK',
          },
          {
            id: 'mobility',
            name: 'Mobility / Pain',
            deadlinePolicyOverride: 'RANGE_OK',
          },
          {
            id: 'other',
            name: 'Other',
            deadlinePolicyOverride: 'INHERIT',
          },
        ],
      },
      satisfies: {
        states: ['GOAL_GAP_CAPTURED'],
      },
      importance: 'high',
      runPolicy: { maxExecutions: 1 },
      retryPolicy: {
        maxAttempts: 2,
        onExhaust: 'CLARIFY',
      },
      allowSupportiveLine: true,
    },

    // 4. Contact Capture - CONTACT_GATE
    {
      id: 'contact-1',
      type: 'BASELINE_CAPTURE',
      title: 'Capture Contact Info',
      purpose: 'Get email/phone for follow-up',
      produces: ['email', 'phone'],
      requiresStates: ['GOAL_GAP_CAPTURED'], // explicit eligibility
      ui: {
        x: 100,
        y: 50,
        lane: 'CONTACT_GATE',
      },
      satisfies: {
        gates: ['CONTACT'],
      },
      eligibility: {
        requiresGoalSet: true,  // Only after goal gap is captured
      },
      importance: 'high',
      runPolicy: { maxExecutions: 1 },
      retryPolicy: {
        maxAttempts: 2,
        onExhaust: 'BROADEN',
      },
    },

    // 5. Booking - AFTER CONTACT
    {
      id: 'booking-1',
      type: 'ACTION_BOOKING',
      title: 'Book Consultation',
      purpose: 'Schedule initial consultation',
      produces: ['booking_date', 'booking_type'],
      ui: {
        x: 100,
        y: 50,
        lane: 'AFTER_CONTACT',
      },
      requires: ['CONTACT'],
      satisfies: {
        gates: ['BOOKING'],
      },
      importance: 'high',
      runPolicy: { maxExecutions: 1 },
      retryPolicy: {
        maxAttempts: 3,
        onExhaust: 'HANDOFF',
      },
    },

    // 6. Send Promo - AFTER BOOKING
    {
      id: 'promo-1',
      type: 'EXPLANATION',
      title: 'Send Welcome Offer',
      purpose: 'Share promotional offer',
      ui: {
        x: 100,
        y: 50,
        lane: 'AFTER_BOOKING',
      },
      requires: ['BOOKING'],
      satisfies: {
        states: ['PROMO_SENT'],
      },
      importance: 'normal',
      runPolicy: { maxExecutions: 1 },
      allowSupportiveLine: true,
    },

    // 7. Handoff - AFTER BOOKING
    {
      id: 'handoff-1',
      type: 'HANDOFF',
      title: 'Connect with Your Trainer',
      purpose: 'Transfer to human trainer for personalized planning',
      ui: {
        x: 100,
        y: 180,
        lane: 'AFTER_BOOKING',
      },
      requires: ['BOOKING'],
      satisfies: {
        gates: ['HANDOFF'],
        states: ['HANDOFF_COMPLETE'],
      },
      importance: 'high',
      runPolicy: { maxExecutions: 1 },
    },
  ],

  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    tags: ['fitness', 'onboarding', 'goal-gap-tracker', 'delta-first'],
  },
};

