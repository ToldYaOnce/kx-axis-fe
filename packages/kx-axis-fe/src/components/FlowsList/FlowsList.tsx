import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { flowAPI } from '../../api/flowClient';
import type { FlowListItem } from '../../types/flow-api';
import { useToast } from '../../context/ToastContext';

interface FlowsListProps {
  onOpenFlow: (flowId: string, versionId?: string) => void;
  onCreateNew: () => void;
}

export const FlowsList: React.FC<FlowsListProps> = ({ onOpenFlow, onCreateNew }) => {
  const { showError } = useToast();
  const [flows, setFlows] = useState<FlowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL');
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<FlowListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await flowAPI.listFlows();
      setFlows(result.flows);
    } catch (err: any) {
      setError(err.message || 'Failed to load flows');
      console.error('Failed to load flows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (flow: FlowListItem) => {
    setFlowToDelete(flow);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!flowToDelete) return;

    setIsDeleting(true);
    try {
      await flowAPI.deleteFlow(flowToDelete.flowId);
      setFlows((prev) => prev.filter((f) => f.flowId !== flowToDelete.flowId));
      setDeleteDialogOpen(false);
      setFlowToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete flow:', err);
      showError(`Failed to delete flow: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setFlowToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Filter flows by status
  const filteredFlows = flows.filter((flow) => {
    if (statusFilter === 'ALL') return true;
    return flow.status === statusFilter;
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
        <Button onClick={loadFlows} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Conversation Flows
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredFlows.length} {filteredFlows.length === 1 ? 'flow' : 'flows'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
          size="large"
        >
          Create New Flow
        </Button>
      </Box>

      {/* Status Filter */}
      {flows.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_, newFilter) => {
              if (newFilter !== null) {
                setStatusFilter(newFilter);
              }
            }}
            size="small"
          >
            <ToggleButton value="ALL">
              All ({flows.length})
            </ToggleButton>
            <ToggleButton value="DRAFT">
              Draft ({flows.filter(f => f.status === 'DRAFT').length})
            </ToggleButton>
            <ToggleButton value="PUBLISHED">
              Published ({flows.filter(f => f.status === 'PUBLISHED').length})
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      {/* Empty State */}
      {flows.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No flows yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first conversation flow to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateNew}
          >
            Create Flow
          </Button>
        </Paper>
      )}

      {/* Flows Table */}
      {flows.length > 0 && filteredFlows.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No {statusFilter.toLowerCase()} flows
          </Typography>
        </Paper>
      )}

      {filteredFlows.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFlows.map((flow) => (
                <TableRow
                  key={flow.flowId}
                  sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium">
                      {flow.name}
                    </Typography>
                    {flow.description && (
                      <Typography variant="body2" color="text.secondary">
                        {flow.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {flow.industry && (
                      <Chip label={flow.industry} size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={flow.status}
                      color={flow.status === 'PUBLISHED' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(flow.updatedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      {/* Open Draft */}
                      <IconButton
                        size="small"
                        onClick={() => onOpenFlow(flow.flowId)}
                        title="Edit Draft"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      {/* Open Published (if exists) */}
                      {flow.latestPublishedVersionId && (
                        <IconButton
                          size="small"
                          onClick={() => onOpenFlow(flow.flowId, flow.latestPublishedVersionId!)}
                          title="View Published Version"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      )}

                      {/* Duplicate */}
                      <IconButton
                        size="small"
                        onClick={() => console.log('Duplicate:', flow.flowId)}
                        title="Duplicate"
                        disabled
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>

                      {/* Publish / Unpublish */}
                      {flow.status === 'DRAFT' ? (
                        <IconButton
                          size="small"
                          onClick={() => console.log('Publish:', flow.flowId)}
                          title="Publish"
                          disabled
                        >
                          <PublishIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => console.log('Unpublish:', flow.flowId)}
                          title="Unpublish"
                          disabled
                        >
                          <UnpublishedIcon fontSize="small" />
                        </IconButton>
                      )}

                      {/* Delete */}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(flow)}
                        title="Delete"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Conversation Flow?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{flowToDelete?.name}</strong>?
            <br />
            <br />
            This action cannot be undone. All draft and published versions will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

