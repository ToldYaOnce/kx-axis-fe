import React, { useState } from 'react';
import { Box, Typography, Chip, Paper, IconButton } from '@mui/material';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { FlowNode, NodeKind } from '../../types';
import { getNodeGateRequirements, getNodeGateSatisfactions } from '../../utils/laneLogic';
import { useFlow } from '../../context/FlowContext';
import { ChipListEditor } from '../shared/ChipListEditor';

interface NodeCardProps {
  node: FlowNode;
  isSelected: boolean;
  onClick: () => void;
  isDraggable?: boolean;
}

const NODE_ICONS: Record<NodeKind, React.ReactElement> = {
  EXPLANATION: <InfoOutlinedIcon fontSize="small" />,
  REFLECTIVE_QUESTION: <QuestionAnswerIcon fontSize="small" />,
  GOAL_DEFINITION: <DataObjectIcon fontSize="small" />,
  BASELINE_CAPTURE: <DataObjectIcon fontSize="small" />,
  DEADLINE_CAPTURE: <CalendarMonthIcon fontSize="small" />,
  GOAL_GAP_TRACKER: <ShowChartIcon fontSize="small" />,
  ACTION_BOOKING: <CalendarMonthIcon fontSize="small" />,
  HANDOFF: <HandshakeIcon fontSize="small" />,
};

const NODE_COLORS: Record<NodeKind, string> = {
  EXPLANATION: '#50C878',
  REFLECTIVE_QUESTION: '#F5A623',
  GOAL_DEFINITION: '#4A90E2',
  BASELINE_CAPTURE: '#4A90E2',
  DEADLINE_CAPTURE: '#9B59B6',
  GOAL_GAP_TRACKER: '#E91E63',
  ACTION_BOOKING: '#7B68EE',
  HANDOFF: '#E94B3C',
};

// Determine if node is a Data Capture node (shows inline requirements)
const isDataCaptureNode = (kind: NodeKind): boolean => {
  return ['BASELINE_CAPTURE', 'GOAL_DEFINITION', 'DEADLINE_CAPTURE'].includes(kind);
};

export const NodeCard: React.FC<NodeCardProps> = ({ node, isSelected, onClick, isDraggable = false }) => {
  const { updateNode, removeNode, flow } = useFlow();

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    removeNode(node.id);
  };

  // Get GATE requirements and satisfactions (not node IDs)
  const gateRequirements = getNodeGateRequirements(node);
  const gateSatisfactions = getNodeGateSatisfactions(node);

  // Calculate which OTHER NODES this node unlocks
  // (nodes that require gates this node satisfies)
  const unlockedNodes = flow.nodes.filter((otherNode) => {
    if (otherNode.id === node.id) return false;
    const otherRequires = getNodeGateRequirements(otherNode);
    return gateSatisfactions.some((gate) => otherRequires.includes(gate));
  });

  // Draggable setup
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
    disabled: !isDraggable,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  // Prerequisites management
  const handleAddPrerequisite = (value: string) => {
    const currentRequires = node.requires || [];
    if (!currentRequires.includes(value)) {
      updateNode(node.id, {
        requires: [...currentRequires, value],
      });
    }
  };

  const handleRemovePrerequisite = (value: string) => {
    const currentRequires = node.requires || [];
    updateNode(node.id, {
      requires: currentRequires.filter((id) => id !== value),
    });
  };

  // Produces management
  const handleAddProduced = (value: string) => {
    const currentProduces = node.produces || [];
    if (!currentProduces.includes(value)) {
      updateNode(node.id, {
        produces: [...currentProduces, value],
      });
    }
  };

  const handleRemoveProduced = (value: string) => {
    const currentProduces = node.produces || [];
    updateNode(node.id, {
      produces: currentProduces.filter((id) => id !== value),
    });
  };

  // Prerequisite suggestions (gates + other nodes)
  const prerequisiteSuggestions = [
    { value: 'CONTACT', label: 'Contact', description: 'Email or phone required' },
    { value: 'BOOKING', label: 'Booking', description: 'Appointment scheduled' },
    ...flow.nodes
      .filter((n) => n.id !== node.id)
      .map((n) => ({
        value: n.id,
        label: n.title,
        description: undefined,
      })),
  ];

  // Produces suggestions (from other nodes + common facts)
  const commonFacts = ['email', 'phone', 'name', 'booking_date', 'booking_type', 'goal', 'target', 'baseline', 'delta', 'category'];
  const existingProduces = new Set(
    flow.nodes.flatMap((n) => n.produces || [])
  );
  const producesSuggestions = [
    ...Array.from(existingProduces).map((fact) => ({
      value: fact,
      label: fact,
      description: undefined,
    })),
    ...commonFacts
      .filter((fact) => !existingProduces.has(fact))
      .map((fact) => ({
        value: fact,
        label: fact,
        description: undefined,
      })),
  ];

  return (
    <Paper
      ref={setNodeRef}
      onClick={onClick}
      elevation={isSelected ? 8 : isDragging ? 12 : 1}
      sx={{
        width: '100%',
        minHeight: 120,
        p: 2,
        cursor: isDraggable ? 'grab' : 'pointer',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        border: isSelected ? '2px solid' : '1px solid',
        borderColor: isSelected ? NODE_COLORS[node.kind] : 'divider',
        '&:hover': {
          elevation: 4,
          borderColor: NODE_COLORS[node.kind],
        },
        backgroundColor: 'background.paper',
        opacity: isDragging ? 0.5 : 1,
        userSelect: 'none', // Prevent text selection during drag
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        '&:active': {
          cursor: isDraggable ? 'grabbing' : 'pointer',
        },
        ...style,
      }}
      {...attributes}
      {...listeners}
    >
      {/* Header with icon and drag handle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        {isDraggable && (
          <DragIndicatorIcon 
            sx={{ 
              fontSize: '1.2rem', 
              color: 'text.secondary',
              cursor: 'grab',
              '&:hover': {
                color: 'primary.main',
              },
              '&:active': {
                cursor: 'grabbing',
              },
            }} 
          />
        )}
        <Box sx={{ color: NODE_COLORS[node.kind] }}>{NODE_ICONS[node.kind]}</Box>
        <Typography
          variant="caption"
          sx={{
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: 0.5,
            color: 'text.secondary',
            flex: 1,
          }}
        >
          {node.kind.replace('_', ' ')}
        </Typography>
        <IconButton
          size="small"
          onClick={handleDelete}
          sx={{
            p: 0.5,
            color: 'text.secondary',
            '&:hover': {
              color: 'error.main',
              backgroundColor: 'error.light',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Title */}
      <Typography
        variant="body1"
        sx={{
          fontWeight: 500,
          mb: 2,
          color: 'text.primary',
          lineHeight: 1.3,
        }}
      >
        {node.title}
      </Typography>

      {/* "Must know before" section - editable prerequisites */}
      <ChipListEditor
        label="Must know before"
        values={node.requires || []}
        onAdd={handleAddPrerequisite}
        onRemove={handleRemovePrerequisite}
        placeholder="Add prerequisite"
        suggestions={prerequisiteSuggestions}
        allowCustom={false}
        emptyText="— None —"
        compact
      />

      {/* "After this, we know" section - editable produces */}
      <ChipListEditor
        label="After this, we know"
        values={node.produces || []}
        onAdd={handleAddProduced}
        onRemove={handleRemoveProduced}
        placeholder="e.g., email, booking_date"
        suggestions={producesSuggestions}
        allowCustom={true}
        emptyText="— Nothing —"
        compact
      />

      {/* "Unlocks" section - visually subordinate */}
      {unlockedNodes.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {unlockedNodes.map((unlockedNode) => (
              <Chip
                key={`unlocks-${unlockedNode.id}`}
                icon={<LockOpenIcon sx={{ fontSize: '0.7rem' }} />}
                label={`unlocks ${unlockedNode.title}`}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.6rem',
                  fontWeight: 400,
                  backgroundColor: 'transparent',
                  border: '1px solid',
                  borderColor: 'success.light',
                  color: 'text.disabled',
                  '& .MuiChip-icon': {
                    color: 'success.light',
                    fontSize: '0.7rem',
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

    </Paper>
  );
};

