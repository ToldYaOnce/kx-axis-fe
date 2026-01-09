import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  IconButton,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useFlow } from '../../context/FlowContext';
import { GoalGapTrackerInspector } from './GoalGapTrackerInspector';
import type { FlowNode, NodeKind } from '../../types';

interface NodeInspectorProps {
  nodeId: string;
}

const NODE_KINDS: NodeKind[] = [
  'EXPLANATION',
  'REFLECTIVE_QUESTION',
  'GOAL_DEFINITION',
  'BASELINE_CAPTURE',
  'DEADLINE_CAPTURE',
  'GOAL_GAP_TRACKER',
  'ACTION_BOOKING',
  'HANDOFF',
];

export const NodeInspector: React.FC<NodeInspectorProps> = ({ nodeId }) => {
  const { flow, updateNode, removeNode } = useFlow();
  const node = flow.nodes.find((n) => n.id === nodeId);

  if (!node) return null;

  // Use specialized inspector for GOAL_GAP_TRACKER
  if (node.kind === 'GOAL_GAP_TRACKER') {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3, pb: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            {node.title}
          </Typography>
          <IconButton
            size="small"
            onClick={() => removeNode(nodeId)}
            sx={{ color: 'error.main' }}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Box>
        <GoalGapTrackerInspector
          node={node}
          onUpdate={(updates) => updateNode(nodeId, updates)}
        />
      </Box>
    );
  }

  const handleUpdate = (field: keyof FlowNode, value: any) => {
    updateNode(nodeId, { [field]: value });
  };

  const handleNestedUpdate = (parent: keyof FlowNode, field: string, value: any) => {
    const current = node[parent] as any;
    updateNode(nodeId, {
      [parent]: {
        ...current,
        [field]: value,
      },
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Node Details
        </Typography>
        <IconButton
          size="small"
          onClick={() => removeNode(nodeId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Box>

      {/* Basic Info */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Title"
          value={node.title}
          onChange={(e) => handleUpdate('title', e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Node Kind</InputLabel>
          <Select
            value={node.kind}
            label="Node Kind"
            onChange={(e) => handleUpdate('kind', e.target.value)}
          >
            {NODE_KINDS.map((kind) => (
              <MenuItem key={kind} value={kind}>
                {kind.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Purpose"
          value={node.purpose || ''}
          onChange={(e) => handleUpdate('purpose', e.target.value)}
          multiline
          rows={3}
          placeholder="Describe what this node does..."
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Eligibility */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Eligibility
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={node.eligibility?.requiresContact || false}
              onChange={(e) =>
                handleNestedUpdate('eligibility', 'requiresContact', e.target.checked)
              }
            />
          }
          label="Requires Contact"
        />

        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 2 }}>
          Channels: {node.eligibility?.channels?.join(', ') || 'All'}
        </Typography>

        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
          Lead States: {node.eligibility?.leadStates?.join(', ') || 'All'}
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Priority */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Priority
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          Base Rank
        </Typography>
        <Slider
          value={node.priority?.baseRank || 50}
          onChange={(_, value) => handleNestedUpdate('priority', 'baseRank', value)}
          min={0}
          max={100}
          valueLabelDisplay="auto"
          sx={{ mb: 2 }}
        />

        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          Cap Rank
        </Typography>
        <Slider
          value={node.priority?.capRank || 100}
          onChange={(_, value) => handleNestedUpdate('priority', 'capRank', value)}
          min={0}
          max={100}
          valueLabelDisplay="auto"
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Execution */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Execution
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Speech Act"
          value={node.execution?.speechAct || ''}
          onChange={(e) => handleNestedUpdate('execution', 'speechAct', e.target.value)}
          placeholder="e.g., inform, request, confirm"
          sx={{ mb: 2 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={node.execution?.allowPrefix || false}
              onChange={(e) => handleNestedUpdate('execution', 'allowPrefix', e.target.checked)}
            />
          }
          label="Allow Prefix"
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Dependencies */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Dependencies
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          Requires (Prerequisite Nodes)
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {node.requires?.map((reqId) => (
            <Chip key={reqId} label={reqId} size="small" />
          )) || (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              None
            </Typography>
          )}
        </Box>
      </Box>

      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          Satisfies (Captures)
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {node.satisfies?.map((captureId) => (
            <Chip key={captureId} label={captureId} size="small" color="success" />
          )) || (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              None
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};


