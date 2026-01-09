import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useFlow } from '../../context/FlowContext';
import type { CaptureDefinition, ActiveCapture } from '../../types';

export const CapturesList: React.FC = () => {
  const { flow, registry, addCapture, setSelection } = useFlow();

  const activeCaptures = flow.capturing.map((ac) => ac.captureId);
  const availableCaptures = registry.captures.filter((c) => !activeCaptures.includes(c.id));

  const handleAddCapture = (capture: CaptureDefinition) => {
    const newActive: ActiveCapture = {
      captureId: capture.id,
      required: false,
      confidenceThreshold: 0.7,
    };
    addCapture(newActive);
  };

  const handleSelectCapture = (captureId: string) => {
    setSelection({ type: 'capture', id: captureId });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Active Captures */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Capturing ({flow.capturing.length})
      </Typography>

      <Paper
        sx={{
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          maxHeight: 300,
          overflowY: 'auto',
        }}
      >
        {flow.capturing.length > 0 ? (
          <List dense>
            {flow.capturing.map((activeCapture) => {
              const def = registry.captures.find((c) => c.id === activeCapture.captureId);
              if (!def) return null;

              return (
                <ListItem
                  key={activeCapture.captureId}
                  disablePadding
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {activeCapture.required && (
                        <Chip label="Required" size="small" color="error" sx={{ height: 20 }} />
                      )}
                      <Chip
                        label={`${Math.round((activeCapture.confidenceThreshold || 0.7) * 100)}%`}
                        size="small"
                        sx={{ height: 20 }}
                      />
                    </Box>
                  }
                >
                  <ListItemButton onClick={() => handleSelectCapture(def.id)}>
                    <ListItemText
                      primary={def.name}
                      secondary={activeCapture.usageLabel || def.description}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              No captures active. Add from Available Captures below.
            </Typography>
          </Box>
        )}
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {/* Available Captures */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Available Captures ({availableCaptures.length})
      </Typography>

      <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
        From {registry.industry} registry
      </Typography>

      <Paper
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          maxHeight: 400,
          overflowY: 'auto',
        }}
      >
        {availableCaptures.length > 0 ? (
          <List dense>
            {availableCaptures.map((capture) => (
              <ListItem
                key={capture.id}
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleAddCapture(capture)}
                    sx={{ color: 'primary.main' }}
                  >
                    <AddCircleOutlineIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemButton>
                  <ListItemText
                    primary={capture.name}
                    secondary={capture.description}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              All captures from registry are active
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};


