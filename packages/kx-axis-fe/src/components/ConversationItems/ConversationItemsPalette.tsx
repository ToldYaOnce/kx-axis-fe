import React, { useState } from 'react';
import {
  Box,
  Typography,
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
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HandshakeIcon from '@mui/icons-material/Handshake';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import PresentationChartIcon from '@mui/icons-material/BarChart';
import CodeIcon from '@mui/icons-material/Code';
import PlugIcon from '@mui/icons-material/Cable';
import SupportIcon from '@mui/icons-material/SupportAgent';
import ShieldIcon from '@mui/icons-material/Shield';
import HealthIcon from '@mui/icons-material/MedicalServices';
import ClipboardIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import SignupIcon from '@mui/icons-material/HowToReg';
import ChecklistIcon from '@mui/icons-material/Checklist';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import GiftIcon from '@mui/icons-material/CardGiftcard';
import RulerIcon from '@mui/icons-material/Straighten';
import ReturnIcon from '@mui/icons-material/Undo';
import StarIcon from '@mui/icons-material/Star';
import DocumentIcon from '@mui/icons-material/Description';
import BlueprintIcon from '@mui/icons-material/Architecture';
import CalculatorIcon from '@mui/icons-material/Calculate';
import ClockIcon from '@mui/icons-material/Schedule';
import PeopleIcon from '@mui/icons-material/People';
import PaletteIcon from '@mui/icons-material/Palette';
import HomeIcon from '@mui/icons-material/Home';
import MapIcon from '@mui/icons-material/Map';
import FitnessIcon from '@mui/icons-material/FitnessCenter';
import NutritionIcon from '@mui/icons-material/Restaurant';
import WarningIcon from '@mui/icons-material/Warning';
import BedIcon from '@mui/icons-material/Hotel';
import VipIcon from '@mui/icons-material/WorkspacePremium';
import GavelIcon from '@mui/icons-material/Gavel';
import HeartIcon from '@mui/icons-material/Favorite';
import CardIcon from '@mui/icons-material/CreditCard';
import { useFlow } from '../../context/FlowContext';
import type { FlowNode, NodeKind } from '../../types';
import { getConversationItemsForIndustry } from '../../utils/conversationItems';

interface ConversationItem {
  id: string;
  type: NodeKind;  // Backend expects 'type'
  title: string;
  description: string;
  icon: React.ReactElement;
  defaultLane: 'BEFORE_CONTACT' | 'CONTACT_GATE' | 'AFTER_CONTACT' | 'AFTER_BOOKING';
  captures?: string[]; // For INFO_CAPTURE items
  badge?: string; // Optional badge like "NEW"
}

// Draggable conversation capability card
const ConversationItemCard: React.FC<{ 
  item: ConversationItem & { captures?: string[] }; 
  isUsed: boolean;
}> = ({ item, isUsed }) => {
  // Make card draggable
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.id}`,
    disabled: isUsed,
    data: {
      type: 'palette-item',
      item,
    },
  });

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
        opacity: isUsed ? 0.5 : (isDragging ? 0.5 : 1),
        position: 'relative',
        backgroundColor: isUsed ? 'action.disabledBackground' : 'background.paper',
        cursor: isUsed ? 'default' : 'grab',
        '&:hover': isUsed ? {} : {
          borderColor: 'primary.main',
          bgcolor: 'action.hover',
        },
        '&:active': {
          cursor: isUsed ? 'default' : 'grabbing',
        },
        userSelect: 'none',
        ...style,
      }}
      {...attributes}
      {...listeners}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, px: 2, gap: 1.5 }}>
        {/* Icon */}
        <Box sx={{ color: isUsed ? 'action.disabled' : 'text.secondary', display: 'flex', alignItems: 'center' }}>
          {item.icon}
        </Box>
        
        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: isUsed ? 'text.disabled' : 'text.primary' }}>
              {item.title}
            </Typography>
            {item.badge && !isUsed && (
              <Typography
                variant="caption"
                sx={{
                  backgroundColor: 'rgba(100, 116, 139, 0.2)',
                  color: 'primary.main',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                }}
              >
                {item.badge}
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
                ADDED
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

        {/* Drag Handle */}
        {!isUsed && (
          <Box sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center' }}>
            <DragIndicatorIcon fontSize="small" />
          </Box>
        )}
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
  const { flow } = useFlow();
  
  // Get conversation items based on flow's industry
  const getItemsForFlow = React.useMemo(() => {
    const jsonItems = getConversationItemsForIndustry(flow.industry);
    
    // Map JSON items to component items with icons
    return jsonItems.map(item => {
      // Map icon names to actual icons
      const iconMap: Record<string, React.ReactElement> = {
        // General
        info: <InfoOutlinedIcon />,
        question: <QuestionAnswerIcon />,
        trend: <ShowChartIcon />,
        contact: <ContactMailIcon />,
        calendar: <CalendarMonthIcon />,
        tag: <LocalOfferIcon />,
        handoff: <HandshakeIcon />,
        // Finance
        chart: <ShowChartIcon />,
        account: <AccountBalanceIcon />,
        target: <GpsFixedIcon />,
        checkmark: <CheckCircleOutlineIcon />,
        // Technology
        presentation: <PresentationChartIcon />,
        code: <CodeIcon />,
        plug: <PlugIcon />,
        support: <SupportIcon />,
        // Healthcare
        shield: <ShieldIcon />,
        health: <HealthIcon />,
        clipboard: <ClipboardIcon />,
        // Education
        school: <SchoolIcon />,
        signup: <SignupIcon />,
        checklist: <ChecklistIcon />,
        money: <MoneyIcon />,
        // Retail
        gift: <GiftIcon />,
        ruler: <RulerIcon />,
        return: <ReturnIcon />,
        star: <StarIcon />,
        // Manufacturing
        document: <DocumentIcon />,
        blueprint: <BlueprintIcon />,
        calculator: <CalculatorIcon />,
        clock: <ClockIcon />,
        // Marketing
        people: <PeopleIcon />,
        palette: <PaletteIcon />,
        // Real Estate
        home: <HomeIcon />,
        map: <MapIcon />,
        // Fitness & Wellness
        fitness: <FitnessIcon />,
        nutrition: <NutritionIcon />,
        warning: <WarningIcon />,
        // Hospitality
        bed: <BedIcon />,
        vip: <VipIcon />,
        // Legal
        gavel: <GavelIcon />,
        // Non-profit
        heart: <HeartIcon />,
        card: <CardIcon />,
      };
      
      return {
        id: item.id,
        type: item.type as NodeKind,
        title: item.title,
        description: item.description,
        icon: iconMap[item.icon || 'info'] || <InfoOutlinedIcon />,
        defaultLane: 'BEFORE_CONTACT' as const,
        badge: item.badge,
      };
    });
  }, [flow.industry]);
  
  // State for dynamic conversation items
  const [conversationItems, setConversationItems] = useState<ConversationItem[]>(getItemsForFlow);
  
  // State for "+ New item" dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItemType, setNewItemType] = useState<ConversationItemKind | ''>('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<InfoCapturePreset>('blank');

  // Update conversation items when industry changes
  React.useEffect(() => {
    setConversationItems(getItemsForFlow);
  }, [getItemsForFlow]);

  // Track which items are already on the canvas
  const usedItemIds = new Set<string>();
  
  flow.nodes.forEach((node) => {
    // Check ALL conversation items to see if they're on the canvas
    conversationItems.forEach((item) => {
      // Method 1: Check if node ID starts with item ID (for items dragged from palette)
      // e.g., node.id = "welcome-1234567890" matches item.id = "welcome"
      if (node.id.startsWith(item.id)) {
        usedItemIds.add(item.id);
        return;
      }
      
      // Method 2: For preset-based items, match by title and kind
      // e.g., "Get name" preset items created via dialog
      if (item.captures && item.captures.length > 0) {
        if (node.title === item.title && node.type === item.type) {
          usedItemIds.add(item.id);
          return;
        }
      }
      
      // Method 3: For custom items created via dialog, match by exact ID
      if (node.id === item.id) {
        usedItemIds.add(item.id);
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
      type: kindToNodeKind[newItemType],
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
      type: item.type,
      title: item.title,
      requires: [], // Initialize with empty array (no prerequisites by default)
      produces: [], // Initialize with empty array (will be set per node type)
      ui: {
        x: 0,
        y: 0,
        lane: targetLane,
      },
    };
    
    // Add default produces for EXPLANATION nodes
    if (item.type === 'EXPLANATION') {
      // Generate a fact name based on the node ID (e.g., "welcome_intro_shown")
      const factName = `${item.id.replace(/-/g, '_')}_shown`;
      newNode.produces = [factName];
    }

    // Add default produces for REFLECTIVE_QUESTION nodes
    if (item.type === 'REFLECTIVE_QUESTION') {
      // Generate a fact name based on the node ID (e.g., "reflective_question_answered")
      const factName = `${item.id.replace(/-/g, '_')}_answered`;
      newNode.produces = [factName];
    }

    // Add captures/produces for INFO_CAPTURE items with presets
    if (item.type === 'BASELINE_CAPTURE' && item.captures && item.captures.length > 0) {
      newNode.satisfies = {
        metrics: item.captures,
      };
    }

    // Add default config for GOAL_GAP_TRACKER
    if (item.type === 'GOAL_GAP_TRACKER') {
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
      newNode.produces = ['goal_target', 'goal_baseline', 'goal_delta', 'goal_category'];
    }

    // Add default config for contact capture
    if (item.id === 'contact-capture' && item.type === 'BASELINE_CAPTURE') {
      newNode.satisfies = {
        gates: ['CONTACT'],
        metrics: ['contact_email', 'contact_phone'],
      };
      newNode.produces = ['contact_email', 'contact_phone'];
    }

    // Add default config for cancel appointment (special case)
    if (item.id === 'cancel-appointment') {
      // Requires an existing booking to cancel
      newNode.requires = ['booking_date'];
      // Produces cancellation fact - controller can use this to unset BOOKING goal
      newNode.produces = ['appointment_cancelled'];
      // Cancel appointment does not satisfy BOOKING gate
    }
    // Add default config for booking (general ACTION_BOOKING nodes)
    else if (item.type === 'ACTION_BOOKING') {
      // No default requires - let user add dependencies via drag/drop
      newNode.satisfies = {
        gates: ['BOOKING'],
        metrics: ['booking_date'],
      };
      newNode.produces = ['booking_date', 'booking_type'];
    }

    // Add default config for handoff
    if (item.type === 'HANDOFF') {
      // No default requires - let user add dependencies via drag/drop
      newNode.satisfies = {
        gates: ['HANDOFF'],
        states: ['HANDOFF_COMPLETE'],
      };
      newNode.produces = ['handoff_complete'];
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

  // Note: Items are added via drag-and-drop now, handled by Canvas

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
        Conversation Capabilities
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
        Drag capabilities to add them to your requirement tree
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
        {conversationItems.map((item) => (
          <ConversationItemCard 
            key={item.id} 
            item={item} 
            isUsed={usedItemIds.has(item.id)}
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

