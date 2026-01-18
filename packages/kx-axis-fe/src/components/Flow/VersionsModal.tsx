/**
 * VersionsModal - View and load published versions
 * 
 * Displays version history and allows loading a specific version (read-only).
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { VersionSummary } from '../../types/flow-api';

export interface VersionsModalProps {
  open: boolean;
  onClose: () => void;
  versions: VersionSummary[];
  currentVersionId?: string | null;
  isLoading: boolean;
  onLoadVersion: (versionId: string) => void;
}

export const VersionsModal: React.FC<VersionsModalProps> = ({
  open,
  onClose,
  versions,
  currentVersionId,
  isLoading,
  onLoadVersion,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          <span>Published Versions</span>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : versions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No published versions yet.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Publish your draft to create the first version.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {versions.map((version, index) => (
              <React.Fragment key={version.versionId}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      onLoadVersion(version.versionId);
                      onClose();
                    }}
                    selected={currentVersionId === version.versionId}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {version.versionId}
                      </Typography>
                          {currentVersionId === version.versionId && (
                            <Chip
                              label="Viewing"
                              size="small"
                              color="primary"
                              icon={<CheckCircleIcon />}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(version.createdAt).toLocaleString()}
                          </Typography>
                          {version.publishNote && (
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{ mt: 0.5, fontStyle: 'italic' }}
                            >
                              "{version.publishNote}"
                            </Typography>
                          )}
                          {version.publishedBy && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              Published by: {version.publishedBy}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

