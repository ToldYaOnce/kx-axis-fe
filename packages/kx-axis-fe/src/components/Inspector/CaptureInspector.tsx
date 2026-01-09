import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useFlow } from '../../context/FlowContext';
import type { ActiveCapture } from '../../types';

interface CaptureInspectorProps {
  captureId: string;
}

export const CaptureInspector: React.FC<CaptureInspectorProps> = ({ captureId }) => {
  const { flow, registry, updateCapture, removeCapture } = useFlow();

  const activeCapture = flow.capturing.find((c) => c.captureId === captureId);
  const definition = registry.captures.find((c) => c.id === captureId);

  if (!activeCapture || !definition) return null;

  const handleUpdate = (field: keyof ActiveCapture, value: any) => {
    updateCapture(captureId, { [field]: value });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Capture Details
        </Typography>
        <IconButton
          size="small"
          onClick={() => removeCapture(captureId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Box>

      {/* Definition Info (Read-only) */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          {definition.name}
        </Typography>

        {definition.description && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {definition.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {definition.dataType && (
            <Chip label={definition.dataType} size="small" variant="outlined" />
          )}
          {definition.industry && (
            <Chip label={definition.industry} size="small" variant="outlined" />
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Active Configuration */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Configuration
      </Typography>

      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={activeCapture.required}
              onChange={(e) => handleUpdate('required', e.target.checked)}
            />
          }
          label="Required"
        />

        <Typography
          variant="caption"
          sx={{ display: 'block', color: 'text.secondary', mt: 1, mb: 3 }}
        >
          If required, the flow cannot proceed without capturing this value
        </Typography>

        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          Confidence Threshold: {Math.round((activeCapture.confidenceThreshold || 0.7) * 100)}%
        </Typography>
        <Slider
          value={activeCapture.confidenceThreshold || 0.7}
          onChange={(_, value) => handleUpdate('confidenceThreshold', value)}
          min={0}
          max={1}
          step={0.05}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
          sx={{ mb: 3 }}
        />

        <TextField
          fullWidth
          label="Usage Label"
          value={activeCapture.usageLabel || ''}
          onChange={(e) => handleUpdate('usageLabel', e.target.value)}
          placeholder="e.g., Used for goal setting"
          helperText="Describe how this capture is used in the flow"
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Usage Info */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Usage in Flow
      </Typography>

      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          Satisfied by nodes:
        </Typography>
        {flow.nodes
          .filter((node) => node.satisfies?.includes(captureId))
          .map((node) => (
            <Chip key={node.id} label={node.title} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
          ))}
        {flow.nodes.filter((node) => node.satisfies?.includes(captureId)).length === 0 && (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Not yet satisfied by any node
          </Typography>
        )}
      </Box>
    </Box>
  );
};


