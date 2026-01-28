import React, { useState } from 'react';
import { Box, Typography, Button, Divider, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PublishIcon from '@mui/icons-material/Publish';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useFlow } from '../context/FlowContext';
import { useOptionalFlowDataContext } from '../context/FlowDataContext';
import { SaveIndicator } from './Flow/SaveIndicator';
import { ValidationPanel } from './Flow/ValidationPanel';
import { VersionsModal } from './Flow/VersionsModal';

interface TopBarProps {
  onSimulations?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onSimulations }) => {
  const { flow, updateFlow, setSelection } = useFlow();
  const flowDataContext = useOptionalFlowDataContext();
  
  // Toast notification state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  // Store created flowId from quick-publish (so we don't create duplicates)
  const [createdFlowId, setCreatedFlowId] = useState<string | null>(null);
  
  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };
  
  // Destructure with defaults if API integration is not enabled
  const {
    saveStatus = 'idle',
    saveError = null,
    lastSavedAt = null,
    currentSourceHash = null,
    validationReport = null,
    isValidating = false,
    validateFlow = async () => {},
    clearValidation = () => {},
    publishResult = null,
    isPublishing = false,
    publishError = null,
    publishFlow = async () => {},
    versions = [],
    currentVersion = null,
    loadVersion = async () => {},
    backToDraft = () => {},
    isReadOnly = false,
  } = flowDataContext || {};

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishNote, setPublishNote] = useState('');
  const [versionsModalOpen, setVersionsModalOpen] = useState(false);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

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

  const handleValidate = async () => {
    await validateFlow();
    setShowValidationPanel(true);
  };

  const handlePublishClick = async () => {
    // If no API integration, use local callback
    if (!flowDataContext) {
      setPublishDialogOpen(true);
      setPublishNote('');
      return;
    }
    
    // If we already have a flowId, use normal publish flow
    if (flowDataContext.flowId) {
      setPublishDialogOpen(true);
      setPublishNote('');
      return;
    }
    
    // NEW: If no flowId, create flow + draft + publish in one go!
    // This is the "quick publish from demo mode" feature
    setPublishDialogOpen(true);
    setPublishNote('');
  };

  const handlePublishConfirm = async () => {
    // Determine the flowId to use (from context, or from previous creation)
    const activeFlowId = flowDataContext?.flowId || createdFlowId;
    
    // NEW: Quick Publish - Create flow + draft + publish in one shot
    // This handles when: (a) flowDataContext exists but flowId is null, OR (b) no flowDataContext at all
    if (!activeFlowId) {
      try {
        // Import the API client
        const { flowAPI } = await import('../api/flowClient');
        
        console.log('🚀 Publishing decision constraints...');
        
        console.log('');
        console.log('='.repeat(60));
        console.log('🚀 SINGLE REQUEST PUBLISH: FULL PAYLOAD');
        console.log('='.repeat(60));
        
        // Build the complete draftGraph FIRST
        const draftGraph = {
          // ========== EXECUTION METADATA ==========
          entryNodeIds: (flow as any).entryNodeIds || [flow.nodes[0]?.id],
          
          primaryGoal: (flow as any).primaryGoal || {
            type: 'GATE',
            gate: 'BOOKING',
            description: 'User has booked a consultation',
          },
          
          primaryGoalNodeId: flow.primaryGoalNodeId,  // UI: which node is marked as primary
          
          gateDefinitions: (flow as any).gateDefinitions || {
            CONTACT: {
              satisfiedBy: {
                metricsAny: ['contact_email', 'contact_phone'],
              },
            },
            BOOKING: {
              satisfiedBy: {
                metricsAll: ['booking_date', 'booking_type'],
              },
            },
            HANDOFF: {
              satisfiedBy: {
                statesAll: ['HANDOFF_COMPLETE'],
              },
            },
          },
          
          factAliases: (flow as any).factAliases || {
            target: 'goal_target',
            baseline: 'goal_baseline',
            delta: 'goal_delta',
            category: 'goal_category',
            email: 'contact_email',
            phone: 'contact_phone',
          },
          
          defaults: (flow as any).defaults || {
            retryPolicy: {
              maxAttempts: 2,
              onExhaust: "BROADEN",
              cooldownTurns: 0,
              promptVariantStrategy: "ROTATE"
            }
          },
          
          _semantics: (flow as any)._semantics || {
            retryPolicy: "RetryPolicy counts attempts to achieve a node's objective across turns. Attempts may re-ask/rephrase the node prompt without re-executing side effects. runPolicy.maxExecutions remains the hard cap for executing the node."
          },
          // =========================================
          
          nodes: flow.nodes.map((node) => {
            const nodeSatisfies = (node as any).satisfies;
            const cleanedSatisfies = nodeSatisfies ? {
              ...(nodeSatisfies.gates && { gates: nodeSatisfies.gates }),
              ...(nodeSatisfies.states && { states: nodeSatisfies.states }),
              // Explicitly exclude metrics (Option B semantics)
            } : undefined;
            
            const nodeRunPolicy = (node as any).runPolicy;
            const nodeRetryPolicy = (node as any).retryPolicy;
            
            // Build config object with all extra fields
            const config: Record<string, any> = {};
            
            if ((node as any).purpose) config.purpose = (node as any).purpose;
            if ((node as any).importance) config.importance = (node as any).importance;
            if (!nodeRunPolicy && (node as any).maxRuns) config.maxRuns = (node as any).maxRuns;
            if (nodeRunPolicy) config.runPolicy = nodeRunPolicy;
            if (nodeRetryPolicy) config.retryPolicy = nodeRetryPolicy;
            if ((node as any).requiresStates) config.requiresStates = (node as any).requiresStates;
            if (cleanedSatisfies) config.satisfies = cleanedSatisfies;
            if ((node as any).eligibility) config.eligibility = (node as any).eligibility;
            if ((node as any).allowSupportiveLine) config.allowSupportiveLine = (node as any).allowSupportiveLine;
            if ((node as any).goalGapTracker) config.goalGapTracker = (node as any).goalGapTracker;
            if ((node as any).deadlineEnforcement) config.deadlineEnforcement = (node as any).deadlineEnforcement;
            if ((node as any).priority) config.priority = (node as any).priority;
            if ((node as any).execution) config.execution = (node as any).execution;
            if ((node as any).goalLensId) config.goalLensId = (node as any).goalLensId;
            
            return {
              id: node.id,
              type: node.type,
              title: node.title,
              // ALWAYS include requires, produces, config (even if empty)
              requires: {
                facts: node.requires && node.requires.length > 0 ? node.requires : []
              },
              produces: {
                facts: node.produces && node.produces.length > 0 ? node.produces : []
              },
              config,  // Always include config (even if empty object)
            };
          }),
        };
        
        // Store UI layout in localStorage (backend doesn't want it)
        const uiLayout = {
          nodePositions: flow.nodes.reduce((acc, node) => {
            if (node.ui) {
              acc[node.id] = { x: node.ui.x, y: node.ui.y };
            }
            return acc;
          }, {} as Record<string, { x: number; y: number }>),
          laneAssignments: flow.nodes.reduce((acc, node) => {
            if (node.ui) {
              acc[node.id] = node.ui.lane;
            }
            return acc;
          }, {} as Record<string, string>),
          primaryGoalNodeId: flow.primaryGoalNodeId, // Persist primary goal selection
        };
        
        console.log('');
        console.log('='.repeat(60));
        console.log('🚀 QUICK PUBLISH: 3-STEP PROCESS');
        console.log('='.repeat(60));
        
        // STEP 1: Create flow WITH draftGraph (all in one request)
        console.log('📝 STEP 1: Creating flow WITH draftGraph...');
        
        // CRITICAL: Extract STRING from draftGraph.primaryGoal.gate
        const flowPrimaryGoalString = typeof draftGraph.primaryGoal === 'string' 
          ? draftGraph.primaryGoal 
          : draftGraph.primaryGoal?.gate || 'BOOKING';
        
        const createPayload = {
          name: flow.name,
          primaryGoal: flowPrimaryGoalString,  // MUST be STRING, not object!
          description: flow.description,
          industry: flow.industry,
          draftGraph,  // ✅ INCLUDE draftGraph in the create request!
        };
        
        console.log('✅ Create request structure:', {
          'Flow primaryGoal (MUST BE STRING)': createPayload.primaryGoal,
          'Flow primaryGoal type': typeof createPayload.primaryGoal,
          'DraftGraph primaryGoal (CAN BE OBJECT)': draftGraph.primaryGoal,
          'DraftGraph primaryGoal type': typeof draftGraph.primaryGoal,
          hasDraftGraph: !!createPayload.draftGraph,
          nodeCount: draftGraph.nodes.length,
          'First node structure': draftGraph.nodes[0] ? {
            id: draftGraph.nodes[0].id,
            type: draftGraph.nodes[0].type,
            requires: (draftGraph.nodes[0] as any).requires,  // Should be { facts: [...] }
            produces: (draftGraph.nodes[0] as any).produces,  // Should be { facts: [...] }
            hasConfig: !!(draftGraph.nodes[0] as any).config,
            configKeys: Object.keys((draftGraph.nodes[0] as any).config || {}),
          } : 'no nodes',
        });
        
        const createResult = await flowAPI.createFlow(createPayload);
        console.log('✅ STEP 1 COMPLETE: Flow + Draft created -', createResult.flowId);
        console.log('   sourceHash:', createResult.sourceHash);
        
        // Store createdFlowId and layout
        setCreatedFlowId(createResult.flowId);
        localStorage.setItem(`flow-${createResult.flowId}-layout`, JSON.stringify(uiLayout));
        
        // STEP 2: Publish (skip save draft since it was included in create)
        console.log('🚀 STEP 2: Publishing version...');
        const publishResult = await flowAPI.publishFlow(createResult.flowId, {
          publishNote,
          publishedBy: 'system',  // TODO: Replace with actual user
          sourceDraftHash: createResult.sourceHash,  // Use sourceHash from create response
        });
        console.log('✅ STEP 2 COMPLETE: Published as', publishResult.versionId);
        console.log('='.repeat(60));
        console.log('');
        
        setPublishDialogOpen(false);
        setPublishSuccess(true);
        showToast(`🎉 Flow published! Version: ${publishResult.versionId}`, 'success');
        
        return;
      } catch (error: any) {
        console.error('Quick publish failed:', error);
        showToast(`Failed to publish: ${error.message || 'Unknown error'}`, 'error');
        return;
      }
    }
    
    // This section is now obsolete - remove it later
    if (false && flowDataContext && !flowDataContext.flowId && createdFlowId) {
      try {
        const { flowAPI } = await import('../api/flowClient');
        
        console.log('');
        console.log('='.repeat(60));
        console.log('🚀 PUBLISH UPDATE: 3-STEP PROCESS (SUBSEQUENT PUBLISH)');
        console.log('='.repeat(60));
        console.log(`Using existing flowId: ${createdFlowId}`);
        
        // Build the same draftGraph payload (reuse logic from first publish)
        const draftGraph = {
          entryNodeIds: (flow as any).entryNodeIds || [flow.nodes[0]?.id],
          primaryGoal: (flow as any).primaryGoal || {
            type: 'GATE',
            gate: 'BOOKING',
            description: 'User has booked a consultation',
          },
          gateDefinitions: (flow as any).gateDefinitions || {
            CONTACT: { satisfiedBy: { metricsAny: ['contact_email', 'contact_phone'] } },
            BOOKING: { satisfiedBy: { metricsAll: ['booking_date', 'booking_type'] } },
            HANDOFF: { satisfiedBy: { statesAll: ['HANDOFF_COMPLETE'] } },
          },
          factAliases: (flow as any).factAliases || {
            target: 'goal_target',
            baseline: 'goal_baseline',
            delta: 'goal_delta',
            category: 'goal_category',
            email: 'contact_email',
            phone: 'contact_phone',
          },
          defaults: (flow as any).defaults || {
            retryPolicy: {
              maxAttempts: 2,
              onExhaust: "BROADEN",
              cooldownTurns: 0,
              promptVariantStrategy: "ROTATE"
            }
          },
          _semantics: (flow as any)._semantics || {
            retryPolicy: "RetryPolicy counts attempts to achieve a node's objective across turns. Attempts may re-ask/rephrase the node prompt without re-executing side effects. runPolicy.maxExecutions remains the hard cap for executing the node."
          },
          nodes: flow.nodes.map((node) => {
            const nodeSatisfies = (node as any).satisfies;
            const cleanedSatisfies = nodeSatisfies ? {
              ...(nodeSatisfies.gates && { gates: nodeSatisfies.gates }),
              ...(nodeSatisfies.states && { states: nodeSatisfies.states }),
            } : undefined;
            const nodeRunPolicy = (node as any).runPolicy;
            const nodeRetryPolicy = (node as any).retryPolicy;
            return {
              id: node.id,
              type: node.type,  // Pass through 'type' field
              title: node.title,
              purpose: (node as any).purpose,
              importance: (node as any).importance,
              ...(nodeRunPolicy ? {} : { maxRuns: (node as any).maxRuns }),
              runPolicy: nodeRunPolicy,
              retryPolicy: nodeRetryPolicy,
              produces: node.produces,
              requires: node.requires,
              requiresStates: (node as any).requiresStates,
              satisfies: cleanedSatisfies,
              eligibility: (node as any).eligibility,
              allowSupportiveLine: (node as any).allowSupportiveLine,
              goalGapTracker: (node as any).goalGapTracker,
              deadlineEnforcement: (node as any).deadlineEnforcement,
              priority: (node as any).priority,
              execution: (node as any).execution,
              goalLensId: (node as any).goalLensId,
            };
          }),
        };
        
        const editorState = {
          uiLayout: {
            nodePositions: flow.nodes.reduce((acc, node) => {
              if (node.ui) { acc[node.id] = { x: node.ui.x, y: node.ui.y }; }
              return acc;
            }, {} as Record<string, { x: number; y: number }>),
            laneAssignments: flow.nodes.reduce((acc, node) => {
              if (node.ui) { acc[node.id] = node.ui.lane; }
              return acc;
            }, {} as Record<string, string>),
          },
        };
        
        const draftPayload = {
          draftGraph,
          editorState,
          updatedBy: 'quick-publish-update',
        };
        
        // Step 1: Save draft (no creation needed)
        console.log('');
        console.log('📤 STEP 1: Update draft');
        const draftResult = await flowAPI.replaceDraft(createdFlowId, draftPayload);
        console.log('✅ STEP 1 COMPLETE: Draft updated');
        
        // Step 2: Validate
        console.log('');
        console.log('📤 STEP 2: Validate draft');
        const validationResult = await flowAPI.validateDraft(createdFlowId);
        
        if (!validationResult.ok) {
          console.error('❌ STEP 2 FAILED: Validation errors:', validationResult.errors);
          const errorMsg = validationResult.errors.map(e => e.message).join(', ');
          showToast(`Validation failed: ${errorMsg}`, 'error');
          return;
        }
        console.log('✅ STEP 2 COMPLETE: Validation passed');
        
        // Step 3: Publish
        console.log('');
        console.log('📤 STEP 3: Publish as new version');
        const publishPayload = {
          publishNote: publishNote || 'Quick publish from editor',
          sourceDraftHash: draftResult.sourceHash,
        };
        
        const publishResult = await flowAPI.publishFlow(createdFlowId, publishPayload);
        
        console.log('✅ STEP 3 COMPLETE: Published as', publishResult.versionId);
        console.log('='.repeat(60));
        console.log('');
        
        setPublishDialogOpen(false);
        setPublishSuccess(true);
        showToast(`🎉 Flow published! Version: ${publishResult.versionId}`, 'success');
        
        return;
      } catch (error: any) {
        console.error('Publish update failed:', error);
        showToast(`Failed to publish: ${error.message || 'Unknown error'}`, 'error');
        return;
      }
    }
    
    // Normal publish flow (when flowId exists in context - full hook integration)
    // CRITICAL: Force a fresh save before publishing to ensure complete payload
    console.log('🔄 Forcing fresh draft save before publish...', { activeFlowId });
    try {
      const { flowAPI } = await import('../api/flowClient');
      
      // Build complete draftGraph (same as autosave)
      const draftGraph = {
        entryNodeIds: (flow as any).entryNodeIds || [flow.nodes[0]?.id],
        primaryGoal: (flow as any).primaryGoal || {
          type: 'GATE',
          gate: 'BOOKING',
          description: 'User has booked a consultation',
        },
        primaryGoalNodeId: flow.primaryGoalNodeId,  // UI: which node is marked as primary
        gateDefinitions: (flow as any).gateDefinitions || {
          CONTACT: { satisfiedBy: { metricsAny: ['contact_email', 'contact_phone'] } },
          BOOKING: { satisfiedBy: { metricsAll: ['booking_date', 'booking_type'] } },
          HANDOFF: { satisfiedBy: { statesAll: ['HANDOFF_COMPLETE'] } },
        },
        factAliases: (flow as any).factAliases || {
          target: 'goal_target',
          baseline: 'goal_baseline',
          delta: 'goal_delta',
          category: 'goal_category',
          email: 'contact_email',
          phone: 'contact_phone',
        },
        defaults: (flow as any).defaults || {
          retryPolicy: {
            maxAttempts: 2,
            onExhaust: "BROADEN",
            cooldownTurns: 0,
            promptVariantStrategy: "ROTATE"
          }
        },
        _semantics: (flow as any)._semantics || {
          retryPolicy: "RetryPolicy counts attempts to achieve a node's objective across turns."
        },
        nodes: flow.nodes.map((node) => {
          const nodeSatisfies = (node as any).satisfies;
          const cleanedSatisfies = nodeSatisfies ? {
            ...(nodeSatisfies.gates && { gates: nodeSatisfies.gates }),
            ...(nodeSatisfies.states && { states: nodeSatisfies.states }),
          } : undefined;
          
          const nodeRunPolicy = (node as any).runPolicy;
          const nodeRetryPolicy = (node as any).retryPolicy;
          
          // Build config object with all extra fields
          const config: Record<string, any> = {};
          
          if ((node as any).purpose) config.purpose = (node as any).purpose;
          if ((node as any).importance) config.importance = (node as any).importance;
          if (!nodeRunPolicy && (node as any).maxRuns) config.maxRuns = (node as any).maxRuns;
          if (nodeRunPolicy) config.runPolicy = nodeRunPolicy;
          if (nodeRetryPolicy) config.retryPolicy = nodeRetryPolicy;
          if ((node as any).requiresStates) config.requiresStates = (node as any).requiresStates;
          if (cleanedSatisfies) config.satisfies = cleanedSatisfies;
          if ((node as any).eligibility) config.eligibility = (node as any).eligibility;
          if ((node as any).allowSupportiveLine) config.allowSupportiveLine = (node as any).allowSupportiveLine;
          if ((node as any).goalGapTracker) config.goalGapTracker = (node as any).goalGapTracker;
          if ((node as any).deadlineEnforcement) config.deadlineEnforcement = (node as any).deadlineEnforcement;
          if ((node as any).priority) config.priority = (node as any).priority;
          if ((node as any).execution) config.execution = (node as any).execution;
          if ((node as any).goalLensId) config.goalLensId = (node as any).goalLensId;
          
          return {
            id: node.id,
            type: node.type,
            title: node.title,
            // ALWAYS include requires, produces, config (even if empty)
            requires: {
              facts: node.requires && node.requires.length > 0 ? node.requires : []
            },
            produces: {
              facts: node.produces && node.produces.length > 0 ? node.produces : []
            },
            config,  // Always include config (even if empty object)
          };
        }),
        edges: [],
      };
      
      // Store UI layout in localStorage (backend doesn't want it)
      const uiLayout = {
        nodePositions: flow.nodes.reduce((acc, node) => {
          if (node.ui) {
            acc[node.id] = { x: node.ui.x, y: node.ui.y };
          }
          return acc;
        }, {} as Record<string, { x: number; y: number }>),
        laneAssignments: flow.nodes.reduce((acc, node) => {
          if (node.ui) {
            acc[node.id] = node.ui.lane;
          }
          return acc;
        }, {} as Record<string, string>),
        primaryGoalNodeId: flow.primaryGoalNodeId, // Persist primary goal selection
      };
      
      if (activeFlowId) {
        try {
          localStorage.setItem(`flow-${activeFlowId}-layout`, JSON.stringify(uiLayout));
        } catch (error) {
          console.warn('Failed to save layout to localStorage:', error);
        }
      }
      
      console.log('💾 Saving draft (draftGraph only, no uiLayout)...');
      const saveResult = await flowAPI.replaceDraft(activeFlowId!, {
        draftGraph,
        // ❌ DO NOT send uiLayout!
      });
      
      console.log('✅ Draft saved, now publishing with sourceHash:', saveResult.sourceHash);
      
      // Now publish with the fresh sourceHash
      const publishResult = await flowAPI.publishFlow(activeFlowId!, {
        publishNote,
        sourceDraftHash: saveResult.sourceHash,
      });
      
      console.log('✅ Published successfully:', publishResult);
      
      setPublishDialogOpen(false);
      setPublishSuccess(true);
      showToast('🎉 Conversation flow published successfully!', 'success');
    } catch (error: any) {
      console.error('Publish failed:', error);
      if (error.status === 409) {
        showToast('Draft has been modified. Please reload and try again.', 'warning');
      } else {
        showToast(`Failed to publish: ${error.message || 'Unknown error'}`, 'error');
      }
    }
  };

  const handleNodeClick = (nodeId: string) => {
    setSelection({ type: 'node', id: nodeId });
  };

  // Check if validation has errors (backend uses .ok field)
  const hasValidationErrors = validationReport ? !validationReport.ok : false;

  return (
    <>
      {/* Read-Only Banner */}
      {isReadOnly && (
        <Box
          sx={{
            height: 40,
            backgroundColor: 'warning.main',
            color: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            px: 3,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Viewing Published Version {currentVersion?.versionId} (Read-Only)
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={backToDraft}
            sx={{
              ml: 2,
              backgroundColor: '#000000',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#333333',
              },
            }}
          >
            Back to Draft
          </Button>
        </Box>
      )}

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

      {/* Save Indicator */}
      {!isReadOnly && (
        <SaveIndicator
          status={saveStatus}
          lastSavedAt={lastSavedAt}
          error={saveError?.message}
        />
      )}

      {/* Actions */}
      <Button
        variant="outlined"
        startIcon={<PlayArrowIcon />}
        onClick={onSimulations}
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
        Simulations
      </Button>

      <Button
        variant="outlined"
        startIcon={<CheckCircleOutlineIcon />}
        onClick={handleValidate}
        disabled={isValidating || isReadOnly}
        sx={{
          textTransform: 'none',
          borderColor: 'primary.main',
          color: 'text.primary',
          '&:hover': {
            borderColor: 'text.primary',
            backgroundColor: 'action.hover',
          },
        }}
      >
        {isValidating ? 'Validating…' : 'Validate'}
      </Button>

      <Button
        variant="outlined"
        startIcon={<HistoryIcon />}
        onClick={() => setVersionsModalOpen(true)}
        sx={{
          textTransform: 'none',
          borderColor: 'primary.main',
          color: 'text.primary',
          '&:hover': {
            borderColor: 'text.primary',
            backgroundColor: 'action.hover',
          },
        }}
      >
        Versions
        {versions.length > 0 && (
          <Chip
            label={versions.length}
            size="small"
            sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
          />
        )}
      </Button>

      <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

      <Button
        variant="contained"
        startIcon={<PublishIcon />}
        onClick={handlePublishClick}
        disabled={isPublishing || hasValidationErrors || isReadOnly}
        sx={{
          textTransform: 'none',
          backgroundColor: 'secondary.main',
          color: '#FFFFFF',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: 'secondary.dark',
          },
        }}
      >
        {isPublishing ? 'Publishing…' : 'Publish'}
      </Button>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Conversation Flow Details</DialogTitle>
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
              placeholder="A brief description of what these decision constraints do"
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

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Publish Conversation Flow</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Publishing will create a new immutable version of your conversation flow. Add an optional note to describe this version.
            </Typography>
            <TextField
              label="Publish Note (optional)"
              value={publishNote}
              onChange={(e) => setPublishNote(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="e.g., 'Added goal gap tracker', 'Fixed validation issues'"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handlePublishConfirm} variant="contained" color="secondary">
            Publish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Versions Modal */}
      <VersionsModal
        open={versionsModalOpen}
        onClose={() => setVersionsModalOpen(false)}
        versions={versions}
        currentVersionId={currentVersion?.versionId}
        isLoading={false}
        onLoadVersion={loadVersion}
      />

      {/* Validation Panel */}
      {showValidationPanel && validationReport && (
        <ValidationPanel
          report={validationReport}
          onClose={() => setShowValidationPanel(false)}
          onNodeClick={handleNodeClick}
        />
      )}

      {/* Publish Success Snackbar */}
      <Snackbar
        open={publishSuccess}
        autoHideDuration={4000}
        onClose={() => setPublishSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setPublishSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Conversation flow published successfully!
        </Alert>
      </Snackbar>

      {/* Toast Notifications */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
    </>
  );
};


