import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Paper,
  Divider,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HandshakeIcon from '@mui/icons-material/Handshake';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useFlow } from '../../context/FlowContext';
import type { FlowNode, NodeKind } from '../../types';

interface ConversationItem {
  id: string;
  kind: NodeKind;
  title: string;
  description: string;
  icon: React.ReactElement;
  defaultLane: 'BEFORE_CONTACT' | 'CONTACT_GATE' | 'AFTER_CONTACT' | 'AFTER_BOOKING';
}

const CONVERSATION_ITEMS: ConversationItem[] = [
  {
    id: 'welcome',
    kind: 'EXPLANATION',
    title: 'Welcome / Introduction',
    description: 'Greet and set expectations',
    icon: <InfoOutlinedIcon />,
    defaultLane: 'BEFORE_CONTACT',
  },
  {
    id: 'reflective',
    kind: 'REFLECTIVE_QUESTION',
    title: 'Reflective Question',
    description: 'Ask them to reflect on readiness',
    icon: <QuestionAnswerIcon />,
    defaultLane: 'BEFORE_CONTACT',
  },
  {
    id: 'goal-gap',
    kind: 'GOAL_GAP_TRACKER',
    title: 'Goal Gap Tracker',
    description: 'Target → Baseline → Delta → Category',
    icon: <ShowChartIcon />,
    defaultLane: 'BEFORE_CONTACT',
  },
  {
    id: 'contact',
    kind: 'BASELINE_CAPTURE',
    title: 'Contact Capture',
    description: 'Get email/phone for follow-up',
    icon: <ContactMailIcon />,
    defaultLane: 'CONTACT_GATE',
  },
  {
    id: 'booking',
    kind: 'ACTION_BOOKING',
    title: 'Book Consultation',
    description: 'Schedule a session or call',
    icon: <CalendarMonthIcon />,
    defaultLane: 'AFTER_CONTACT',
  },
  {
    id: 'promo',
    kind: 'EXPLANATION',
    title: 'Send Promo',
    description: 'Share discount or offer',
    icon: <LocalOfferIcon />,
    defaultLane: 'AFTER_BOOKING',
  },
  {
    id: 'handoff',
    kind: 'HANDOFF',
    title: 'Handoff',
    description: 'Transfer to human',
    icon: <HandshakeIcon />,
    defaultLane: 'AFTER_BOOKING',
  },
];

export const ConversationItemsPalette: React.FC = () => {
  const { addNode } = useFlow();

  const handleAddItem = (item: ConversationItem) => {
    const newNode: FlowNode = {
      id: `${item.id}-${Date.now()}`,
      kind: item.kind,
      title: item.title,
      ui: {
        x: 0,
        y: 0,
        lane: item.defaultLane,
      },
    };

    // Add default config for GOAL_GAP_TRACKER
    if (item.kind === 'GOAL_GAP_TRACKER') {
      newNode.goalGapTracker = {
        targetLabel: "What's the exact outcome you want?",
        baselineLabel: "Where are you at right now with that?",
        showExamples: true,
        examples: [
          "run 3 miles in 21 minutes",
          "bench 300",
          "lose 15 lbs",
        ],
        computeMode: 'AUTO',
        askClarifierIfIncomparable: true,
        deadlinePolicyDefault: 'INHERIT',
        categories: [
          { id: 'strength-pr', name: 'Strength PR', deadlinePolicyOverride: 'EXACT_DATE' },
          { id: 'endurance', name: 'Endurance / Pace', deadlinePolicyOverride: 'EXACT_DATE' },
          { id: 'body-comp', name: 'Body Composition', deadlinePolicyOverride: 'RANGE_OK' },
          { id: 'consistency', name: 'Consistency / Routine', deadlinePolicyOverride: 'DURATION_OK' },
          { id: 'mobility', name: 'Mobility / Pain', deadlinePolicyOverride: 'RANGE_OK' },
          { id: 'other', name: 'Other', deadlinePolicyOverride: 'INHERIT' },
        ],
      };
      newNode.satisfies = {
        states: ['GOAL_GAP_CAPTURED'],
        metrics: ['goal_target', 'goal_baseline', 'goal_delta', 'goal_category'],
      };
    }

    // Add default config for contact capture
    if (item.id === 'contact' && item.kind === 'BASELINE_CAPTURE') {
      newNode.satisfies = {
        gates: ['CONTACT'],
        metrics: ['contact_email', 'contact_phone'],
      };
    }

    // Add default config for booking
    if (item.kind === 'ACTION_BOOKING') {
      newNode.requires = ['CONTACT'];
      newNode.satisfies = {
        gates: ['BOOKING'],
        metrics: ['booking_date'],
      };
    }

    // Add default config for handoff
    if (item.kind === 'HANDOFF') {
      newNode.requires = ['BOOKING'];
      newNode.satisfies = {
        gates: ['HANDOFF'],
        states: ['HANDOFF_COMPLETE'],
      };
    }

    addNode(newNode);
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Conversation Items
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
        Drag or click to add to canvas
      </Typography>

      <List sx={{ p: 0 }}>
        {CONVERSATION_ITEMS.map((item) => (
          <Paper
            key={item.id}
            elevation={0}
            sx={{
              mb: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
                transform: 'translateX(4px)',
              },
            }}
          >
            <ListItemButton onClick={() => handleAddItem(item)} sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.title}
                    </Typography>
                    {item.kind === 'GOAL_GAP_TRACKER' && (
                      <Typography
                        variant="caption"
                        sx={{
                          backgroundColor: 'primary.light',
                          color: 'primary.dark',
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 0.5,
                          fontSize: '0.65rem',
                          fontWeight: 700,
                        }}
                      >
                        NEW
                      </Typography>
                    )}
                  </Box>
                }
                secondary={item.description}
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption', sx: { mt: 0.5 } }}
              />
              <AddCircleOutlineIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            </ListItemButton>
          </Paper>
        ))}
      </List>

      <Divider sx={{ my: 3 }} />

      <Box
        sx={{
          p: 2,
          backgroundColor: 'action.hover',
          borderRadius: 1,
          border: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
          💡 Delta-First Philosophy
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
          Goal Gap Tracker captures target → baseline → computes delta → classifies category.
          No need to think about reps/weight/time theories.
        </Typography>
      </Box>
    </Box>
  );
};

