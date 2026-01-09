import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useFlow } from '../../context/FlowContext';
import { GoalGapTrackerInspector } from './GoalGapTrackerInspector';
import { SimplifiedNodeInspector } from './SimplifiedNodeInspector';
import type { FlowNode } from '../../types';

interface NodeInspectorProps {
  nodeId: string;
}

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

  // Use simplified inspector for all other node types
  return <SimplifiedNodeInspector nodeId={nodeId} />;
};


