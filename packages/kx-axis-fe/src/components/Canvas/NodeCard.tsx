import React from 'react';
import { Box, Typography, Paper, IconButton, alpha, Tooltip, Chip } from '@mui/material';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { FlowNode, NodeKind } from '../../types';
import { useFlow } from '../../context/FlowContext';
import { ChipListEditor } from '../shared/ChipListEditor';

// Utility: Convert snake_case to Title Case for display
const toTitleCase = (str: string): string => {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface NodeCardProps {
  node: FlowNode;
  isSelected: boolean;
  onClick: () => void;
  isDraggable?: boolean;
  isLastInLane?: boolean; // Whether this is the last node in the lane
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
  EXPLANATION: '#39D0C9',      // Cyan - fresh, informative
  REFLECTIVE_QUESTION: '#A78BFA', // Soft purple - thoughtful
  GOAL_DEFINITION: '#5A6B7D',  // Blue slate - foundational
  BASELINE_CAPTURE: '#5A6B7D', // Blue slate - data collection
  DEADLINE_CAPTURE: '#A78BFA', // Soft purple - time-sensitive
  GOAL_GAP_TRACKER: '#39D0C9', // Cyan - analytical
  ACTION_BOOKING: '#FF0059',   // Magenta - high-value action
  HANDOFF: '#FF6699',          // Lighter magenta - transition
};

export const NodeCard: React.FC<NodeCardProps> = ({ node, isSelected, onClick, isDraggable = false, isLastInLane = false }) => {
  const { updateNode, removeNode, flow, setPrimaryGoalNode } = useFlow();

  const isPrimaryGoal = flow.primaryGoalNodeId === node.id;

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    removeNode(node.id);
  };

  const handleTogglePrimaryGoal = (event: React.MouseEvent) => {
    event.stopPropagation();
    setPrimaryGoalNode(isPrimaryGoal ? null : node.id);
  };


  // Draggable setup
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: node.id,
    disabled: !isDraggable,
    data: {
      type: 'node',
      node,
    },
  });

  // Right-side drop zone for dependency extension
  const { setNodeRef: setRightDropRef, isOver: isRightDropping } = useDroppable({
    id: `${node.id}-right-drop-zone`,
    data: {
      type: 'dependency-extension',
      targetNode: node,
    },
  });

  // Bottom drop zone for parallel placement (same prerequisites)
  const { setNodeRef: setBottomDropRef, isOver: isBottomDropping } = useDroppable({
    id: `${node.id}-bottom-drop-zone`,
    data: {
      type: 'parallel-placement',
      targetNode: node,
    },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;


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
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative', 
      width: '100%', 
      flex: isLastInLane ? 1 : '0 0 auto', // Expand to fill available space if last in lane
    }}>
      <Box sx={{ display: 'flex', alignItems: 'stretch', position: 'relative', width: '100%', flex: isLastInLane ? 1 : '0 0 auto' }}>
      <Paper
        ref={setNodeRef}
        onClick={onClick}
        data-node-card="true"
        elevation={isSelected ? 8 : isDragging ? 12 : 1}
        sx={{
          flex: 1,
          minHeight: 220, // Minimum height for consistent node sizing
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          boxSizing: 'border-box',
          cursor: 'pointer',
          transition: isDragging ? 'none' : 'all 0.2s ease',
          border: isSelected ? '2px solid' : isPrimaryGoal ? '2px solid' : '1px solid',
          borderColor: isSelected ? NODE_COLORS[node.type] : isPrimaryGoal ? '#FFD700' : 'divider',
          boxShadow: isPrimaryGoal ? `0 0 12px ${alpha('#FFD700', 0.3)}` : undefined,
          '&:hover': {
            elevation: 4,
            borderColor: NODE_COLORS[node.type],
          },
          backgroundColor: isPrimaryGoal ? alpha('#FFD700', 0.03) : 'background.paper',
          opacity: isDragging ? 0.5 : 1,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          ...style,
        }}
        {...attributes}
      >
      {/* Header with icon and drag handle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        {isDraggable && (
          <Box
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            sx={{ display: 'flex', alignItems: 'center' }}
          >
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
          </Box>
        )}
        <Box sx={{ color: NODE_COLORS[node.type] }}>{NODE_ICONS[node.type]}</Box>
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
          {node.type.replace('_', ' ')}
        </Typography>
        <Tooltip title={isPrimaryGoal ? "Primary Goal" : "Set as Primary Goal"}>
          <IconButton
            size="small"
            onClick={handleTogglePrimaryGoal}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag from interfering
            sx={{
              p: 0.5,
              color: isPrimaryGoal ? '#FFD700' : 'text.secondary',
              '&:hover': {
                color: isPrimaryGoal ? '#FFA500' : '#FFD700',
                backgroundColor: alpha('#FFD700', 0.1),
              },
            }}
          >
            {isPrimaryGoal ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <IconButton
          size="small"
          onClick={handleDelete}
          onPointerDown={(e) => e.stopPropagation()} // Prevent drag from interfering
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            color: 'text.primary',
            lineHeight: 1.3,
          }}
        >
          {node.title}
        </Typography>
        {isPrimaryGoal && (
          <Chip
            label="PRIMARY GOAL"
            size="small"
            icon={<StarIcon />}
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 600,
              backgroundColor: alpha('#FFD700', 0.15),
              color: '#B8860B',
              borderColor: '#FFD700',
              border: '1px solid',
              '& .MuiChip-icon': {
                color: '#FFD700',
                fontSize: '0.9rem',
              },
            }}
          />
        )}
      </Box>

      {/* "Unlocked by" subtitle - shows human-readable prerequisites */}
      {node.requires && node.requires.length > 0 && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontSize: '0.65rem',
            color: 'text.disabled',
            mb: 1.5,
          }}
        >
          Unlocked by: {node.requires.map((req, idx) => {
            // Find the node that produces this requirement
            const producer = flow.nodes.find(n => 
              (n.produces && n.produces.includes(req)) || n.id === req
            );
            const displayName = producer ? producer.title : toTitleCase(req);
            return idx === 0 ? displayName : `, ${displayName}`;
          }).join('')}
        </Typography>
      )}

      {/* "After this, we know" section - what facts this capability produces */}
      <ChipListEditor
        label="After this, we know"
        values={node.produces || []}
        onAdd={handleAddProduced}
        onRemove={handleRemoveProduced}
        getDisplayLabel={toTitleCase}
        placeholder="e.g., email, booking_date"
        suggestions={producesSuggestions}
        allowCustom={true}
        emptyText="— Nothing —"
        compact
      />

      {/* "Unlocks" section - what capabilities this enables */}
      {(() => {
        // Find nodes that depend on this node's produced facts
        const unlockedNodes = flow.nodes.filter(otherNode => {
          if (otherNode.id === node.id) return false;
          if (!otherNode.requires) return false;
          
          // Check if any of this node's produces are in the other node's requires
          const thisProduces = node.produces || [];
          return otherNode.requires.some(req => 
            thisProduces.includes(req) || req === node.id
          );
        });

        if (unlockedNodes.length === 0) return null;

        return (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'text.secondary',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                display: 'block',
                mb: 0.75,
              }}
            >
              Unlocks
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {unlockedNodes.map(unlockedNode => (
                <Typography
                  key={unlockedNode.id}
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    color: 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  → {unlockedNode.title}
                </Typography>
              ))}
            </Box>
          </Box>
        );
      })()}

    </Paper>

      {/* Right-side drop zone for dependency extension */}
      <Box
        ref={setRightDropRef}
        sx={{
          width: 80,
          ml: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed',
          borderColor: isRightDropping ? NODE_COLORS[node.type] : alpha('#FFFFFF', 0.15),
          borderRadius: 1,
          backgroundColor: isRightDropping ? alpha(NODE_COLORS[node.type], 0.15) : alpha('#FFFFFF', 0.02),
          transition: 'all 0.2s',
          position: 'relative',
          zIndex: 2, // Ensure right zone is above bottom zone
          pointerEvents: 'auto', // Ensure it captures pointer events
          gap: 0.5,
          '&:hover': {
            borderColor: alpha(NODE_COLORS[node.type], 0.4),
            backgroundColor: alpha(NODE_COLORS[node.type], 0.08),
          },
        }}
      >
        {isRightDropping ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Typography
              sx={{
                fontSize: '1.8rem',
                color: NODE_COLORS[node.type],
                fontWeight: 'bold',
                lineHeight: 1,
              }}
            >
              →
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                color: NODE_COLORS[node.type],
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              Extend
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, px: 1 }}>
            <Typography
              sx={{
                fontSize: '1.2rem',
                color: 'text.disabled',
                lineHeight: 1,
              }}
            >
              +
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6rem',
                color: 'text.disabled',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              Drop to add dependency
            </Typography>
          </Box>
        )}
      </Box>
      </Box>

      {/* Bottom drop zone for parallel placement (same prerequisites) */}
      <Box
        ref={setBottomDropRef}
        sx={{
          width: '100%',
          mt: 1,
          mb: 1, // Consistent spacing for all nodes
          height: 60, // Fixed height for all drop zones
          flex: '0 0 auto', // Never expand - always fixed size
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed',
          borderColor: isBottomDropping ? NODE_COLORS[node.type] : alpha('#FFFFFF', 0.12),
          borderRadius: 1,
          backgroundColor: isBottomDropping ? alpha(NODE_COLORS[node.type], 0.12) : 'transparent',
          transition: 'all 0.2s',
          position: 'relative',
          zIndex: 1, // Lower than right zone
          '&:hover': {
            borderColor: alpha(NODE_COLORS[node.type], 0.3),
            backgroundColor: alpha(NODE_COLORS[node.type], 0.05),
          },
        }}
      >
        {isBottomDropping ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              sx={{
                fontSize: '1.5rem',
                color: NODE_COLORS[node.type],
                fontWeight: 'bold',
                lineHeight: 1,
              }}
            >
              ↓
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                color: NODE_COLORS[node.type],
                fontWeight: 600,
              }}
            >
              Add Parallel Item
            </Typography>
          </Box>
        ) : (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.6rem',
              color: 'text.disabled',
              textAlign: 'center',
            }}
          >
            Drop to add another available item
          </Typography>
        )}
      </Box>
    </Box>
  );
};

