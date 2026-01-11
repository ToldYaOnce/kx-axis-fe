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
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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

// Draggable wrapper for individual conversation items
const DraggableConversationItem: React.FC<{ item: ConversationItem }> = ({ item }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.id}`,
    data: {
      type: 'palette-item',
      item,
    },
  });

  React.useEffect(() => {
    if (isDragging) {
      console.log('🚀 BEGIN DRAGGING:', {
        id: `palette-${item.id}`,
        title: item.title,
        kind: item.kind,
        defaultLane: item.defaultLane,
      });
    } else {
      console.log('🛑 STOP DRAGGING:', item.title);
    }
  }, [isDragging, item]);

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        mb: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        transition: isDragging ? 'none' : 'all 0.2s',
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        zIndex: isDragging ? 9999 : 'auto',
        position: 'relative',
        '&:active': {
          cursor: 'grabbing',
        },
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: 'action.hover',
          transform: isDragging ? undefined : 'translateX(4px)',
        },
        ...style,
      }}
      {...attributes}
      {...listeners}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, px: 2, gap: 1 }}>
        <DragIndicatorIcon sx={{ fontSize: '1rem', color: 'text.disabled' }} />
        <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
          {item.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
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
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
            {item.description}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export const ConversationItemsPalette: React.FC = () => {
  const { addNode } = useFlow();

  // Helper function to create a node from a conversation item
  const createNodeFromItem = (item: ConversationItem, lane?: string): FlowNode => {
    const targetLane = (lane || item.defaultLane) as 'BEFORE_CONTACT' | 'CONTACT_GATE' | 'AFTER_CONTACT' | 'AFTER_BOOKING';
    
    const newNode: FlowNode = {
      id: `${item.id}-${Date.now()}`,
      kind: item.kind,
      title: item.title,
      ui: {
        x: 0,
        y: 0,
        lane: targetLane,
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

    return newNode;
  };

  // Expose createNodeFromItem for Canvas to use
  // (Canvas will call this via context when handling drops)
  React.useEffect(() => {
    // Store the function in a way Canvas can access it
    // This is a temporary solution; ideally we'd pass it through context
    (window as any).__createNodeFromItem = createNodeFromItem;
    return () => {
      delete (window as any).__createNodeFromItem;
    };
  }, []);

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Conversation Items
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
        Drag items to a lane on the canvas
      </Typography>

      <Box>
        {CONVERSATION_ITEMS.map((item) => (
          <DraggableConversationItem key={item.id} item={item} />
        ))}
      </Box>

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

