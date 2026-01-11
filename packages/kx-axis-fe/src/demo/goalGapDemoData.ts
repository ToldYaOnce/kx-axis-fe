import type { ConversationFlow } from '../types';

/**
 * Demo flow showcasing GOAL_GAP_TRACKER
 * Delta-first philosophy: Target → Baseline → Delta → Category
 */
export const goalGapDemoFlow: ConversationFlow = {
  id: 'demo-conversation-flow',
  name: 'Sample Conversation Flow',
  description: 'A sample flow demonstrating conversation items and requirements',
  industry: 'General',
  
  nodes: [
    // 1. Welcome - BEFORE CONTACT
    {
      id: 'welcome-1',
      kind: 'EXPLANATION',
      title: 'Welcome / Introduction',
      purpose: 'Greet the user and set expectations',
      ui: {
        x: 100,
        y: 50,
        lane: 'BEFORE_CONTACT',
      },
      importance: 'high',
      maxRuns: 'once',
    },

    // 2. Reflective Question - BEFORE CONTACT
    {
      id: 'reflect-1',
      kind: 'REFLECTIVE_QUESTION',
      title: 'Reflective Question',
      purpose: 'Gauge readiness and motivation level',
      ui: {
        x: 100,
        y: 180,
        lane: 'BEFORE_CONTACT',
      },
      importance: 'normal',
      maxRuns: 'once',
    },

    // 3. GOAL_GAP_TRACKER - BEFORE CONTACT (the star of the show!)
    {
      id: 'goal-gap-1',
      kind: 'GOAL_GAP_TRACKER',
      title: 'Goal Gap Tracker',
      purpose: 'Capture target, baseline, compute delta, classify category',
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
        metrics: ['goal_target', 'goal_baseline', 'goal_delta', 'goal_category'],
      },
      importance: 'high',
      maxRuns: 'once',
      allowSupportiveLine: true,
    },

    // 4. Contact Capture - CONTACT_GATE
    {
      id: 'contact-1',
      kind: 'BASELINE_CAPTURE',
      title: 'Capture Contact Info',
      purpose: 'Get email/phone for follow-up',
      ui: {
        x: 100,
        y: 50,
        lane: 'CONTACT_GATE',
      },
      satisfies: {
        gates: ['CONTACT'],
        metrics: ['contact_email', 'contact_phone'],
      },
      eligibility: {
        requiresGoalSet: true,  // Only after goal gap is captured
      },
      importance: 'high',
      maxRuns: 'once',
    },

    // 5. Booking - AFTER CONTACT
    {
      id: 'booking-1',
      kind: 'ACTION_BOOKING',
      title: 'Book Consultation',
      purpose: 'Schedule initial consultation',
      ui: {
        x: 100,
        y: 50,
        lane: 'AFTER_CONTACT',
      },
      requires: ['CONTACT'],
      satisfies: {
        gates: ['BOOKING'],
        metrics: ['booking_date', 'booking_type'],
      },
      importance: 'high',
      maxRuns: 'once',
    },

    // 6. Send Promo - AFTER BOOKING
    {
      id: 'promo-1',
      kind: 'EXPLANATION',
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
      maxRuns: 'once',
      allowSupportiveLine: true,
    },

    // 7. Handoff - AFTER BOOKING
    {
      id: 'handoff-1',
      kind: 'HANDOFF',
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
      maxRuns: 'once',
    },
  ],

  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    tags: ['fitness', 'onboarding', 'goal-gap-tracker', 'delta-first'],
  },
};

