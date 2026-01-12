/**
 * Demo Scenarios and Mock Responses for Simulator UI
 * 
 * 3 complete scenarios with mock server responses
 */

import type {
  SimulationRun,
  SimulationNode,
  StartSimulationResponse,
  StepSimulationResponse,
} from '../types/simulator';

// ========== SCENARIO 1: Fitness Onboarding (Happy Path) ==========

// Helper function to create mock node
const createMockNode = (
  nodeId: string,
  parentNodeId: string | null,
  branchId: string,
  turnNumber: number,
  userMessage?: string,
  agentMessage?: string,
  timestamp: string = '2026-01-12T10:00:00Z'
): SimulationNode => ({
  nodeId,
  parentNodeId,
  branchId,
  turnNumber,
  userMessage,
  knownFactsBefore: {},
  controllerOutput: {
    intent: { primary: 'ENGAGE', confidence: 0.95 },
    affectScalars: { pain: 0, urgency: 0, vulnerability: 0 },
    signals: { hesitation: false, objection: false, confusion: false, engagement: 8 },
    progress: { madeProgress: true, stallDetected: false, stagnationTurns: 0 },
    stepSufficiency: false,
    controlFlags: {
      canAdvance: true,
      needsExplanation: false,
      fastTrackEligible: false,
      humanTakeoverAllowed: false,
      allowedBlabberModes: ['ACK'],
    },
  },
  executionResult: {
    executionDecision: 'ADVANCE',
    reasoning: 'Conversation progressing normally.',
    agentMessage,
    executionMetadata: {
      blabberModeUsed: 'ACK',
      stepSatisfiedThisTurn: true,
      newlyKnownFacts: [],
      readinessDelta: [],
    },
  },
  agentMessage,
  knownFactsAfter: {},
  timestamp,
  contractVersion: '1.0.0',
  designVersionHash: 'abc123',
  status: 'VALID',
});

export const fitnessScenario: StartSimulationResponse = {
  run: {
    runId: 'run-fitness-001',
    flowId: 'flow-fitness-onboarding',
    flowName: 'Fitness Onboarding Flow',
    scenarioContext: {
      channel: 'SMS',
      leadState: 'ANONYMOUS',
      resumable: false,
    },
    branches: [
      {
        branchId: 'branch-main',
        parentBranchId: null,
        forkFromNodeId: null,
        label: 'Main',
        createdAt: '2026-01-12T10:00:00Z',
      },
      {
        branchId: 'branch-strength',
        parentBranchId: 'branch-main',
        forkFromNodeId: 'node-001',
        label: 'Alt: Strength Goal',
        createdAt: '2026-01-12T10:01:00Z',
      },
      {
        branchId: 'branch-weight-loss',
        parentBranchId: 'branch-main',
        forkFromNodeId: 'node-001',
        label: 'Alt: Weight Loss Goal',
        createdAt: '2026-01-12T10:01:30Z',
      },
      {
        branchId: 'branch-urgent',
        parentBranchId: 'branch-strength',
        forkFromNodeId: 'node-004',
        label: 'Alt: Urgent Timeline',
        createdAt: '2026-01-12T10:03:00Z',
      },
    ],
    nodes: [
      // MAIN BRANCH: T1 - Agent greeting (divergence point)
      createMockNode('node-001', null, 'branch-main', 1, undefined, 
        'Hey! Ready to crush some goals? What brings you here today?', '2026-01-12T10:00:00Z'),
      
      // MAIN BRANCH: T2 - User wants cardio
      createMockNode('node-002', 'node-001', 'branch-main', 2, 
        'I want to improve my cardio and run a 5K', undefined, '2026-01-12T10:00:30Z'),
      
      // MAIN BRANCH: T3 - Agent responds about running
      createMockNode('node-003', 'node-002', 'branch-main', 3, undefined,
        'Awesome! Running a 5K is a great goal. Have you done any running before, or is this your first time?', 
        '2026-01-12T10:00:45Z'),
      
      // MAIN BRANCH: T4 - User shares experience
      createMockNode('node-004', 'node-003', 'branch-main', 4,
        'I used to run in high school but took a long break', undefined, '2026-01-12T10:01:00Z'),
      
      // MAIN BRANCH: T5 - Agent creates plan
      createMockNode('node-005', 'node-004', 'branch-main', 5, undefined,
        'Perfect! Getting back into running is easier than starting fresh. Let\'s build you a progressive 8-week plan. When are you hoping to run your 5K?',
        '2026-01-12T10:01:15Z'),
      
      // BRANCH: STRENGTH - T2 - User wants to bench 300
      createMockNode('node-101', 'node-001', 'branch-strength', 2,
        'I want to bench 300 lbs', undefined, '2026-01-12T10:01:00Z'),
      
      // BRANCH: STRENGTH - T3 - Agent responds
      createMockNode('node-102', 'node-101', 'branch-strength', 3, undefined,
        'Nice! 300 on bench is solid. Where are you at right now with that?',
        '2026-01-12T10:01:15Z'),
      
      // BRANCH: STRENGTH - T4 - User shares current (divergence point)
      createMockNode('node-103', 'node-102', 'branch-strength', 4,
        'Currently at 225, been stuck for a few months', undefined, '2026-01-12T10:01:30Z'),
      
      // BRANCH: STRENGTH - T5 - Agent offers plan
      createMockNode('node-104', 'node-103', 'branch-strength', 5, undefined,
        'That\'s a 75lb jump - ambitious! Let\'s break that plateau. Are you following a program right now?',
        '2026-01-12T10:01:45Z'),
      
      // BRANCH: STRENGTH - T6 - User responds about program
      createMockNode('node-105', 'node-104', 'branch-strength', 6,
        'Just doing my own thing, 3x a week', undefined, '2026-01-12T10:02:00Z'),
      
      // BRANCH: STRENGTH - T7 - Agent suggests structure
      createMockNode('node-106', 'node-105', 'branch-strength', 7, undefined,
        'Got it. A structured program will be key. We can build you a 12-16 week progression with periodization. What\'s your timeline like?',
        '2026-01-12T10:02:15Z'),
      
      // BRANCH: WEIGHT LOSS - T2 - User wants to lose weight
      createMockNode('node-201', 'node-001', 'branch-weight-loss', 2,
        'I need to lose 30 pounds', undefined, '2026-01-12T10:01:30Z'),
      
      // BRANCH: WEIGHT LOSS - T3 - Agent responds
      createMockNode('node-202', 'node-201', 'branch-weight-loss', 3, undefined,
        'Okay, 30 pounds is definitely achievable. What\'s driving this goal for you?',
        '2026-01-12T10:01:45Z'),
      
      // BRANCH: WEIGHT LOSS - T4 - User shares motivation
      createMockNode('node-203', 'node-202', 'branch-weight-loss', 4,
        'Health reasons - my doctor recommended it', undefined, '2026-01-12T10:02:00Z'),
      
      // BRANCH: WEIGHT LOSS - T5 - Agent acknowledges
      createMockNode('node-204', 'node-203', 'branch-weight-loss', 5, undefined,
        'That\'s important. Health-driven goals tend to stick. How much time are you thinking for this?',
        '2026-01-12T10:02:15Z'),
      
      // BRANCH: URGENT - T5 - User wants fast results (alternate from node-104)
      createMockNode('node-301', 'node-103', 'branch-urgent', 5,
        'I need to hit 300 in 6 weeks for a competition', undefined, '2026-01-12T10:03:00Z'),
      
      // BRANCH: URGENT - T6 - Agent sets expectations
      createMockNode('node-302', 'node-301', 'branch-urgent', 6, undefined,
        'Whoa - 6 weeks is really tight for a 75lb jump. That\'s aggressive even for enhanced lifters. Can we talk about realistic timelines?',
        '2026-01-12T10:03:15Z'),
      
      // BRANCH: URGENT - T7 - User insists
      createMockNode('node-303', 'node-302', 'branch-urgent', 7,
        'The comp is locked in, I have to try', undefined, '2026-01-12T10:03:30Z'),
      
      // BRANCH: URGENT - T8 - Agent compromises
      createMockNode('node-304', 'node-303', 'branch-urgent', 8, undefined,
        'Alright, I respect the commitment. Let\'s maximize your 6 weeks with a peaking program. Just know that 15-20lbs is more realistic, but we\'ll push hard. Deal?',
        '2026-01-12T10:03:45Z'),
    ],
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:03:45Z',
  },
};

export const fitnessStep2: StepSimulationResponse = {
  node: {
    nodeId: 'node-002',
    parentNodeId: 'node-001',
    branchId: 'branch-main',
    turnNumber: 2,
    userMessage: 'I want to bench 300 lbs',
    knownFactsBefore: {},
    controllerOutput: {
      intent: {
        primary: 'SET_GOAL',
        confidence: 0.92,
      },
      affectScalars: {
        pain: 3,
        urgency: 6,
        vulnerability: 2,
      },
      signals: {
        hesitation: false,
        objection: false,
        confusion: false,
        engagement: 9,
      },
      progress: {
        madeProgress: true,
        stallDetected: false,
        stagnationTurns: 0,
      },
      stepSufficiency: false,
      controlFlags: {
        canAdvance: true,
        needsExplanation: false,
        fastTrackEligible: false,
        humanTakeoverAllowed: false,
        recommendedStep: {
          stepId: 'baseline-capture',
          confidence: 0.88,
        },
        allowedBlabberModes: ['ACK', 'HYPE'],
      },
    },
    executionResult: {
      executionDecision: 'ADVANCE',
      reasoning: 'User stated target goal (bench 300). Missing: baseline, deadline. Advancing to baseline capture.',
      agentMessage: 'Nice! 300 on bench is solid. Where are you at right now with that?',
      executionMetadata: {
        blabberModeUsed: 'HYPE',
        stepSatisfiedThisTurn: true,
        newlyKnownFacts: ['goal.target'],
        readinessDelta: ['Unlocked baseline capture'],
      },
    },
    agentMessage: 'Nice! 300 on bench is solid. Where are you at right now with that?',
    knownFactsAfter: {
      goal: {
        target: 'bench 300 lbs',
        category: 'strength-pr',
      },
    },
    timestamp: '2026-01-12T10:01:15Z',
    contractVersion: '1.0.0',
    designVersionHash: 'abc123',
    status: 'VALID',
  },
  updatedFacts: {
    goal: {
      target: 'bench 300 lbs',
      category: 'strength-pr',
    },
  },
};

// ========== SCENARIO 2: Legal Consultation (Stall/Explain) ==========

export const legalScenario: StartSimulationResponse = {
  run: {
    runId: 'run-legal-001',
    flowId: 'flow-legal-intake',
    flowName: 'Legal Intake Flow',
    scenarioContext: {
      channel: 'Web Chat',
      leadState: 'ANONYMOUS',
      resumable: true,
      urgencyContext: 'Court date in 2 weeks',
    },
    branches: [
      {
        branchId: 'branch-main',
        parentBranchId: null,
        forkFromNodeId: null,
        label: 'Main',
        createdAt: '2026-01-12T11:00:00Z',
      },
    ],
    nodes: [
      {
        nodeId: 'node-L001',
        parentNodeId: null,
        branchId: 'branch-main',
        turnNumber: 1,
        knownFactsBefore: {},
        controllerOutput: {
          intent: {
            primary: 'SEEK_HELP',
            confidence: 0.88,
          },
          affectScalars: {
            pain: 7,
            urgency: 9,
            vulnerability: 8,
          },
          signals: {
            hesitation: true,
            objection: false,
            confusion: false,
            engagement: 7,
          },
          progress: {
            madeProgress: false,
            stallDetected: false,
            stagnationTurns: 0,
          },
          stepSufficiency: false,
          controlFlags: {
            canAdvance: true,
            needsExplanation: true,
            fastTrackEligible: false,
            humanTakeoverAllowed: true,
            allowedBlabberModes: ['REASSURE', 'EXPLAIN'],
          },
        },
        executionResult: {
          executionDecision: 'EXPLAIN',
          reasoning: 'High vulnerability + hesitation detected. User needs reassurance before proceeding. Not advancing yet.',
          agentMessage: 'I understand this is stressful. Everything shared here is confidential. I\'m here to help clarify your options—no commitments yet.',
          executionMetadata: {
            blabberModeUsed: 'REASSURE',
            stepSatisfiedThisTurn: false,
            newlyKnownFacts: [],
            readinessDelta: [],
          },
        },
        agentMessage: 'I understand this is stressful. Everything shared here is confidential. I\'m here to help clarify your options—no commitments yet.',
        knownFactsAfter: {},
        timestamp: '2026-01-12T11:00:00Z',
        contractVersion: '1.0.0',
        designVersionHash: 'def456',
        status: 'VALID',
      },
    ],
    createdAt: '2026-01-12T11:00:00Z',
    updatedAt: '2026-01-12T11:00:00Z',
  },
};

// ========== SCENARIO 3: Real Estate (Fast Track to Handoff) ==========

export const realEstateScenario: StartSimulationResponse = {
  run: {
    runId: 'run-realestate-001',
    flowId: 'flow-property-inquiry',
    flowName: 'Property Inquiry Flow',
    scenarioContext: {
      channel: 'Email',
      leadState: 'KNOWN',
      resumable: true,
    },
    branches: [
      {
        branchId: 'branch-main',
        parentBranchId: null,
        forkFromNodeId: null,
        label: 'Main',
        createdAt: '2026-01-12T12:00:00Z',
      },
    ],
    nodes: [
      {
        nodeId: 'node-R001',
        parentNodeId: null,
        branchId: 'branch-main',
        turnNumber: 1,
        userMessage: 'Hi, I\'m interested in 123 Oak Street. Can I schedule a showing this weekend?',
        knownFactsBefore: {
          identity: {
            name: 'Sarah Johnson',
            timezone: 'America/New_York',
          },
          contact: {
            email: 'sarah@example.com',
          },
        },
        controllerOutput: {
          intent: {
            primary: 'BOOK_SHOWING',
            secondary: 'PROPERTY_DETAILS',
            confidence: 0.96,
          },
          affectScalars: {
            pain: 2,
            urgency: 7,
            vulnerability: 1,
          },
          signals: {
            hesitation: false,
            objection: false,
            confusion: false,
            engagement: 10,
          },
          progress: {
            madeProgress: true,
            stallDetected: false,
            stagnationTurns: 0,
          },
          stepSufficiency: true,
          controlFlags: {
            canAdvance: true,
            needsExplanation: false,
            fastTrackEligible: true,
            humanTakeoverAllowed: true,
            recommendedStep: {
              stepId: 'schedule-showing',
              confidence: 0.94,
            },
            allowedBlabberModes: ['ACK'],
          },
        },
        executionResult: {
          executionDecision: 'FAST_TRACK',
          reasoning: 'Known lead, clear intent, sufficient context, high confidence. Fast-tracking to booking.',
          agentMessage: 'Absolutely, Sarah! 123 Oak is a great property. Let me check availability this weekend and I\'ll send you some options within the hour.',
          constraintDeltas: [
            {
              operation: 'ADD',
              constraintType: 'propertyInterest',
              value: {
                propertyId: '123-oak-street',
                urgency: 'weekend',
              },
            },
          ],
          executionMetadata: {
            blabberModeUsed: 'ACK',
            stepSatisfiedThisTurn: true,
            newlyKnownFacts: ['motive.primaryGoal', 'logistics.deadline'],
            readinessDelta: ['Unlocked scheduling', 'Eligible for showing confirmation'],
          },
        },
        agentMessage: 'Absolutely, Sarah! 123 Oak is a great property. Let me check availability this weekend and I\'ll send you some options within the hour.',
        knownFactsAfter: {
          identity: {
            name: 'Sarah Johnson',
            timezone: 'America/New_York',
          },
          contact: {
            email: 'sarah@example.com',
          },
          motive: {
            primaryGoal: 'Schedule showing for 123 Oak Street',
          },
          logistics: {
            deadline: 'this weekend',
          },
        },
        timestamp: '2026-01-12T12:00:00Z',
        contractVersion: '1.0.0',
        designVersionHash: 'ghi789',
        status: 'VALID',
      },
    ],
    createdAt: '2026-01-12T12:00:00Z',
    updatedAt: '2026-01-12T12:00:00Z',
  },
};

// ========== MOCK RESPONSES REGISTRY ==========

export const mockSimulatorResponses = {
  'flow-fitness-onboarding': {
    start: fitnessScenario,
    steps: [fitnessStep2],
  },
  'flow-legal-intake': {
    start: legalScenario,
    steps: [],
  },
  'flow-property-inquiry': {
    start: realEstateScenario,
    steps: [],
  },
};

export const demoScenarios = [
  {
    id: 'flow-fitness-onboarding',
    name: 'Fitness Onboarding (Happy Path)',
    description: 'User progresses smoothly through goal setting and baseline capture',
  },
  {
    id: 'flow-legal-intake',
    name: 'Legal Consultation (Stall/Explain)',
    description: 'High vulnerability lead needs reassurance before advancing',
  },
  {
    id: 'flow-property-inquiry',
    name: 'Real Estate (Fast Track)',
    description: 'Known lead with clear intent, fast-track to booking',
  },
];

