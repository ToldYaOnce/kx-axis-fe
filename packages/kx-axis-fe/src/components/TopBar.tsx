import React, { useState } from 'react';
import { Box, Typography, Button, Divider, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PublishIcon from '@mui/icons-material/Publish';
import EditIcon from '@mui/icons-material/Edit';
import { useFlow } from '../context/FlowContext';

interface TopBarProps {
  onSimulate?: () => void;
  onValidate?: () => void;
  onPublish?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onSimulate, onValidate, onPublish }) => {
  const { flow, updateFlow } = useFlow();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleOpenEditDialog = () => {
    setEditName(flow.name);
    setEditDescription(flow.description || '');
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };

  const handleSave = () => {
    updateFlow({
      name: editName,
      description: editDescription,
    });
    setEditDialogOpen(false);
  };

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

      {/* Edit Button */}
      <IconButton
        size="small"
        onClick={handleOpenEditDialog}
        sx={{
          color: 'text.secondary',
          '&:hover': {
            color: 'text.primary',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <EditIcon fontSize="small" />
      </IconButton>

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

      {/* Edit Flow Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Flow Details</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Flow Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="A brief description of what this conversation flow does"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};


