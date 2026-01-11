import React, { useState } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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
  captures?: string[]; // For INFO_CAPTURE items
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
const DraggableConversationItem: React.FC<{ item: ConversationItem & { captures?: string[] }; isUsed: boolean }> = ({ item, isUsed }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.id}`,
    data: {
      type: 'palette-item',
      item,
    },
    disabled: isUsed,
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
        borderColor: isUsed ? 'divider' : 'divider',
        transition: isDragging ? 'none' : 'all 0.2s',
        opacity: isUsed ? 0.4 : (isDragging ? 0.5 : 1),
        cursor: isUsed ? 'not-allowed' : 'grab',
        zIndex: isDragging ? 9999 : 'auto',
        position: 'relative',
        pointerEvents: isUsed ? 'none' : 'auto',
        backgroundColor: isUsed ? 'action.disabledBackground' : 'background.paper',
        '&:active': {
          cursor: isUsed ? 'not-allowed' : 'grabbing',
        },
        '&:hover': {
          borderColor: isUsed ? 'divider' : 'primary.main',
          backgroundColor: isUsed ? 'action.disabledBackground' : 'action.hover',
          transform: isUsed ? undefined : (isDragging ? undefined : 'translateX(4px)'),
        },
        ...style,
      }}
      {...attributes}
      {...listeners}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, px: 2, gap: 1 }}>
        <DragIndicatorIcon sx={{ fontSize: '1rem', color: isUsed ? 'action.disabled' : 'text.disabled' }} />
        <Box sx={{ color: isUsed ? 'action.disabled' : 'text.secondary', display: 'flex', alignItems: 'center' }}>
          {item.icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: isUsed ? 'text.disabled' : 'text.primary' }}>
              {item.title}
            </Typography>
            {item.kind === 'GOAL_GAP_TRACKER' && !isUsed && (
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
            {isUsed && (
              <Typography
                variant="caption"
                sx={{
                  backgroundColor: 'success.light',
                  color: 'success.dark',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                }}
              >
                ON CANVAS
              </Typography>
            )}
          </Box>
          <Typography variant="caption" sx={{ color: isUsed ? 'text.disabled' : 'text.secondary', display: 'block', mt: 0.5 }}>
            {item.description}
          </Typography>
          {/* Show captures for INFO_CAPTURE items */}
          {item.captures && item.captures.length > 0 && (
            <Typography variant="caption" sx={{ color: 'primary.main', display: 'block', mt: 0.5, fontSize: '0.65rem', fontWeight: 600 }}>
              Captures: {item.captures.slice(0, 2).join(', ')}
              {item.captures.length > 2 && ` +${item.captures.length - 2}`}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

// Generic conversation item kinds (UI-facing)
type ConversationItemKind = 
  | 'EXPLANATION' 
  | 'REFLECTIVE_QUESTION' 
  | 'INFO_CAPTURE' 
  | 'GOAL_GAP_TRACKER' 
  | 'ACTION' 
  | 'HANDOFF';

// Presets for INFO_CAPTURE
type InfoCapturePreset = 'blank' | 'get_name' | 'get_contact_info';

interface PresetConfig {
  label: string;
  title: string;
  captures: string[];
  produces: string[];
}

const INFO_CAPTURE_PRESETS: Record<InfoCapturePreset, PresetConfig> = {
  blank: {
    label: 'Blank',
    title: 'New Capture',
    captures: [],
    produces: [],
  },
  get_name: {
    label: 'Get name',
    title: 'Get name',
    captures: ['firstName', 'lastName'],
    produces: ['firstName', 'lastName'],
  },
  get_contact_info: {
    label: 'Get contact info',
    title: 'Get contact info',
    captures: ['email', 'phone'],
    produces: ['email', 'phone'],
  },
};

export const ConversationItemsPalette: React.FC = () => {
  const { addNode, flow } = useFlow();
  
  // State for dynamic conversation items
  const [conversationItems, setConversationItems] = useState<ConversationItem[]>(CONVERSATION_ITEMS);
  
  // State for "+ New item" dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItemType, setNewItemType] = useState<ConversationItemKind | ''>('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<InfoCapturePreset>('blank');

  // Track which single-use items are already on the canvas
  const usedItemIds = new Set<string>();
  
  // Single-use items (can only be added once)
  const SINGLE_USE_ITEMS = ['contact', 'booking', 'goal-gap', 'handoff'];
  
  flow.nodes.forEach((node) => {
    // Check if node ID starts with any single-use item prefix
    SINGLE_USE_ITEMS.forEach((itemId) => {
      if (node.id.startsWith(itemId)) {
        usedItemIds.add(itemId);
      }
    });
  });
  
  // Handle opening dialog
  const handleOpenDialog = () => {
    setDialogOpen(true);
    setNewItemType('');
    setNewItemTitle('');
    setSelectedPreset('blank');
  };
  
  // Handle closing dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setNewItemType('');
    setNewItemTitle('');
    setSelectedPreset('blank');
  };
  
  // Handle type selection (prefill title)
  const handleTypeChange = (type: ConversationItemKind) => {
    setNewItemType(type);
    setSelectedPreset('blank'); // Reset preset when type changes
    
    // Prefill title based on type
    const titleMap: Record<ConversationItemKind, string> = {
      'EXPLANATION': 'New Explanation',
      'REFLECTIVE_QUESTION': 'New Question',
      'INFO_CAPTURE': 'New Capture',
      'GOAL_GAP_TRACKER': 'Goal Gap Tracker',
      'ACTION': 'New Action',
      'HANDOFF': 'Handoff to Human',
    };
    
    setNewItemTitle(titleMap[type] || 'New Item');
  };
  
  // Handle preset selection (for INFO_CAPTURE only)
  const handlePresetChange = (preset: InfoCapturePreset) => {
    setSelectedPreset(preset);
    const presetConfig = INFO_CAPTURE_PRESETS[preset];
    setNewItemTitle(presetConfig.title);
  };
  
  // Handle create new item
  const handleCreateItem = () => {
    if (!newItemType || !newItemTitle.trim()) return;
    
    // Map UI-facing kinds to internal NodeKind
    const kindToNodeKind: Record<ConversationItemKind, NodeKind> = {
      'EXPLANATION': 'EXPLANATION',
      'REFLECTIVE_QUESTION': 'REFLECTIVE_QUESTION',
      'INFO_CAPTURE': 'BASELINE_CAPTURE', // Map to existing type
      'GOAL_GAP_TRACKER': 'GOAL_GAP_TRACKER',
      'ACTION': 'ACTION_BOOKING', // Map to existing type
      'HANDOFF': 'HANDOFF',
    };
    
    // Get icon for type
    const iconMap: Record<ConversationItemKind, React.ReactElement> = {
      'EXPLANATION': <InfoOutlinedIcon />,
      'REFLECTIVE_QUESTION': <QuestionAnswerIcon />,
      'INFO_CAPTURE': <ContactMailIcon />,
      'GOAL_GAP_TRACKER': <ShowChartIcon />,
      'ACTION': <CalendarMonthIcon />,
      'HANDOFF': <HandshakeIcon />,
    };
    
    // Get preset config for INFO_CAPTURE
    const presetConfig = newItemType === 'INFO_CAPTURE' ? INFO_CAPTURE_PRESETS[selectedPreset] : null;
    
    // Create new conversation item
    const newItem: ConversationItem & { captures?: string[] } = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      kind: kindToNodeKind[newItemType],
      title: newItemTitle.trim(),
      description: presetConfig 
        ? `Captures: ${presetConfig.captures.join(', ') || 'custom fields'}`
        : 'Custom item',
      icon: iconMap[newItemType] || <InfoOutlinedIcon />,
      defaultLane: 'BEFORE_CONTACT',
      captures: presetConfig?.captures || undefined,
    };
    
    // Add to list
    setConversationItems([...conversationItems, newItem] as any);
    
    // Close dialog
    handleCloseDialog();
  };

  // Helper function to create a node from a conversation item
  const createNodeFromItem = (item: ConversationItem & { captures?: string[] }, lane?: string): FlowNode => {
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
    
    // Add captures/produces for INFO_CAPTURE items with presets
    if (item.kind === 'BASELINE_CAPTURE' && item.captures && item.captures.length > 0) {
      newNode.satisfies = {
        metrics: item.captures,
      };
    }

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
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
        Drag items to the canvas
      </Typography>
      
      {/* + New item button */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleOpenDialog}
        fullWidth
        sx={{
          mb: 3,
          textTransform: 'none',
          justifyContent: 'flex-start',
          borderColor: 'divider',
          color: 'text.primary',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        + New item
      </Button>

      <Box>
        {conversationItems.filter(item => !usedItemIds.has(item.id)).map((item) => (
          <DraggableConversationItem 
            key={item.id} 
            item={item} 
            isUsed={false}
          />
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
      
      {/* Create New Item Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create new item</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Item Type Selection */}
            <TextField
              select
              label="Item type"
              value={newItemType}
              onChange={(e) => handleTypeChange(e.target.value as ConversationItemKind)}
              fullWidth
              required
            >
              <MenuItem value="EXPLANATION">Explanation</MenuItem>
              <MenuItem value="REFLECTIVE_QUESTION">Reflective question</MenuItem>
              <MenuItem value="INFO_CAPTURE">Info capture</MenuItem>
              <MenuItem value="GOAL_GAP_TRACKER">Goal gap tracker</MenuItem>
              <MenuItem value="ACTION">Action</MenuItem>
              <MenuItem value="HANDOFF">Handoff</MenuItem>
            </TextField>
            
            {/* Preset Selector (only for INFO_CAPTURE) */}
            {newItemType === 'INFO_CAPTURE' && (
              <TextField
                select
                label="Start from a preset (optional)"
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value as InfoCapturePreset)}
                fullWidth
                size="small"
              >
                <MenuItem value="blank">Blank</MenuItem>
                <MenuItem value="get_name">Get name</MenuItem>
                <MenuItem value="get_contact_info">Get contact info</MenuItem>
              </TextField>
            )}
            
            {/* Title Input */}
            <TextField
              label="Title"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value.slice(0, 60))}
              fullWidth
              required
              helperText={`${newItemTitle.length}/60 characters`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateItem} 
            variant="contained" 
            disabled={!newItemType || !newItemTitle.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

