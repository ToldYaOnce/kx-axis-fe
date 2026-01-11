import React, { useState } from 'react';
import { Box, Typography, Chip, Paper, Divider, IconButton, Popover, List, ListItem, ListItemButton, ListItemText, ListItemIcon } from '@mui/material';
import DataObjectIcon from '@mui/icons-material/DataObject';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ContactMailIcon from '@mui/icons-material/ContactMail';
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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { FlowNode, NodeKind } from '../../types';
import { getNodeGateRequirements, getNodeGateSatisfactions } from '../../utils/laneLogic';
import { useFlow } from '../../context/FlowContext';

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
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [gateAnchorEl, setGateAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    removeNode(node.id);
  };

  // Get other nodes that can be prerequisites (exclude this node and GATE nodes)
  const availablePrerequisiteNodes = flow.nodes.filter(
    (n) => n.id !== node.id && n.kind !== 'CONTACT_GATE'
  );
  
  // Available gates that can be added as requirements
  const AVAILABLE_GATES = ['CONTACT', 'BOOKING'];
  const availableGatesToAdd = AVAILABLE_GATES.filter(g => !gateRequirements.includes(g));

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

  // Get required node IDs (prerequisites - other nodes that must run first)
  const requiredNodeIds = node.requires || [];
  const isDataCapture = isDataCaptureNode(node.kind);

  // Handlers for inline requirement editing (node prerequisites)
  const handleAddRequirementClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleAddRequirement = (nodeId: string) => {
    const currentRequires = node.requires || [];
    if (!currentRequires.includes(nodeId)) {
      updateNode(node.id, {
        requires: [...currentRequires, nodeId],
      });
    }
    setAnchorEl(null);
  };

  const handleRemoveRequirement = (event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation();
    const currentRequires = node.requires || [];
    updateNode(node.id, {
      requires: currentRequires.filter((id) => id !== nodeId),
    });
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const popoverOpen = Boolean(anchorEl);

  return (
    <Paper
      ref={setNodeRef}
      onClick={onClick}
      elevation={isSelected ? 8 : isDragging ? 12 : 1}
      sx={{
        width: 280,
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

      {/* Inline "Must know before" section for Data Capture nodes */}
      {isDataCapture && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'text.secondary',
                display: 'block',
                mb: 1,
              }}
            >
              Must know before
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
              {requiredNodeIds.map((nodeId) => {
                const requiredNode = flow.nodes.find((n) => n.id === nodeId);
                return (
                  <Chip
                    key={nodeId}
                    label={requiredNode?.title || nodeId}
                    size="small"
                    onDelete={(e) => handleRemoveRequirement(e, nodeId)}
                    deleteIcon={<CloseIcon sx={{ fontSize: '0.9rem' }} />}
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      backgroundColor: 'transparent',
                      border: '1px solid',
                      borderColor: 'divider',
                      color: 'text.secondary',
                      '& .MuiChip-deleteIcon': {
                        color: 'text.disabled',
                        '&:hover': {
                          color: 'text.secondary',
                        },
                      },
                    }}
                  />
                );
              })}
              <IconButton
                size="small"
                onClick={handleAddRequirementClick}
                sx={{
                  width: 20,
                  height: 20,
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <AddCircleOutlineIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Box>
          </Box>
        </>
      )}

      {/* Inline "Needs before" section - EDITABLE for lane control */}
      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'text.secondary',
            display: 'block',
            mb: 0.5,
          }}
        >
          Needs before
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
          {gateRequirements.map((gate) => (
            <Chip
              key={gate}
              label={gate.toLowerCase()}
              size="small"
              onDelete={(e) => {
                e.stopPropagation();
                // Remove this gate requirement
                const newRequires = (node.requires || []).filter(r => r !== gate);
                updateNode(node.id, { requires: newRequires });
              }}
              deleteIcon={<CloseIcon sx={{ fontSize: '0.9rem' }} />}
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 500,
                backgroundColor: 'transparent',
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                '& .MuiChip-deleteIcon': {
                  color: 'text.disabled',
                  '&:hover': {
                    color: 'error.main',
                  },
                },
              }}
            />
          ))}
          {/* Add gate requirement button */}
          {availableGatesToAdd.length > 0 && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setGateAnchorEl(e.currentTarget);
              }}
              sx={{
                width: 20,
                height: 20,
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <AddCircleOutlineIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          )}
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            color: 'text.disabled',
            fontStyle: 'italic',
            display: 'block',
            mt: 0.5,
          }}
        >
          Controls which lane this item appears in
        </Typography>
      </Box>

      {/* Chips - ALWAYS VISIBLE */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: 24, mt: 1.5 }}>
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

        {/* Show which OTHER NODES this node unlocks */}
        {unlockedNodes.map((unlockedNode) => (
          <Chip
            key={`unlocks-${unlockedNode.id}`}
            icon={<LockOpenIcon sx={{ fontSize: '0.8rem' }} />}
            label={`Unlocks ${unlockedNode.title}`}
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

      {/* Popover for adding node requirements */}
      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <List sx={{ py: 0.5, minWidth: 200 }}>
          {availablePrerequisiteNodes.filter((n) => !requiredNodeIds.includes(n.id)).map((n) => (
            <ListItemButton
              key={n.id}
              onClick={() => handleAddRequirement(n.id)}
              sx={{ py: 1, px: 2 }}
            >
              <ListItemText
                primary={n.title}
                primaryTypographyProps={{
                  variant: 'body2',
                  sx: { fontSize: '0.8rem' },
                }}
              />
            </ListItemButton>
          ))}
          {availablePrerequisiteNodes.filter((n) => !requiredNodeIds.includes(n.id)).length === 0 && (
            <ListItemButton disabled sx={{ py: 1, px: 2 }}>
              <ListItemText
                primary="No other nodes available"
                primaryTypographyProps={{
                  variant: 'body2',
                  sx: { fontSize: '0.8rem', fontStyle: 'italic' },
                }}
              />
            </ListItemButton>
          )}
        </List>
      </Popover>
      
      {/* Popover for adding gate requirements (controls lane placement) */}
      <Popover
        open={Boolean(gateAnchorEl)}
        anchorEl={gateAnchorEl}
        onClose={(e: any) => {
          e?.stopPropagation?.();
          setGateAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <List sx={{ py: 0.5, minWidth: 180 }}>
          <ListItem sx={{ py: 0, px: 2, pb: 0.5 }}>
            <ListItemText
              primary="Add gate requirement"
              primaryTypographyProps={{
                variant: 'caption',
                sx: { fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' },
              }}
            />
          </ListItem>
          {availableGatesToAdd.map((gate) => (
            <ListItemButton
              key={gate}
              onClick={(e) => {
                e.stopPropagation();
                const newRequires = [...(node.requires || []), gate];
                updateNode(node.id, { requires: newRequires });
                setGateAnchorEl(null);
              }}
              sx={{ py: 1, px: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {gate === 'CONTACT' ? <ContactMailIcon fontSize="small" /> : <CalendarMonthIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText
                primary={gate === 'CONTACT' ? 'Contact' : 'Booking'}
                secondary={gate === 'CONTACT' ? 'Requires contact info' : 'Requires booking'}
                primaryTypographyProps={{
                  variant: 'body2',
                  sx: { fontSize: '0.8rem', fontWeight: 500 },
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                  sx: { fontSize: '0.7rem' },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </Paper>
  );
};

