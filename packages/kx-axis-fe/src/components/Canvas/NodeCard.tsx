import React from 'react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CategoryIcon from '@mui/icons-material/Category';
import EventIcon from '@mui/icons-material/Event';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { FlowNode, NodeKind } from '../../types';
import { getNodeGateRequirements, getNodeGateSatisfactions } from '../../utils/laneLogic';

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

export const NodeCard: React.FC<NodeCardProps> = ({ node, isSelected, onClick, isDraggable = false }) => {
  // Get GATE requirements and satisfactions (not node IDs)
  const gateRequirements = getNodeGateRequirements(node);
  const gateSatisfactions = getNodeGateSatisfactions(node);

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

  return (
    <Paper
      ref={setNodeRef}
      onClick={onClick}
      elevation={isSelected ? 8 : isDragging ? 12 : 1}
      sx={{
        width: 240,
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
        ...style,
      }}
      {...attributes}
      {...listeners}
    >
      {/* Header with icon and drag handle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        {isDraggable && (
          <DragIndicatorIcon sx={{ fontSize: '1rem', color: 'text.disabled' }} />
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

      {/* Chips - ALWAYS VISIBLE */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: 24 }}>
        {/* GOAL_GAP_TRACKER specific chips */}
        {node.kind === 'GOAL_GAP_TRACKER' && (
          <>
            <Chip
              icon={<TrendingUpIcon sx={{ fontSize: '0.8rem' }} />}
              label="Captures: Target + Baseline"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 600,
                backgroundColor: '#E3F2FD',
                color: '#1565C0',
                '& .MuiChip-icon': { color: '#1565C0' },
              }}
            />
            <Chip
              icon={<CategoryIcon sx={{ fontSize: '0.8rem' }} />}
              label="Produces: Delta + Category"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 600,
                backgroundColor: '#F3E5F5',
                color: '#6A1B9A',
                '& .MuiChip-icon': { color: '#6A1B9A' },
              }}
            />
            {node.goalGapTracker?.deadlinePolicyDefault && 
             node.goalGapTracker.deadlinePolicyDefault !== 'INHERIT' && (
              <Chip
                icon={<EventIcon sx={{ fontSize: '0.8rem' }} />}
                label={`Deadline: ${node.goalGapTracker.deadlinePolicyDefault.replace('_', ' ')}`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: '#FFF3E0',
                  color: '#E65100',
                  '& .MuiChip-icon': { color: '#E65100' },
                }}
              />
            )}
          </>
        )}

        {/* Show what gates this node REQUIRES */}
        {gateRequirements.map((gate) => (
          <Chip
            key={`req-${gate}`}
            icon={<LockIcon sx={{ fontSize: '0.8rem' }} />}
            label={`Requires ${gate}`}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 600,
              backgroundColor: '#FFE0B2',
              color: '#E65100',
              '& .MuiChip-icon': {
                color: '#E65100',
              },
            }}
          />
        ))}

        {/* Show what gates this node SATISFIES */}
        {gateSatisfactions.map((gate) => (
          <Chip
            key={`sat-${gate}`}
            icon={<LockOpenIcon sx={{ fontSize: '0.8rem' }} />}
            label={`Unlocks ${gate}`}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 600,
              backgroundColor: '#C8E6C9',
              color: '#2E7D32',
              '& .MuiChip-icon': {
                color: '#2E7D32',
              },
            }}
          />
        ))}
      </Box>
    </Paper>
  );
};

