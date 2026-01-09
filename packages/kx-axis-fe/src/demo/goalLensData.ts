import type { GoalLens, GoalLensRegistry } from '../types';

/**
 * Fitness Industry Goal Lenses
 * 
 * Each lens defines:
 * - What baseline metrics we need to know NOW
 * - What target metrics they want to ACHIEVE
 * - How precise the deadline must be
 */

export const fitnessGoalLenses: GoalLens[] = [
  {
    id: 'BODY_COMPOSITION',
    name: 'Body Composition',
    description: 'Transform body weight and fat percentage',
    industry: 'Fitness',
    icon: '⚖️',
    color: '#4CAF50',
    metricBundle: {
      baselineMetrics: [
        {
          id: 'current_weight',
          name: 'Current Weight',
          description: 'Current body weight',
          dataType: 'number',
          required: true,
        },
        {
          id: 'current_bodyfat',
          name: 'Current Body Fat %',
          description: 'Current body fat percentage',
          dataType: 'number',
          required: false,  // Nice to have, not mandatory
        },
      ],
      targetMetrics: [
        {
          id: 'target_weight',
          name: 'Target Weight',
          description: 'Goal body weight',
          dataType: 'number',
          required: true,
        },
        {
          id: 'target_bodyfat',
          name: 'Target Body Fat %',
          description: 'Goal body fat percentage',
          dataType: 'number',
          required: false,
        },
      ],
      deadlinePolicy: 'RANGE_OK',  // Can accept "by summer" or "in 3 months"
    },
  },
  
  {
    id: 'STRENGTH_PR',
    name: 'Strength PR',
    description: 'Achieve a personal record in a specific lift',
    industry: 'Fitness',
    icon: '🏋️',
    color: '#FF5722',
    metricBundle: {
      baselineMetrics: [
        {
          id: 'lift_type',
          name: 'Lift Type',
          description: 'Which lift (bench, squat, deadlift, etc.)',
          dataType: 'string',
          required: true,
        },
        {
          id: 'current_lift_value',
          name: 'Current Max',
          description: 'Current personal record',
          dataType: 'number',
          required: true,
        },
        {
          id: 'lift_context',
          name: 'Training Context',
          description: 'How long training, frequency, etc.',
          dataType: 'string',
          required: false,
        },
      ],
      targetMetrics: [
        {
          id: 'target_lift_value',
          name: 'Target Max',
          description: 'Goal personal record',
          dataType: 'number',
          required: true,
        },
      ],
      deadlinePolicy: 'EXACT_DATE',  // PR attempts need specific dates
    },
  },
  
  {
    id: 'PERFORMANCE',
    name: 'Performance',
    description: 'Improve athletic performance (run time, endurance, etc.)',
    industry: 'Fitness',
    icon: '🏃',
    color: '#2196F3',
    metricBundle: {
      baselineMetrics: [
        {
          id: 'performance_metric',
          name: 'Performance Metric',
          description: 'What to measure (5K time, mile pace, etc.)',
          dataType: 'string',
          required: true,
        },
        {
          id: 'current_performance',
          name: 'Current Performance',
          description: 'Current metric value',
          dataType: 'string',
          required: true,
        },
      ],
      targetMetrics: [
        {
          id: 'target_performance',
          name: 'Target Performance',
          description: 'Goal metric value',
          dataType: 'string',
          required: true,
        },
        {
          id: 'event_date',
          name: 'Event Date',
          description: 'If training for a specific event',
          dataType: 'date',
          required: false,
        },
      ],
      deadlinePolicy: 'EXACT_DATE',  // Racing/events need specific dates
    },
  },
  
  {
    id: 'WELLNESS',
    name: 'Wellness',
    description: 'General health and habit formation',
    industry: 'Fitness',
    icon: '🧘',
    color: '#9C27B0',
    metricBundle: {
      baselineMetrics: [
        {
          id: 'current_habits',
          name: 'Current Habits',
          description: 'Current activity level and routines',
          dataType: 'string',
          required: true,
        },
        {
          id: 'health_concerns',
          name: 'Health Concerns',
          description: 'Any relevant health considerations',
          dataType: 'string',
          required: false,
        },
      ],
      targetMetrics: [
        {
          id: 'desired_habits',
          name: 'Desired Habits',
          description: 'What habits to build',
          dataType: 'string',
          required: true,
        },
        {
          id: 'frequency_target',
          name: 'Frequency Target',
          description: 'How often per week',
          dataType: 'number',
          required: false,
        },
      ],
      deadlinePolicy: 'DURATION_OK',  // Habit formation is flexible ("in 30 days")
    },
  },
];

export const fitnessGoalLensRegistry: GoalLensRegistry = {
  industry: 'Fitness',
  lenses: fitnessGoalLenses,
};


