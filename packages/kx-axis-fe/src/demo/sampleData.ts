import type { ConversationFlow, IndustryCaptureRegistry } from '../types';

export const fitnessRegistry: IndustryCaptureRegistry = {
  industry: 'Fitness',
  captures: [
    {
      id: 'current-weight',
      name: 'Current Weight',
      description: 'Current body weight in pounds or kilograms',
      dataType: 'number',
      industry: 'Fitness',
    },
    {
      id: 'current-body-fat',
      name: 'Current Body Fat %',
      description: 'Current body fat percentage',
      dataType: 'number',
      industry: 'Fitness',
    },
    {
      id: 'target-weight',
      name: 'Target Weight',
      description: 'Goal weight in pounds or kilograms',
      dataType: 'number',
      industry: 'Fitness',
    },
    {
      id: 'target-body-fat',
      name: 'Target Body Fat %',
      description: 'Goal body fat percentage',
      dataType: 'number',
      industry: 'Fitness',
    },
    {
      id: 'goal-timeline',
      name: 'Goal Timeline',
      description: 'Timeframe to achieve fitness goals',
      dataType: 'string',
      industry: 'Fitness',
    },
    {
      id: 'goal-checkpoint-date',
      name: 'Goal Checkpoint Date',
      description: 'Date for progress check-in',
      dataType: 'date',
      industry: 'Fitness',
    },
    {
      id: 'training-experience',
      name: 'Training Experience',
      description: 'Level of fitness training experience',
      dataType: 'string',
      industry: 'Fitness',
    },
    {
      id: 'dietary-restrictions',
      name: 'Dietary Restrictions',
      description: 'Any dietary restrictions or preferences',
      dataType: 'string',
      industry: 'Fitness',
    },
    {
      id: 'availability',
      name: 'Availability',
      description: 'Weekly availability for training sessions',
      dataType: 'string',
      industry: 'Fitness',
    },
  ],
};

export const sampleFlow: ConversationFlow = {
  id: 'fitness-onboarding-v1',
  name: 'Fitness Onboarding Flow',
  description: 'Initial consultation and goal-setting flow with clear eligibility gates',
  nodes: [
    // BEFORE CONTACT - Can run without any contact info
    {
      id: 'intro-greeting',
      kind: 'EXPLANATION',
      title: 'Welcome & Introduction',
      purpose: 'Greet the prospect and set expectations for the conversation',
      ui: {
        x: 0,
        y: 0,
        group: 'freeform',
        lane: 'BEFORE_CONTACT',
      },
      eligibility: {
        channels: ['SMS', 'Email', 'Web Chat'],
        leadStates: ['New'],
      },
      priority: {
        baseRank: 90,
        capRank: 100,
      },
      execution: {
        speechAct: 'inform',
        allowPrefix: true,
      },
    },
    {
      id: 'explain-value',
      kind: 'EXPLANATION',
      title: 'Explain Our Value',
      purpose: 'Share success stories and build trust before asking for contact',
      ui: {
        x: 0,
        y: 0,
        group: 'freeform',
        lane: 'BEFORE_CONTACT',
      },
      priority: {
        baseRank: 85,
      },
      execution: {
        speechAct: 'inform',
        allowPrefix: true,
      },
    },
    
    // CONTACT GATE - This node captures contact and unlocks the next phase
    {
      id: 'capture-contact',
      kind: 'DATA_CAPTURE',
      title: 'Capture Contact Info',
      purpose: 'Get email/phone to enable booking and follow-up',
      satisfies: ['CONTACT'], // This UNLOCKS the contact gate
      ui: {
        x: 0,
        y: 0,
        group: 'freeform',
        lane: 'CONTACT_GATE',
      },
      eligibility: {
        channels: ['SMS', 'Web Chat'],
      },
      priority: {
        baseRank: 80,
      },
      execution: {
        speechAct: 'request',
        allowPrefix: false,
      },
    },
    
    // AFTER CONTACT - Requires contact to be captured first
    {
      id: 'capture-current-stats',
      kind: 'DATA_CAPTURE',
      title: 'Capture Current Stats',
      purpose: 'Collect current weight and body fat percentage',
      requires: ['CONTACT'], // Locked behind contact gate
      satisfies: ['current-weight', 'current-body-fat'],
      ui: {
        x: 0,
        y: 0,
        group: 'freeform',
        lane: 'AFTER_CONTACT',
      },
      priority: {
        baseRank: 75,
      },
      execution: {
        speechAct: 'request',
        allowPrefix: false,
      },
    },
    {
      id: 'capture-goals',
      kind: 'DATA_CAPTURE',
      title: 'Capture Fitness Goals',
      purpose: 'Understand target weight, body fat, and timeline',
      requires: ['CONTACT'],
      satisfies: ['target-weight', 'target-body-fat', 'goal-timeline'],
      ui: {
        x: 0,
        y: 0,
        group: 'freeform',
        lane: 'AFTER_CONTACT',
      },
      priority: {
        baseRank: 70,
      },
      execution: {
        speechAct: 'request',
        allowPrefix: false,
      },
    },
    {
      id: 'explain-approach',
      kind: 'EXPLANATION',
      title: 'Explain Training Approach',
      purpose: 'Describe coaching methodology and personalized plan',
      requires: ['CONTACT'],
      ui: {
        x: 0,
        y: 0,
        group: 'freeform',
        lane: 'AFTER_CONTACT',
      },
      priority: {
        baseRank: 65,
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
      purpose: 'Schedule the first in-depth consultation call',
      requires: ['CONTACT'],
      satisfies: ['BOOKING', 'goal-checkpoint-date'], // This UNLOCKS the booking gate
      ui: {
        x: 0,
        y: 0,
        group: 'freeform',
        lane: 'AFTER_CONTACT',
      },
      priority: {
        baseRank: 85,
      },
      execution: {
        speechAct: 'request',
        allowPrefix: false,
      },
    },
    
    // AFTER BOOKING - Requires both contact AND booking
    {
      id: 'send-promo-code',
      kind: 'EXPLANATION',
      title: 'Send Promo Code',
      purpose: 'Provide exclusive discount for booked clients',
      requires: ['BOOKING'], // Locked behind booking (which implies contact)
      ui: {
        x: 0,
        y: 0,
        group: 'freeform',
        lane: 'AFTER_BOOKING',
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
      id: 'handoff-to-trainer',
      kind: 'HANDOFF',
      title: 'Handoff to Trainer',
      purpose: 'Transfer to human trainer for personalized planning',
      requires: ['BOOKING'],
      ui: {
        x: 0,
        y: 0,
        group: 'freeform',
        lane: 'AFTER_BOOKING',
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
  capturing: [
    {
      captureId: 'current-weight',
      required: true,
      confidenceThreshold: 0.8,
      usageLabel: 'Used to establish baseline metrics',
    },
    {
      captureId: 'current-body-fat',
      required: false,
      confidenceThreshold: 0.7,
      usageLabel: 'Optional baseline metric',
    },
    {
      captureId: 'target-weight',
      required: true,
      confidenceThreshold: 0.85,
      usageLabel: 'Primary goal setting',
    },
    {
      captureId: 'goal-timeline',
      required: true,
      confidenceThreshold: 0.75,
      usageLabel: 'Timeline planning',
    },
  ],
  metadata: {
    version: '1.0.0',
    createdAt: '2025-01-09T00:00:00Z',
    updatedAt: '2025-01-09T12:00:00Z',
  },
};

