/**
 * SaveIndicator - Shows draft save status
 * 
 * Displays: "Saving…", "Saved", "Save failed", etc.
 */

import React from 'react';
import { Box, Typography, CircularProgress, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { SaveStatus } from '../../hooks/useDraftSave';

export interface SaveIndicatorProps {
  status: SaveStatus;
  lastSavedAt: Date | null;
  error?: string | null;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({ status, lastSavedAt, error }) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return {
          icon: null,
          text: 'Pending…',
          color: 'text.secondary',
        };
      case 'saving':
        return {
          icon: <CircularProgress size={14} sx={{ color: 'secondary.main' }} />,
          text: 'Saving…',
          color: 'secondary.main',
        };
      case 'saved':
        return {
          icon: <CheckCircleIcon fontSize="small" />,
          text: 'Saved',
          color: 'success.main',
        };
      case 'error':
        return {
          icon: <ErrorIcon fontSize="small" />,
          text: 'Save failed',
          color: 'error.main',
        };
      case 'idle':
      default:
        return null;
    }
  };

  const display = getStatusDisplay();
  if (!display) return null;

  const tooltipText = (() => {
    if (status === 'error' && error) {
      return `Error: ${error}`;
    }
    if (status === 'saved' && lastSavedAt) {
      return `Last saved at ${lastSavedAt.toLocaleTimeString()}`;
    }
    return null;
  })();

  const content = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        color: display.color,
      }}
    >
      {display.icon}
      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
        {display.text}
      </Typography>
    </Box>
  );

  if (tooltipText) {
    return <Tooltip title={tooltipText}>{content}</Tooltip>;
  }

  return content;
};







