import React from 'react';
import { Box, Typography, Paper, IconButton, alpha, Tooltip, Divider } from '@mui/material';
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
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { FlowNode, NodeKind } from '../../types';
import { useFlow } from '../../context/FlowContext';

// Utility: Convert snake_case to Title Case
const toTitleCase = (str: string): string => {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface CompactNodeCardProps {
  node: FlowNode;
  isSelected: boolean;
  onClick: () => void;
  height?: string; // Dynamic height in em units
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
  EXPLANATION: '#39D0C9',
  REFLECTIVE_QUESTION: '#A78BFA',
  GOAL_DEFINITION: '#5A6B7D',
  BASELINE_CAPTURE: '#5A6B7D',
  DEADLINE_CAPTURE: '#A78BFA',
  GOAL_GAP_TRACKER: '#39D0C9',
  ACTION_BOOKING: '#FF0059',
  HANDOFF: '#FF6699',
};

export const CompactNodeCard: React.FC<CompactNodeCardProps> = ({ node, isSelected, onClick, height = '3em' }) => {
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
    data: {
      type: 'compact-node',
      node,
    },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  // Get prerequisite nodes
  const getPrerequisites = () => {
    if (!node.requires || node.requires.length === 0) return [];
    return node.requires.map((req) => {
      const producer = flow.nodes.find(n => 
        (n.produces && n.produces.includes(req)) || n.id === req
      );
      return producer ? producer.title : toTitleCase(req);
    });
  };

  // Get unlocked nodes
  const getUnlockedNodes = () => {
    return flow.nodes.filter(otherNode => {
      if (otherNode.id === node.id) return false;
      if (!otherNode.requires) return false;
      const thisProduces = node.produces || [];
      return otherNode.requires.some(req => 
        thisProduces.includes(req) || req === node.id
      );
    });
  };

  const prerequisites = getPrerequisites();
  const unlockedNodes = getUnlockedNodes();
  const produces = node.produces || [];

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1.5, minWidth: '280px', maxWidth: '400px' }}>
          {/* Header Section */}
          <Box sx={{ mb: 1.5 }}>
            {/* Title with Icon */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box sx={{ color: NODE_COLORS[node.type], display: 'flex' }}>
                {NODE_ICONS[node.type]}
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: NODE_COLORS[node.type], flex: 1 }}>
                {node.title}
              </Typography>
            </Box>
            
            {/* Type */}
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', ml: 4 }}>
              {toTitleCase(node.type)}
            </Typography>
            
            {/* Primary Goal Badge */}
            {isPrimaryGoal && (
              <Box sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, bgcolor: alpha('#FFD700', 0.15), borderRadius: 1, border: `1px solid ${alpha('#FFD700', 0.3)}` }}>
                <StarIcon sx={{ fontSize: '0.875rem', color: '#FFD700' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#FFD700' }}>
                  PRIMARY GOAL
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Purpose */}
          {node.purpose && (
            <>
              <Typography variant="body2" sx={{ mb: 1.5, fontStyle: 'italic', color: 'text.secondary', fontSize: '0.875rem' }}>
                {node.purpose}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
            </>
          )}
          
          {/* Prerequisites */}
          {prerequisites.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <LockOpenIcon sx={{ fontSize: '1rem', color: '#A78BFA' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Unlocked by
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ pl: 3, color: 'text.primary', fontSize: '0.875rem' }}>
                {prerequisites.join(', ')}
              </Typography>
            </Box>
          )}
          
          {/* Produces Facts */}
          {produces.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <AssessmentIcon sx={{ fontSize: '1rem', color: '#39D0C9' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#39D0C9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Produces facts
                </Typography>
              </Box>
              <Box component="ul" sx={{ pl: 3.5, m: 0, listStyleType: 'disc' }}>
                {produces.map((fact, idx) => (
                  <Box component="li" key={idx} sx={{ mb: 0.25 }}>
                    <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem' }}>
                      {toTitleCase(fact)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          {/* Unlocks */}
          {unlockedNodes.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <RocketLaunchIcon sx={{ fontSize: '1rem', color: '#FF6699' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#FF6699', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Unlocks
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ pl: 3, color: 'text.primary', fontSize: '0.875rem' }}>
                {unlockedNodes.map(n => n.title).join(', ')}
              </Typography>
            </Box>
          )}
        </Box>
      }
      placement="top"
      arrow
    >
      <Paper
        ref={setNodeRef}
        onClick={onClick}
        elevation={isSelected ? 8 : isDragging ? 12 : 1}
        sx={{
          width: '18em',
          height: height,
          minHeight: height,
          maxHeight: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5em',
          p: '0.5em',
          pl: '0.75em', // Extra padding for accent bar
          boxSizing: 'border-box',
          cursor: 'pointer',
          position: 'relative',
          transition: isDragging ? 'none' : 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '2px solid',
          borderColor: isSelected ? NODE_COLORS[node.type] : '#3A4552',
          boxShadow: isSelected 
            ? `0 4px 20px ${alpha(NODE_COLORS[node.type], 0.3)}, 0 0 0 1px ${alpha(NODE_COLORS[node.type], 0.5)}`
            : isPrimaryGoal 
            ? `0 4px 16px ${alpha('#FFD700', 0.25)}, 0 0 0 1px ${alpha('#FFD700', 0.2)}`
            : `0 2px 8px ${alpha('#000000', 0.2)}`,
          '&:hover': {
            elevation: 6,
            transform: isDragging ? 'none' : 'translateY(-2px)',
            boxShadow: `0 8px 24px ${alpha(NODE_COLORS[node.type], 0.35)}, 0 0 0 2px ${alpha(NODE_COLORS[node.type], 0.4)}`,
            '& .accent-bar': {
              width: '6px',
              boxShadow: `0 0 12px ${alpha(NODE_COLORS[node.type], 0.6)}`,
            },
            '& .node-icon': {
              filter: `drop-shadow(0 0 8px ${alpha(NODE_COLORS[node.type], 0.8)})`,
              transform: 'scale(1.1)',
            },
          },
          backgroundColor: isPrimaryGoal 
            ? `linear-gradient(135deg, ${alpha('#FFD700', 0.15)} 0%, ${alpha('#2A3542', 0.95)} 50%)`
            : '#2A3542',
          backgroundImage: isPrimaryGoal 
            ? `linear-gradient(135deg, ${alpha('#FFD700', 0.08)} 0%, transparent 100%)`
            : `linear-gradient(135deg, ${alpha(NODE_COLORS[node.type], 0.05)} 0%, transparent 100%)`,
          opacity: isDragging ? 0.5 : 1,
          userSelect: 'none',
          overflow: 'hidden',
          ...style,
          // Left accent bar
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            backgroundColor: isPrimaryGoal ? '#FFD700' : NODE_COLORS[node.type],
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 8px ${alpha(isPrimaryGoal ? '#FFD700' : NODE_COLORS[node.type], 0.4)}`,
            className: 'accent-bar',
          },
        }}
        {...attributes}
      >
        {/* Drag handle */}
        <Box
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexShrink: 0,
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.1)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          <DragIndicatorIcon 
            sx={{ 
              fontSize: '1em', 
              color: alpha(NODE_COLORS[node.type], 0.6),
              cursor: 'grab',
              transition: 'all 0.2s',
              '&:hover': {
                color: NODE_COLORS[node.type],
                filter: `drop-shadow(0 0 4px ${alpha(NODE_COLORS[node.type], 0.6)})`,
              },
              '&:active': {
                cursor: 'grabbing',
              },
            }} 
          />
        </Box>

        {/* Icon with glow */}
        <Box 
          className="node-icon"
          sx={{ 
            color: NODE_COLORS[node.type], 
            display: 'flex', 
            flexShrink: 0,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 4px ${alpha(NODE_COLORS[node.type], 0.4)})`,
          }}
        >
          {NODE_ICONS[node.type]}
        </Box>

        {/* Title with metadata badge */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: 'text.primary',
              lineHeight: 1.2,
              fontSize: '0.875rem',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {node.title}
          </Typography>
          {/* Fact count badge */}
          {produces.length > 0 && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '1.25em',
                height: '1.25em',
                px: 0.5,
                borderRadius: '0.625em',
                backgroundColor: alpha(NODE_COLORS[node.type], 0.2),
                border: `1px solid ${alpha(NODE_COLORS[node.type], 0.4)}`,
                fontSize: '0.625rem',
                fontWeight: 700,
                color: NODE_COLORS[node.type],
                flexShrink: 0,
              }}
            >
              {produces.length}
            </Box>
          )}
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', gap: '0.25em', flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={handleTogglePrimaryGoal}
            onPointerDown={(e) => e.stopPropagation()}
            sx={{
              p: '0.25em',
              color: isPrimaryGoal ? '#FFD700' : 'text.secondary',
              transition: 'all 0.2s',
              '&:hover': {
                color: isPrimaryGoal ? '#FFA500' : '#FFD700',
                backgroundColor: alpha('#FFD700', 0.15),
                transform: 'scale(1.1)',
                boxShadow: `0 0 8px ${alpha('#FFD700', 0.3)}`,
              },
            }}
          >
            {isPrimaryGoal ? <StarIcon sx={{ fontSize: '1em' }} /> : <StarBorderIcon sx={{ fontSize: '1em' }} />}
          </IconButton>
          
          <IconButton
            size="small"
            onClick={handleDelete}
            onPointerDown={(e) => e.stopPropagation()}
            sx={{
              p: '0.25em',
              color: 'text.secondary',
              transition: 'all 0.2s',
              '&:hover': {
                color: '#FF0059',
                backgroundColor: alpha('#FF0059', 0.15),
                transform: 'scale(1.1)',
                boxShadow: `0 0 8px ${alpha('#FF0059', 0.3)}`,
              },
            }}
          >
            <CloseIcon sx={{ fontSize: '1em' }} />
          </IconButton>
        </Box>
      </Paper>
    </Tooltip>
  );
};

