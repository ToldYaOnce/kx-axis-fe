import type { ConversationFlow } from '../types';

/**
 * Demo flow showcasing GOAL_GAP_TRACKER
 * Delta-first philosophy: Target → Baseline → Delta → Category
 */
export const goalGapDemoFlow: ConversationFlow = {
  id: 'fitness-goal-gap-demo',
  name: 'Fitness Onboarding with Goal Gap Tracking',
  description: 'Demonstrates delta-first capture without thinking about reps/weight/time theories',
  industry: 'Fitness',
  
  nodes: [
    // 1. Welcome - BEFORE CONTACT
    {
      id: 'welcome-1',
      kind: 'EXPLANATION',
      title: 'Welcome to FitFlow',
      purpose: 'Greet the user and set expectations',
      ui: {
        x: 100,
        y: 50,
        lane: 'BEFORE_CONTACT',
      },
      priority: {
        baseRank: 90,
        capRank: 100,
      },
    },

    // 2. Reflective Question - BEFORE CONTACT
    {
      id: 'reflect-1',
      kind: 'REFLECTIVE_QUESTION',
      title: 'What motivated you to start today?',
      purpose: 'Gauge readiness and motivation level',
      ui: {
        x: 100,
        y: 180,
        lane: 'BEFORE_CONTACT',
      },
      priority: {
        baseRank: 80,
        capRank: 90,
      },
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
      priority: {
        baseRank: 70,
        capRank: 85,
      },
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
      priority: {
        baseRank: 60,
        capRank: 80,
      },
    },

    // 5. Booking - AFTER CONTACT
    {
      id: 'booking-1',
      kind: 'ACTION_BOOKING',
      title: 'Book Your First Session',
      purpose: 'Schedule initial consultation or training session',
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
      priority: {
        baseRank: 50,
        capRank: 70,
      },
    },

    // 6. Send Promo - AFTER BOOKING
    {
      id: 'promo-1',
      kind: 'EXPLANATION',
      title: 'Send Welcome Offer',
      purpose: 'Share discount or promo for first month',
      ui: {
        x: 100,
        y: 50,
        lane: 'AFTER_BOOKING',
      },
      requires: ['BOOKING'],
      satisfies: {
        states: ['PROMO_SENT'],
      },
      priority: {
        baseRank: 40,
        capRank: 60,
      },
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
      priority: {
        baseRank: 30,
        capRank: 50,
      },
    },
  ],

  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    tags: ['fitness', 'onboarding', 'goal-gap-tracker', 'delta-first'],
  },
};

