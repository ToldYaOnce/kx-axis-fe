import React, { useState } from 'react';
import { 
  Box, 
  ToggleButtonGroup, 
  ToggleButton, 
  IconButton, 
  Tooltip, 
  Typography, 
  ThemeProvider, 
  CssBaseline, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import CloudIcon from '@mui/icons-material/Cloud';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { KxAxisComposer } from '../components/KxAxisComposer';
import { ExecutionMode } from '../components/Simulator/ExecutionMode';
import { FlowsList } from '../components/FlowsList/FlowsList';
import { flowAPI } from '../api/flowClient';
import { defaultLightTheme, kxgryndeTheme } from '../theme';
import { goalGapDemoFlow } from './goalGapDemoData';
import type { ConversationFlow } from '../types';
import { INDUSTRIES } from '../utils/conversationItems';

type AppMode = 'design' | 'execution';
type ThemeMode = 'default' | 'kxgrynde';
type ViewMode = 'list' | 'editor';

export const DemoApp: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Start with flows list
  const [mode, setMode] = useState<AppMode>('design');
  const [themeMode, setThemeMode] = useState<ThemeMode>('kxgrynde'); // Start with bold theme
  const [useApi, setUseApi] = useState<boolean>(true); // Always enable API integration
  const [flowId, setFlowId] = useState<string | null>(null); // Current flow ID
  const [versionId, setVersionId] = useState<string | null>(null); // View specific version
  const [showFlowDialog, setShowFlowDialog] = useState<boolean>(false);
  const [isCreatingFlow, setIsCreatingFlow] = useState<boolean>(false);
  const [newFlowName, setNewFlowName] = useState<string>('');
  const [newFlowIndustry, setNewFlowIndustry] = useState<string>('Other');
  
  // Toast state
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  const activeTheme = themeMode === 'kxgrynde' ? kxgryndeTheme : defaultLightTheme;

  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  // Empty flow template (placeholder until API loads actual flow)
  const emptyFlow = React.useMemo<ConversationFlow>(() => ({
    id: 'new-flow',
    name: newFlowName || 'New Conversation Flow',
    description: `A ${newFlowIndustry} conversation flow`,
    industry: newFlowIndustry,
    nodes: [],
    activeGoalLenses: [],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      tags: [],
    },
  }), [newFlowName, newFlowIndustry]);

  const handleOpenFlow = (flowId: string, versionId?: string) => {
    setFlowId(flowId);
    setVersionId(versionId || null);
    setViewMode('editor');
    setMode('design');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setFlowId(null);
    setVersionId(null);
  };

  const handleChange = (updatedConfig: ConversationFlow) => {
    console.log('Flow updated:', updatedConfig);
  };

  const handleValidate = () => {
    console.log('Validate clicked');
    showToast('✅ Validation passed (Demo Mode)', 'success');
  };

  const handleSimulate = () => {
    // Switch to execution mode when simulate is clicked
    setMode('execution');
    showToast('🎮 Switching to Execution Mode', 'info');
  };

  const handlePublish = (config: ConversationFlow) => {
    // This callback is now unused - API mode handles publishing
    console.log('Publishing flow:', config);
    showToast(`🎉 Flow "${config.name}" published successfully! (Demo Mode)`, 'success');
  };

  const handleEnableApi = () => {
    setShowFlowDialog(true);
  };

  const handleCreateNewFlow = async () => {
    if (!newFlowName.trim()) {
      showToast('⚠️ Please enter a flow name', 'warning');
      return;
    }

    setIsCreatingFlow(true);
    try {
      // Create an empty flow with industry
      const result = await flowAPI.createFlow({
        name: newFlowName.trim(),
        primaryGoal: 'BOOKING',
        description: `A ${newFlowIndustry} conversation flow`,
        industry: newFlowIndustry,  // Pass industry to backend
        // Include empty draft
        draftGraph: {
          nodes: [],
          edges: [],
          entryNodeIds: [],
          primaryGoal: { type: 'GATE', gate: 'BOOKING', description: 'Flow completion goal' },
          gateDefinitions: {},
          factAliases: {},
        },
        editorState: {
          uiLayout: {
            nodePositions: {},
            laneAssignments: {},
          },
        },
      });
      
      console.log('Flow created:', result);
      
      // Store industry in localStorage (temporary until backend fully supports it)
      try {
        localStorage.setItem(`flow_industry_${result.flowId}`, newFlowIndustry);
        console.log('✅ Stored industry in localStorage:', {
          key: `flow_industry_${result.flowId}`,
          value: newFlowIndustry,
        });
      } catch (error) {
        console.warn('Failed to store industry in localStorage:', error);
      }
      
      setFlowId(result.flowId);
      setUseApi(true);
      setViewMode('editor');
      setShowFlowDialog(false);
      showToast(`✅ Created "${newFlowName.trim()}" (${newFlowIndustry})`, 'success');
      
      // Reset form
      setNewFlowName('');
      setNewFlowIndustry('Other');
      
      showToast(`✅ Flow created and saved! ID: ${result.flowId}`, 'success');
    } catch (error: any) {
      console.error('Failed to create flow:', error);
      
      // Better error messages
      let errorMsg = 'Failed to create flow';
      if (error.message?.includes('fetch')) {
        errorMsg = '🚫 CORS Error: Backend needs CORS enabled for localhost:5173';
      } else if (error.status === 401) {
        errorMsg = '🔒 Unauthorized: Check your service key';
      } else if (error.message) {
        errorMsg = `❌ ${error.message}`;
      }
      
      showToast(errorMsg, 'error');
    } finally {
      setIsCreatingFlow(false);
    }
  };


  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h6" sx={{ flexGrow: 1, color: 'text.primary' }}>
          KxAxis Demo
        </Typography>

        {/* Back to List button */}
        {viewMode === 'editor' && (
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToList}
            size="small"
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Back to Flows
          </Button>
        )}

        {/* API Mode indicator (always enabled) */}
        {mode === 'design' && flowId && (
          <Tooltip title={`API Connected: ${flowId}`}>
            <Button
              startIcon={<CloudIcon />}
              size="small"
              variant="contained"
              color="secondary"
              disabled
              sx={{ textTransform: 'none' }}
            >
              API Mode
            </Button>
          </Tooltip>
        )}

        {/* Theme Toggle */}
        <Tooltip title={`Theme: ${themeMode === 'kxgrynde' ? 'KxGrynde (Dark)' : 'Default (Light)'}`}>
          <IconButton
            onClick={() => setThemeMode(prev => prev === 'kxgrynde' ? 'default' : 'kxgrynde')}
            size="small"
            sx={{
              color: themeMode === 'kxgrynde' ? 'secondary.main' : 'text.secondary',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover',
                borderColor: 'secondary.main',
              },
            }}
          >
            <PaletteIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Mode Toggle */}
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, newMode) => newMode && setMode(newMode)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: 'text.secondary',
              borderColor: 'divider',
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: '#FFFFFF',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              },
            },
          }}
        >
          <ToggleButton value="design">Design Mode</ToggleButton>
          <ToggleButton value="execution">Execution Mode</ToggleButton>
        </ToggleButtonGroup>
      </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          {viewMode === 'list' ? (
            <FlowsList
              onOpenFlow={handleOpenFlow}
              onCreateNew={handleEnableApi}
            />
          ) : mode === 'design' ? (
            <KxAxisComposer
              disableThemeProvider={true}
              initialConfig={flowId ? emptyFlow : goalGapDemoFlow}
              goalLensRegistry={undefined as any}
              onChange={handleChange}
              onValidate={useApi ? undefined : handleValidate}
              onSimulate={useApi ? undefined : handleSimulate}
              onPublish={useApi ? undefined : handlePublish}
              // API integration props
              enableApiIntegration={useApi}
              flowId={flowId}
              autosaveEnabled={true}
              autosaveDelay={1000}
            />
          ) : (
            <ExecutionMode />
          )}
        </Box>

        {/* Flow Setup Dialog */}
        <Dialog open={showFlowDialog} onClose={() => setShowFlowDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Conversation Flow</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, mt: 1 }}>
              Choose a name and industry for your new flow. Conversation items will be tailored to your selection.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Flow Name"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="e.g., Fitness Onboarding, Lead Qualification"
                fullWidth
                autoFocus
                helperText="Give your conversation flow a descriptive name"
              />
              
              <TextField
                select
                label="Industry"
                value={newFlowIndustry}
                onChange={(e) => setNewFlowIndustry(e.target.value)}
                fullWidth
                helperText="Available conversation items will be tailored to this industry"
              >
                {INDUSTRIES.map((industry) => (
                  <MenuItem key={industry} value={industry}>
                    {industry}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setShowFlowDialog(false)} color="inherit">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateNewFlow}
              disabled={isCreatingFlow || !newFlowName.trim()}
              startIcon={isCreatingFlow ? <CircularProgress size={16} /> : null}
            >
              {isCreatingFlow ? 'Creating...' : 'Create Flow'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Toast Notifications */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={6000}
          onClose={() => setToastOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setToastOpen(false)} 
            severity={toastSeverity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};


