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
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UpdateIcon from '@mui/icons-material/Update';
import BusinessIcon from '@mui/icons-material/Business';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DraftsIcon from '@mui/icons-material/Drafts';
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
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, pb: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}>
              Conversation Flows
            </Typography>
            <Chip 
              label={filteredFlows.length}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%)',
                color: 'secondary.main',
                fontWeight: 700,
                fontSize: '0.875rem',
                height: 28,
                border: '1px solid rgba(0, 229, 255, 0.3)',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <FiberManualRecordIcon sx={{ fontSize: '0.5rem', color: 'secondary.main' }} />
            <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {filteredFlows.length} {filteredFlows.length === 1 ? 'flow' : 'flows'}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onCreateNew}
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            px: 3,
            py: 1,
            borderRadius: 1.5,
            textTransform: 'none',
            fontSize: '0.9375rem',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            },
            transition: 'all 0.2s',
          }}
        >
          Create New Flow
        </Button>
      </Box>

      {/* Status Filter */}
      {flows.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_, newFilter) => {
              if (newFilter !== null) {
                setStatusFilter(newFilter);
              }
            }}
            sx={{
              '& .MuiToggleButton-root': {
                px: 3,
                py: 1.25,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%)',
                  color: 'secondary.main',
                  borderColor: 'rgba(0, 229, 255, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.25) 0%, rgba(167, 139, 250, 0.25) 100%)',
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              }
            }}
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
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)',
              border: '3px solid rgba(0, 229, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 4,
              boxShadow: '0 8px 32px rgba(0, 229, 255, 0.2)',
            }}
          >
            <AddIcon sx={{ fontSize: 70, color: 'secondary.main' }} />
          </Box>
          
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, letterSpacing: '-0.02em' }}>
            Create Your First Flow
          </Typography>
          
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 5, maxWidth: 520, fontSize: '1.1rem', lineHeight: 1.6 }}>
            Design intelligent conversation flows that guide users through personalized experiences
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={onCreateNew}
            sx={{
              background: 'linear-gradient(135deg, rgb(0, 229, 255) 0%, rgb(0, 200, 230) 100%)',
              color: '#000000',
              fontWeight: 700,
              fontSize: '1.1rem',
              py: 2,
              px: 5,
              borderRadius: 2.5,
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(0, 229, 255, 0.35)',
              border: '1px solid rgba(0, 229, 255, 0.5)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgb(0, 255, 255) 0%, rgb(0, 229, 255) 100%)',
                boxShadow: '0 12px 32px rgba(0, 229, 255, 0.5)',
                transform: 'translateY(-3px)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Create Flow
          </Button>
        </Box>
      )}

      {/* Flows - No Results */}
      {flows.length > 0 && filteredFlows.length === 0 && (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '40vh',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
            No {statusFilter.toLowerCase()} flows
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Try adjusting your filter
          </Typography>
        </Box>
      )}

      {/* Flows Grid */}
      {filteredFlows.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredFlows.map((flow) => (
            <Paper
              key={flow.flowId}
              onClick={() => onOpenFlow(flow.flowId)}
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.6) 0%, rgba(20, 20, 30, 0.8) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: flow.status === 'PUBLISHED'
                    ? 'linear-gradient(90deg, rgb(16, 185, 129) 0%, rgb(52, 211, 153) 100%)'
                    : 'linear-gradient(90deg, rgba(156, 163, 175, 0.5) 0%, rgba(156, 163, 175, 0.2) 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                },
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0, 229, 255, 0.15)',
                  borderColor: 'rgba(0, 229, 255, 0.3)',
                  '&::before': {
                    opacity: 1,
                  }
                },
              }}
            >
              {/* Main Content Grid */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                
                {/* Left: Name & Description */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 0.5,
                      fontSize: '1.1rem',
                      color: 'text.primary',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {flow.name}
                  </Typography>
                  {flow.description && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.5 }}>
                      {flow.description}
                    </Typography>
                  )}
                </Box>

                {/* Center: Chips Section */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {/* Industry Chip */}
                  {flow.industry && (
                    <Chip 
                      icon={<BusinessIcon />}
                      label={flow.industry}
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
                        color: 'rgb(196, 181, 253)',
                        border: '1px solid rgba(167, 139, 250, 0.3)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        height: 32,
                        '& .MuiChip-icon': {
                          color: 'rgb(196, 181, 253)',
                          fontSize: '1.1rem',
                        }
                      }}
                    />
                  )}

                  {/* Status Chip */}
                  <Chip
                    icon={flow.status === 'PUBLISHED' ? <CheckCircleIcon /> : <DraftsIcon />}
                    label={flow.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    size="small"
                    sx={{
                      background: flow.status === 'PUBLISHED'
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.25) 100%)'
                        : 'linear-gradient(135deg, rgba(100, 116, 139, 0.25) 0%, rgba(71, 85, 105, 0.25) 100%)',
                      color: flow.status === 'PUBLISHED'
                        ? 'rgb(110, 231, 183)'
                        : 'rgb(203, 213, 225)',
                      border: flow.status === 'PUBLISHED'
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(148, 163, 184, 0.4)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      height: 32,
                      '& .MuiChip-icon': {
                        color: 'inherit',
                        fontSize: '1.1rem',
                      }
                    }}
                  />

                  {/* Updated Date */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                    <UpdateIcon sx={{ fontSize: '1.1rem', color: 'rgba(0, 229, 255, 0.6)' }} />
                    <Typography variant="body2" sx={{ color: 'secondary.main', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {formatDate(flow.updatedAt)}
                    </Typography>
                  </Box>
                </Box>

                {/* Right: Actions */}
                <Box>
                  {/* Delete */}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(flow);
                    }}
                    sx={{
                      width: 48,
                      height: 48,
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
                      color: 'rgb(248, 113, 113)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)',
                        transform: 'scale(1.05) rotate(5deg)',
                        borderColor: 'rgba(239, 68, 68, 0.5)',
                        boxShadow: '0 6px 20px rgba(239, 68, 68, 0.3)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: '1.3rem' }} />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
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

