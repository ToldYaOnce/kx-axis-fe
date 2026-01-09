import React from 'react';
import { Box, Typography, Chip, Divider, Paper } from '@mui/material';
import { useFlow } from '../../context/FlowContext';

export const OverviewInspector: React.FC = () => {
  const { flow } = useFlow();

  const nodesByKind = flow.nodes.reduce((acc, node) => {
    acc[node.kind] = (acc[node.kind] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h6" sx={{ fontWeight: 500, mb: 3 }}>
        Flow Overview
      </Typography>

      {/* Stats */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'action.hover' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Total Nodes
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {flow.nodes.length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Active Captures
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {flow.capturing.length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Required Captures
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {flow.capturing.filter((c) => c.required).length}
          </Typography>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Node Types */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Node Types
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        {Object.entries(nodesByKind).map(([kind, count]) => (
          <Chip
            key={kind}
            label={`${kind.replace('_', ' ')}: ${count}`}
            size="small"
            variant="outlined"
          />
        ))}
        {Object.keys(nodesByKind).length === 0 && (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            No nodes yet
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Captures */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Active Captures
      </Typography>

      <Box>
        {flow.capturing.map((capture) => (
          <Box key={capture.captureId} sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {capture.captureId}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {capture.required && (
                <Chip label="Required" size="small" color="error" sx={{ height: 20 }} />
              )}
              <Chip
                label={`${Math.round((capture.confidenceThreshold || 0.7) * 100)}% conf.`}
                size="small"
                sx={{ height: 20 }}
              />
            </Box>
          </Box>
        ))}
        {flow.capturing.length === 0 && (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            No captures configured
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Metadata */}
      {flow.metadata && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Metadata
          </Typography>

          <Box>
            {flow.metadata.version && (
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                Version: {flow.metadata.version}
              </Typography>
            )}
            {flow.metadata.createdAt && (
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                Created: {new Date(flow.metadata.createdAt).toLocaleDateString()}
              </Typography>
            )}
            {flow.metadata.updatedAt && (
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                Updated: {new Date(flow.metadata.updatedAt).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};


