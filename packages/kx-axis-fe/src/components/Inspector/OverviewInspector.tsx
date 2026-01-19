import React, { useState } from 'react';
import { Box, Typography, Chip, Divider, Paper, TextField, MenuItem } from '@mui/material';
import { useFlow } from '../../context/FlowContext';
import { INDUSTRIES } from '../../utils/conversationItems';

export const OverviewInspector: React.FC = () => {
  const { flow, updateFlow } = useFlow();

  const nodesByKind = flow.nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Typography variant="h6" sx={{ fontWeight: 500, mb: 3, color: 'text.primary' }}>
        Requirement Tree Overview
      </Typography>

      {/* Editable Name */}
      <TextField
        label="Capability Name"
        value={flow.name}
        onChange={(e) => updateFlow({ name: e.target.value })}
        fullWidth
        size="small"
        sx={{ 
          mb: 2,
          '& .MuiInputLabel-root': { color: 'text.secondary' },
          '& .MuiInputBase-input': { color: 'text.primary' },
        }}
      />

      {/* Editable Flow Description */}
      <TextField
        label="Description"
        value={flow.description || ''}
        onChange={(e) => updateFlow({ description: e.target.value })}
        fullWidth
        size="small"
        multiline
        rows={2}
        sx={{ 
          mb: 2,
          '& .MuiInputLabel-root': { color: 'text.secondary' },
          '& .MuiInputBase-input': { color: 'text.primary' },
          '& .MuiFormHelperText-root': { color: 'text.disabled' },
        }}
        helperText="What becomes possible with this requirement tree"
      />

      {/* Industry Selector */}
      <TextField
        select
        label="Industry"
        value={flow.industry || 'Other'}
        onChange={(e) => updateFlow({ industry: e.target.value })}
        fullWidth
        size="small"
        sx={{ 
          mb: 3,
          '& .MuiInputLabel-root': { color: 'text.secondary' },
          '& .MuiInputBase-input': { color: 'text.primary' },
          '& .MuiFormHelperText-root': { color: 'text.disabled' },
        }}
        helperText="Available capabilities will adjust based on industry"
      >
        {INDUSTRIES.map((industry) => (
          <MenuItem key={industry} value={industry}>
            {industry}
          </MenuItem>
        ))}
      </TextField>

      <Divider sx={{ my: 3 }} />

      {/* Stats */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'action.hover' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Total Capabilities
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {flow.nodes.length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Information Capture
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {flow.nodes.filter(n => ['BASELINE_CAPTURE', 'GOAL_DEFINITION', 'DEADLINE_CAPTURE'].includes(n.type)).length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Conversation
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {flow.nodes.filter(n => ['EXPLANATION', 'REFLECTIVE_QUESTION'].includes(n.type)).length}
          </Typography>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />

      {/* Capability Types */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
        Capability Types
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
            No capabilities yet
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Metadata */}
      {flow.metadata && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
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


