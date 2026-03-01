import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
} from '@mui/material';
import { FlowsList } from '../components/FlowsList/FlowsList';
import { ToastProvider, useToast } from '../context/ToastContext';
import { flowAPI } from '../api/flowClient';
import industryConfig from '../config/industryConversationItems.json';

export interface FlowsListRouteProps {
  /**
   * Base path for flows (e.g., '/flows')
   * Used to construct navigation URLs
   */
  basePath?: string;
}

/**
 * Inner component that uses ToastContext
 */
const FlowsListContent: React.FC<{ basePath: string }> = ({ basePath }) => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [flowIndustry, setFlowIndustry] = useState(() => {
    // Default to last used industry from localStorage
    return localStorage.getItem('lastFlowIndustry') || industryConfig.industries[0];
  });

  const handleOpenFlow = (flowId: string, versionId?: string) => {
    if (versionId) {
      navigate(`${basePath}/${flowId}/versions/${versionId}`);
    } else {
      navigate(`${basePath}/${flowId}`);
    }
  };

  // Open dialog when user clicks "Create Flow"
  const handleCreateNew = () => {
    setFlowName('');
    setFlowIndustry(localStorage.getItem('lastFlowIndustry') || industryConfig.industries[0]);
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFlowName('');
  };

  // Handle form submission
  const handleSubmitDialog = async () => {
    if (!flowName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      // Construct the request payload
      const createFlowPayload = {
        name: flowName.trim(),
        primaryGoal: 'BOOKING',
        description: '',
        industry: flowIndustry,
      };
      
      console.log('📤 Creating flow with payload:', createFlowPayload);
      
      // Create a new flow via API
      const response = await flowAPI.createFlow(createFlowPayload);

      // Save industry to localStorage for next time
      localStorage.setItem('lastFlowIndustry', flowIndustry);
      
      // CRITICAL: Also save industry mapped to this flowId since backend doesn't persist it
      localStorage.setItem(`flow_${response.flowId}_industry`, flowIndustry);

      // Close dialog and navigate to the newly created flow
      setDialogOpen(false);
      navigate(`${basePath}/${response.flowId}`);
    } catch (err: any) {
      console.error('Failed to create flow:', err);
      showError(err.message || 'Failed to create new flow');
      setIsCreating(false);
    }
  };

  return (
    <>
      <FlowsList 
        onOpenFlow={handleOpenFlow} 
        onCreateNew={handleCreateNew}
      />

      {/* Create Flow Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle>Create New Flow</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Flow Name */}
            <TextField
              label="Flow Name"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value.slice(0, 100))}
              fullWidth
              required
              autoFocus
              placeholder="e.g., Fitness Onboarding Flow"
              helperText={`${flowName.length}/100 characters`}
              error={flowName.trim().length === 0 && flowName.length > 0}
            />
            
            {/* Industry Selection */}
            <TextField
              select
              label="Industry"
              value={flowIndustry}
              onChange={(e) => setFlowIndustry(e.target.value)}
              fullWidth
              required
              helperText="This determines which conversation capabilities are available"
            >
              {industryConfig.industries.map((industry) => (
                <MenuItem key={industry} value={industry}>
                  {industry}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitDialog} 
            variant="contained" 
            disabled={!flowName.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Flow'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/**
 * Route component for Flows List
 * Handles navigation to flow details and creation
 */
export const FlowsListRoute: React.FC<FlowsListRouteProps> = ({ 
  basePath = '/flows' 
}) => {
  return (
    <ToastProvider>
      <FlowsListContent basePath={basePath} />
    </ToastProvider>
  );
};

