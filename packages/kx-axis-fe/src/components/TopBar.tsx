import React from 'react';
import { Box, Typography, Button, Divider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PublishIcon from '@mui/icons-material/Publish';
import { useFlow } from '../context/FlowContext';

interface TopBarProps {
  onSimulate?: () => void;
  onValidate?: () => void;
  onPublish?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onSimulate, onValidate, onPublish }) => {
  const { flow } = useFlow();

  return (
    <Box
      sx={{
        height: 64,
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        px: 3,
        gap: 2,
        backgroundColor: 'background.paper',
      }}
    >
      {/* Flow Title */}
      <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>
        {flow.name}
      </Typography>

      {flow.description && (
        <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400 }}>
          {flow.description}
        </Typography>
      )}

      {/* Spacer */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Actions */}
      <Button
        variant="outlined"
        startIcon={<PlayArrowIcon />}
        onClick={onSimulate}
        sx={{
          textTransform: 'none',
          borderColor: 'divider',
          color: 'text.primary',
          '&:hover': {
            borderColor: 'text.primary',
            backgroundColor: 'action.hover',
          },
        }}
      >
        Simulate
      </Button>

      <Button
        variant="outlined"
        startIcon={<CheckCircleOutlineIcon />}
        onClick={onValidate}
        sx={{
          textTransform: 'none',
          borderColor: 'divider',
          color: 'text.primary',
          '&:hover': {
            borderColor: 'text.primary',
            backgroundColor: 'action.hover',
          },
        }}
      >
        Validate
      </Button>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Button
        variant="contained"
        startIcon={<PublishIcon />}
        onClick={onPublish}
        sx={{
          textTransform: 'none',
          backgroundColor: 'text.primary',
          color: 'background.paper',
          '&:hover': {
            backgroundColor: 'text.secondary',
          },
        }}
      >
        Publish
      </Button>
    </Box>
  );
};


