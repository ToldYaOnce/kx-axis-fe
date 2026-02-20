/**
 * Readiness Panel - Modern, flat dashboard for agent diagnostics
 * 
 * DESIGN PHILOSOPHY:
 * - Visual-first: Progress bars, status indicators, icon grids
 * - No chip spam: Meaningful visual hierarchy with gradients & shadows
 * - Scannable: Everything visible at a glance, no accordions
 * - Color-coded: Red (errors), Yellow (warnings), Green (success), Cyan (info)
 * 
 * AGENT DIAGNOSTICS MODE (when agent response selected):
 * 
 * 1. Agent Intent - Gradient card with confidence bar
 * 2. Execution Decision - Compact card with icon, pills, and current step
 * 3. Progress Status - Status cards (made progress, stall detection, stagnation)
 * 4. Control Flags - Compact checklist with colored indicators
 * 5. Execution Metadata - Badge-style cards with fact/capability lists
 * 
 * CONVERSATION READINESS MODE (default - no agent selected):
 * - Known facts, missing info, unlocked capabilities
 * 
 * All boolean values show visual ✓/✗, all decimals show as %
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PanToolIcon from '@mui/icons-material/PanTool';
import LiveHelpIcon from '@mui/icons-material/LiveHelp';
import CancelIcon from '@mui/icons-material/Cancel';
import UpdateIcon from '@mui/icons-material/Update';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import WarningIcon from '@mui/icons-material/Warning';
import { useSimulator } from '../../context/SimulatorContext';
import type { KnownFacts } from '../../types/simulator';

const formatFactValue = (value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  
  if (typeof value === 'string') {
    // Apply title case to snake_case strings
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '✓ Yes' : '✗ No';
  
  // Handle objects with smart formatting
  if (typeof value === 'object') {
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return '(empty list)';
      return value.map(item => {
        if (typeof item === 'string') {
          return item.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        }
        return String(item);
      }).join(', ');
    }
    
    // Handle range objects (min/max)
    if (value.min !== undefined && value.max !== undefined) {
      const unit = value.unit ? ` ${value.unit}` : '';
      return `${value.min}-${value.max}${unit}`;
    }
    
    // Handle single value with unit
    if (value.value !== undefined && value.unit !== undefined) {
      return `${value.value} ${value.unit}`;
    }
    
    // Fallback: readable key-value pairs
    return Object.entries(value)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
  
  return String(value);
};

const formatIntentLabel = (intent: string | undefined): string => {
  if (!intent) return '';
  return intent
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface ReadinessPanelProps {
  isCollapsed?: boolean;
}

export const ReadinessPanel: React.FC<ReadinessPanelProps> = ({ isCollapsed = false }) => {
  const { getCurrentFacts, getLatestNode, selectedNodeId, getNodeById, flow, currentRun } = useSimulator();
  const currentFacts = getCurrentFacts();
  const latestNode = getLatestNode();
  const selectedNode = selectedNodeId ? getNodeById(selectedNodeId) : null;
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Helper to get node title from flow by nodeId
  const getNodeTitle = (nodeId: string): string => {
    if (!flow?.nodes) return nodeId;
    const flowNode = flow.nodes.find(n => n.id === nodeId);
    return flowNode?.title || nodeId;
  };
  
  // Check if selected node is an agent node with metadata
  const isAgentNode = selectedNode?.agentMessage !== undefined;
  const hasMetadata = isAgentNode && (selectedNode?.executionResult || selectedNode?.metadata);
  
  // Get the user node (parent of agent node) for intent detection AND tickSignals
  const userNode = isAgentNode && selectedNode?.parentNodeId 
    ? getNodeById(selectedNode.parentNodeId) 
    : null;
  const userIntentDetection = userNode?.intentDetection || userNode?.metadata?.intentDetection;
  
  // Access controllerOutput from metadata (API response structure)
  const controllerOutput = selectedNode?.metadata?.controllerOutput || selectedNode?.controllerOutput;
  const executionResult = selectedNode?.metadata?.executionResult || selectedNode?.executionResult;
  const simData = selectedNode?.metadata?.sim || selectedNode?.sim;

  // Get decision from multiple possible sources
  const decision = executionResult?.executionDecision 
    || simData?.decision?.action 
    || controllerOutput?.stepRecommendation?.decision?.move
    || selectedNode?.metadata?.decision?.action;

  // Get target step/node from multiple possible sources
  const targetStepId = controllerOutput?.controlFlags?.recommendedStep?.stepId 
    || controllerOutput?.stepRecommendation?.decision?.targetNodeId
    || simData?.decision?.targetNodeId
    || selectedNode?.metadata?.decision?.targetNodeId;
  
  // tickSignals can be stored in multiple places depending on API response structure:
  // 1. Agent node top-level (GET responses - duplicated from user node)
  // 2. User node top-level (GET responses - original location)
  // 3. Agent node metadata (PATCH responses)
  const tickSignals = selectedNode?.tickSignals || userNode?.tickSignals || userNode?.metadata?.tickSignals || selectedNode?.metadata?.tickSignals;
  
  // CRITICAL DEBUG - Log exactly what we have
  if (selectedNode) {
    console.log('🚨 READINESS PANEL DEBUG:', {
      selectedNodeId: selectedNode.nodeId,
      selectedNodeType: selectedNode.agentMessage ? 'agent' : 'user',
      'selectedNode.tickSignals': selectedNode.tickSignals,
      'userNode?.tickSignals': userNode?.tickSignals,
      'selectedNode.metadata?.tickSignals': selectedNode.metadata?.tickSignals,
      'FINAL tickSignals': tickSignals,
      selectedNode: selectedNode
    });
  }
  
  // Debug logging
  if (hasMetadata && selectedNode) {
    console.log('📊 ReadinessPanel - Agent Node Selected:', {
      hasControllerOutput: !!controllerOutput,
      hasExecutionResult: !!executionResult,
      hasSimData: !!simData,
      hasUserIntent: !!userIntentDetection,
      hasTickSignals: !!tickSignals,
      rankedCandidatesCount: controllerOutput?.stepRecommendation?.rankedCandidates?.length || 0,
      tickSignals,
      tickSignalsFromAgentNode: selectedNode?.tickSignals,
      tickSignalsFromUserNode: userNode?.tickSignals,
      userNodeId: userNode?.nodeId
    });
    
    if (tickSignals) {
      console.log('✅ tickSignals found:', tickSignals);
    } else {
      console.warn('⚠️ tickSignals not found - checking paths:', {
        agentNodeTickSignals: selectedNode?.tickSignals,
        userNodeTickSignals: userNode?.tickSignals,
        userNodeMetadataTickSignals: userNode?.metadata?.tickSignals,
        agentMetadataTickSignals: selectedNode.metadata?.tickSignals,
        hasUserNode: !!userNode
      });
    }
  }

  // Auto-expand drawer when a node is selected
  useEffect(() => {
    if (selectedNodeId && isCollapsed) {
      setIsManuallyExpanded(true);
    }
  }, [selectedNodeId, isCollapsed]);

  // Determine if panel should be shown
  const isVisible = !isCollapsed || isManuallyExpanded;

  // Extract known facts into flat list
  const knownFacts: Array<{ category: string; fact: string; value: any }> = [];
  
  Object.entries(currentFacts).forEach(([category, data]) => {
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          knownFacts.push({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            fact: key,
            value,
          });
        }
      });
    }
  });

  // Extract missing facts from constraints
  const missingFacts = currentFacts.constraints?.missing || [];

  // Extract readiness delta from latest node
  const readinessDelta = latestNode?.executionResult?.executionMetadata?.readinessDelta || [];

  // Collapsed state - minimal toggle button
  if (isCollapsed && !isManuallyExpanded) {
    return (
      <Box sx={{ 
        width: 48, 
        borderLeft: '1px solid', 
        borderColor: 'divider', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        backgroundColor: 'background.paper',
        py: 2,
      }}>
        <Tooltip title="Show readiness" placement="left">
          <IconButton 
            size="small" 
            onClick={() => setIsManuallyExpanded(true)}
            sx={{ 
              transform: 'rotate(-90deg)',
              mb: 2,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', letterSpacing: 1 }}>
              READY
            </Typography>
          </IconButton>
        </Tooltip>
        
        {/* Summary badges (vertical) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
          <Tooltip title={`${knownFacts.length} facts known`} placement="left">
            <Chip 
              icon={<CheckCircleIcon />}
              label={knownFacts.length} 
              size="small" 
              sx={{ height: 24, '& .MuiChip-label': { px: 1 } }}
            />
          </Tooltip>
          <Tooltip title={`${missingFacts.length} still needed`} placement="left">
            <Chip 
              icon={<HelpOutlineIcon />}
              label={missingFacts.length} 
              size="small" 
              color="warning"
              sx={{ height: 24, '& .MuiChip-label': { px: 1 } }}
            />
          </Tooltip>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: 440,
      height: '100%',  // ✅ Fill parent height
      borderLeft: '1px solid', 
      borderColor: 'divider', 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: 0,
      backgroundColor: 'background.paper' 
    }}>
      {/* Header */}
      <Box sx={{ flexShrink: 0, p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Readiness
        </Typography>
        {isCollapsed && (
          <Tooltip title="Hide readiness" placement="left">
            <IconButton size="small" onClick={() => setIsManuallyExpanded(false)}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              py: 1,
            },
          }}
        >
          <Tab label="Decision" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Data
                {selectedNode?.progress?.learnedThisTurn && selectedNode.progress.learnedThisTurn.length > 0 && (
                  <Chip 
                    label={selectedNode.progress.learnedThisTurn.length} 
                    size="small" 
                    sx={{ 
                      height: 18,
                      minWidth: 18,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      bgcolor: 'success.main', 
                      color: 'white',
                      '& .MuiChip-label': {
                        px: 0.5,
                      }
                    }}
                  />
                )}
              </Box>
            } 
          />
          <Tab label="Cost" />
        </Tabs>
      </Box>

      <Box sx={{ 
        flex: 1, 
        minHeight: 0, 
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <Box sx={{ p: 2, pb: 4 }}>
          {/* Tab 0: Decision Analysis */}
          {activeTab === 0 && (
            <>
              {/* AGENT METADATA - Show when agent node is selected */}
              {hasMetadata && selectedNode && controllerOutput && (
          <>
            {/* Header */}
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'secondary.main', display: 'block', mb: 2 }}>
              Agent Decision Analysis
            </Typography>

            {/* Agent Intent - Big Visual Card */}
            {controllerOutput.intent && (
              <Box sx={{ 
                mb: 3, 
                p: 2.5, 
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%)',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'secondary.main',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    bgcolor: 'secondary.main', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(34, 211, 238, 0.3)'
                  }}>
                    <SmartToyIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                      Agent Intent
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'secondary.main' }}>
                      {formatIntentLabel(controllerOutput.intent.primary)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                  <Box sx={{ flex: 1, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1, height: 8, overflow: 'hidden' }}>
                    <Box sx={{ 
                      width: `${controllerOutput.intent.confidence * 100}%`, 
                      height: '100%', 
                      bgcolor: 'secondary.main',
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', minWidth: 45, color: 'secondary.main' }}>
                    {(controllerOutput.intent.confidence * 100).toFixed(0)}%
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Conflicts Section */}
            {(selectedNode?.metadata?.controllerOutput?.conflictToResolve || 
              (selectedNode as any)?.conflictResolution?.status === 'ACTIVE' ||
              (selectedNode as any)?.updatedState?.conflictResolution?.status === 'ACTIVE') && (() => {
              const conflictData = selectedNode?.metadata?.controllerOutput?.conflictToResolve || 
                                  (selectedNode as any)?.conflictResolution?.currentConflict ||
                                  (selectedNode as any)?.updatedState?.conflictResolution?.currentConflict;
              const conflictStatus = (selectedNode as any)?.conflictResolution?.status || 
                                    (selectedNode as any)?.updatedState?.conflictResolution?.status;
              
              if (!conflictData) return null;

              return (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                    <WarningIcon sx={{ fontSize: '1rem', color: '#a855f7' }} />
                    <Typography variant="caption" sx={{
                      color: '#a855f7',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '1px',
                    }}>
                      Conflict Detection
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    borderRadius: 1.5,
                    bgcolor: 'rgba(168, 85, 247, 0.05)',
                    border: '2px solid',
                    borderColor: '#a855f7',
                    p: 2,
                  }}>
                    {/* Status Badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 0.75,
                        bgcolor: conflictStatus === 'ACTIVE' ? '#a855f7' : 'success.main',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {conflictStatus || 'DETECTED'}
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                        Attempt {conflictData.attempts || 0} of {conflictData.maxAttempts || 2}
                      </Typography>
                    </Box>

                    {/* Fact ID */}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                        Conflicting Fact
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600, 
                        fontSize: '0.85rem',
                        color: '#a855f7',
                      }}>
                        {formatIntentLabel(conflictData.factId)}
                      </Typography>
                    </Box>

                    {/* Implausibility Statement */}
                    {(selectedNode?.intentDetection?.conflicts?.[0]?.implausibilityStatement) && (
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 1,
                        bgcolor: 'rgba(168, 85, 247, 0.08)',
                        border: '1px solid',
                        borderColor: 'rgba(168, 85, 247, 0.3)',
                      }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                          Issue Detected
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
                          {selectedNode.intentDetection.conflicts[0].implausibilityStatement}
                        </Typography>
                      </Box>
                    )}

                    {/* Severity Indicator */}
                    {conflictData.severity && (
                      <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                            Severity:
                          </Typography>
                          <Box sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: 0.5,
                            bgcolor: conflictData.severity === 'high' 
                              ? 'rgba(239, 68, 68, 0.15)' 
                              : conflictData.severity === 'med'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(34, 197, 94, 0.15)',
                            color: conflictData.severity === 'high' 
                              ? 'error.main' 
                              : conflictData.severity === 'med'
                              ? 'warning.main'
                              : 'success.main',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}>
                            {conflictData.severity}
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })()}

            {/* Discrepancy Detection */}
            {(() => {
              const discrepancy = (selectedNode?.metadata as any)?.updatedState?.discrepancyToResolve;
              
              console.log('🔍 Discrepancy check:', {
                hasMetadata: !!selectedNode?.metadata,
                hasUpdatedState: !!(selectedNode?.metadata as any)?.updatedState,
                discrepancy,
                fullMetadata: selectedNode?.metadata,
              });
              
              if (!discrepancy) return null;

              return (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                    <InfoOutlinedIcon sx={{ fontSize: '1rem', color: '#ec4899' }} />
                    <Typography variant="caption" sx={{
                      color: '#ec4899',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '1px',
                    }}>
                      Answer Mismatch
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    borderRadius: 1.5,
                    bgcolor: 'rgba(236, 72, 153, 0.05)',
                    border: '2px solid',
                    borderColor: '#ec4899',
                    p: 2,
                  }}>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block', mb: 0.75 }}>
                        User answered a different question
                      </Typography>
                      
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 1.5 }}>
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 1,
                          bgcolor: 'rgba(236, 72, 153, 0.08)',
                          border: '1px solid',
                          borderColor: 'rgba(236, 72, 153, 0.2)',
                        }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                            Asked For
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600, 
                            fontSize: '0.85rem',
                            color: '#ec4899',
                          }}>
                            {formatIntentLabel(discrepancy.askedFact)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 1,
                          bgcolor: 'rgba(34, 197, 94, 0.08)',
                          border: '1px solid',
                          borderColor: 'rgba(34, 197, 94, 0.2)',
                        }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                            Actually Got
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600, 
                            fontSize: '0.85rem',
                            color: 'success.main',
                          }}>
                            {formatIntentLabel(discrepancy.answeredFact)}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontStyle: 'italic' }}>
                        Agent will need to re-ask for {formatIntentLabel(discrepancy.askedFact)}
                      </Typography>
                    </Box>

                    {/* Show cantGatherFacts if available */}
                    {(() => {
                      const parentUserNode = currentRun?.nodes?.find((n: any) => n.nodeId === selectedNode.parentNodeId);
                      const cantGatherFacts = parentUserNode?.intentDetection?.cantGatherFacts || [];
                      
                      if (cantGatherFacts.length === 0) return null;
                      
                      return (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'rgba(236, 72, 153, 0.2)' }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block', mb: 1, fontWeight: 600 }}>
                            Facts That Can't Be Gathered
                          </Typography>
                          {cantGatherFacts.map((item: any, index: number) => (
                            <Box 
                              key={index}
                              sx={{ 
                                p: 1.25, 
                                mb: 1,
                                borderRadius: 0.75,
                                bgcolor: 'rgba(236, 72, 153, 0.05)',
                                border: '1px solid',
                                borderColor: 'rgba(236, 72, 153, 0.15)',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#ec4899' }}>
                                  {formatIntentLabel(item.factId)}
                                </Typography>
                                {item.confidence && (
                                  <Chip 
                                    label={`${Math.round(item.confidence * 100)}%`}
                                    size="small"
                                    sx={{ 
                                      height: 20,
                                      fontSize: '0.65rem',
                                      bgcolor: 'rgba(236, 72, 153, 0.15)', 
                                      color: '#ec4899',
                                      fontWeight: 600,
                                    }}
                                  />
                                )}
                              </Box>
                              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                Reason: {item.reason || 'Unknown'}
                              </Typography>
                              {item.userStatement && (
                                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                  "{item.userStatement}"
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                      );
                    })()}
                  </Box>
                </Box>
              );
            })()}

            {/* Unified Decision Card - Winner + Alternatives */}
            {decision && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ 
                  color: 'text.secondary', 
                  fontSize: '0.7rem', 
                  textTransform: 'uppercase', 
                  fontWeight: 700,
                  letterSpacing: '1px',
                  display: 'block',
                  mb: 1,
                }}>
                  Routing
                </Typography>
                <Box sx={{ 
                  borderRadius: 1.5,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}>
                  {/* Winning Path - Prominent */}
                  <Box sx={{ 
                    p: 2,
                    bgcolor: decision === 'ADVANCE' 
                      ? 'rgba(34, 211, 238, 0.05)' 
                      : decision === 'BRIDGE'
                      ? 'rgba(139, 92, 246, 0.05)'
                      : decision?.toUpperCase().includes('CLARIFY')
                      ? 'rgba(236, 72, 153, 0.05)'
                      : 'rgba(245, 158, 11, 0.05)',
                  }}>
                    {/* Winner Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        bgcolor: decision === 'ADVANCE' 
                          ? 'rgba(34, 211, 238, 0.15)' 
                          : decision === 'BRIDGE'
                          ? 'rgba(139, 92, 246, 0.15)'
                          : decision?.toUpperCase().includes('CLARIFY')
                          ? 'rgba(236, 72, 153, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      }}>
                        {decision === 'ADVANCE' ? (
                          <ArrowForwardIcon sx={{ fontSize: 24, color: '#22d3ee' }} />
                        ) : decision === 'BRIDGE' ? (
                          <CompareArrowsIcon sx={{ fontSize: 24, color: '#8b5cf6' }} />
                        ) : decision?.toUpperCase().includes('CLARIFY') ? (
                          <LiveHelpIcon sx={{ fontSize: 24, color: '#ec4899' }} />
                        ) : (
                          <PanToolIcon sx={{ fontSize: 24, color: '#f59e0b' }} />
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ 
                          color: 'text.secondary', 
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          display: 'block',
                          mb: 0.25,
                        }}>
                          Chosen
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          fontSize: '1.1rem', 
                          color: 'text.primary',
                          lineHeight: 1.2,
                        }}>
                          {formatIntentLabel(decision)} → {targetStepId ? getNodeTitle(targetStepId) : 'Current Step'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Pills Row */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {controllerOutput?.stepRecommendation?.decision?.confidence && (
                        <Chip 
                          label={`${(controllerOutput.stepRecommendation.decision.confidence * 100).toFixed(0)}% Confident`}
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(100, 116, 139, 0.12)',
                            fontWeight: 700, 
                            fontSize: '0.7rem',
                            height: 24,
                          }}
                        />
                      )}
                      {simData?.decision?.status && (
                        <Chip 
                          label={formatIntentLabel(simData.decision.status)}
                          size="small"
                          color={simData.decision.status === 'HIGH' ? 'success' : simData.decision.status === 'MEDIUM' ? 'default' : 'warning'}
                          sx={{ fontSize: '0.7rem', fontWeight: 700, height: 24 }}
                        />
                      )}
                      {simData?.decision?.margin !== undefined && (
                        <Chip 
                          label={`Margin ${(simData.decision.margin * 100).toFixed(0)}%`}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 700,
                            height: 24,
                          }}
                        />
                      )}
                    </Box>
                    
                    {/* Reasoning */}
                    {executionResult?.reasoning && (
                      <Typography variant="caption" sx={{ 
                        color: 'text.secondary', 
                        fontSize: '0.72rem',
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                        display: 'block',
                        mt: 1.5,
                      }}>
                        {executionResult.reasoning}
                      </Typography>
                    )}
                  </Box>

                  {/* Alternative Paths - Also Considered */}
                  {controllerOutput?.stepRecommendation?.rankedCandidates && controllerOutput.stepRecommendation.rankedCandidates.length > 0 && (
                    <Box sx={{ 
                      borderTop: '2px solid',
                      borderColor: 'divider',
                      bgcolor: 'rgba(0,0,0,0.02)',
                    }}>
                      <Box sx={{ p: 1.5, pb: 1 }}>
                        <Typography variant="caption" sx={{ 
                          color: 'text.secondary', 
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                        }}>
                          Also Considered
                        </Typography>
                      </Box>
                      {controllerOutput.stepRecommendation.rankedCandidates.map((candidate, idx) => (
                      <Box key={idx} sx={{ 
                        p: 1.5,
                        borderBottom: idx < controllerOutput.stepRecommendation.rankedCandidates.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.02)',
                        },
                      }}>
                        {/* Info Icon with Tooltip */}
                        <Tooltip 
                          title={
                            <Box sx={{ p: 0.5 }}>
                              {candidate.reasons.map((reason, rIdx) => (
                                <Typography 
                                  key={rIdx} 
                                  variant="caption" 
                                  sx={{ 
                                    display: 'block',
                                    mb: rIdx < candidate.reasons.length - 1 ? 0.5 : 0,
                                    fontSize: '0.72rem',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  • {reason}
                                </Typography>
                              ))}
                            </Box>
                          }
                          placement="left"
                          arrow
                        >
                          <InfoOutlinedIcon sx={{ 
                            fontSize: 18, 
                            color: 'text.secondary',
                            cursor: 'pointer',
                            '&:hover': {
                              color: 'primary.main',
                            },
                          }} />
                        </Tooltip>

                        {/* Title */}
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.8rem',
                          color: 'text.primary',
                          flex: 1,
                        }}>
                          {getNodeTitle(candidate.nodeId)}
                        </Typography>

                        {/* Progress Bar */}
                        <Box sx={{ 
                          width: 100,
                          height: 6,
                          bgcolor: 'rgba(0,0,0,0.05)',
                          borderRadius: 1,
                          overflow: 'hidden',
                        }}>
                          <Box sx={{
                            width: `${candidate.score * 100}%`,
                            height: '100%',
                            bgcolor: candidate.score >= 0.7 
                              ? '#22d3ee' 
                              : candidate.score >= 0.4
                              ? '#94a3b8'
                              : '#f87171',
                            transition: 'width 0.3s ease',
                          }} />
                        </Box>
                        
                        {/* Score Badge */}
                        <Chip 
                          label={`${(candidate.score * 100).toFixed(0)}%`}
                          size="small"
                          sx={{ 
                            height: 22, 
                            fontSize: '0.7rem',
                            bgcolor: candidate.score >= 0.7 
                              ? 'rgba(34, 211, 238, 0.15)' 
                              : candidate.score >= 0.4
                              ? 'rgba(100, 116, 139, 0.1)'
                              : 'rgba(248, 113, 113, 0.1)',
                            color: candidate.score >= 0.7 
                              ? '#22d3ee' 
                              : candidate.score >= 0.4
                              ? 'text.secondary'
                              : '#f87171',
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                  ))}
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* Dynamic Half-Ring Gauges (no title) */}
            {tickSignals && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                  {Object.entries(tickSignals)
                    .filter(([key, value]) => typeof value === 'number' && key !== 'objections')
                    .map(([key, value]) => {
                      const percentage = (value as number) / 10;
                      const angle = percentage * 180; // Half circle (0-180 degrees)
                      
                      // Color scheme based on value
                      const getColor = () => {
                        if (key === 'pain') return value > 5 ? '#ef4444' : '#22c55e';
                        if (key === 'urgency') return value > 5 ? '#f59e0b' : '#22c55e';
                        if (key === 'vulnerability') return value > 5 ? '#f59e0b' : '#22c55e';
                        if (key === 'engagement') return value > 7 ? '#22c55e' : value >= 5 ? '#3b82f6' : '#94a3b8';
                        if (key === 'hesitation') return value > 5 ? '#f59e0b' : '#22c55e';
                        if (key === 'confusion') return value > 5 ? '#f59e0b' : '#22c55e';
                        return value > 5 ? '#f59e0b' : '#22c55e';
                      };
                      
                      const color = getColor();
                      
                      return (
                        <Box 
                          key={key}
                          sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            p: 1.5,
                            bgcolor: 'rgba(0,0,0,0.02)',
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          {/* Half-Ring Gauge */}
                          <Box sx={{ position: 'relative', width: 80, height: 50, mb: 1 }}>
                            {/* SVG for precise half-ring */}
                            <svg width="80" height="50" viewBox="0 0 80 50" style={{ overflow: 'visible' }}>
                              {/* Background arc (muted/toned down color) - always full */}
                              <path
                                d="M 10 45 A 30 30 0 0 1 70 45"
                                fill="none"
                                stroke={`${color}20`}
                                strokeWidth="8"
                                strokeLinecap="round"
                              />
                              {/* Colored progress arc (bright) - only the filled portion */}
                              <path
                                d="M 10 45 A 30 30 0 0 1 70 45"
                                fill="none"
                                stroke={color}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${percentage * 94.2} 94.2`}
                                style={{ transition: 'stroke-dasharray 0.3s ease' }}
                              />
                            </svg>
                            
                            {/* Value in center */}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: '50%',
                                transform: 'translateX(-50%)',
                              }}
                            >
                              <Typography 
                                variant="h5" 
                                sx={{ 
                                  fontWeight: 700, 
                                  fontSize: '1.4rem',
                                  color: color,
                                  lineHeight: 1,
                                }}
                              >
                                {value}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Label */}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 600,
                              textAlign: 'center',
                              textTransform: 'capitalize',
                              mt: 0.5,
                            }}
                          >
                            {key}
                          </Typography>
                        </Box>
                      );
                    })}
                </Box>
              </Box>
            )}

            {/* Progress Indicators - Status Grid */}
            {controllerOutput.progress && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, display: 'block', mb: 1.5 }}>
                  Progress Status
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: controllerOutput.progress.stagnationTurns > 0 ? '1fr' : '1fr 1fr', gap: 1.5 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: controllerOutput.progress.madeProgress ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    borderRadius: 1.5,
                    border: '2px solid',
                    borderColor: controllerOutput.progress.madeProgress ? 'success.main' : 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    {controllerOutput.progress.madeProgress ? (
                      <CheckCircleIcon sx={{ fontSize: 22, color: 'success.main' }} />
                    ) : (
                      <CancelIcon sx={{ fontSize: 22, color: 'error.light' }} />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {controllerOutput.progress.madeProgress ? 'Progress Made' : 'No Progress'}
                    </Typography>
                  </Box>

                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: controllerOutput.progress.stallDetected ? 'rgba(237, 108, 2, 0.1)' : 'rgba(34, 197, 94, 0.05)',
                    borderRadius: 1.5,
                    border: '2px solid',
                    borderColor: controllerOutput.progress.stallDetected ? 'warning.main' : 'success.light',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    {controllerOutput.progress.stallDetected ? (
                      <WarningAmberIcon sx={{ fontSize: 22, color: 'warning.main' }} />
                    ) : (
                      <CheckCircleOutlineIcon sx={{ fontSize: 22, color: 'success.light' }} />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      {controllerOutput.progress.stallDetected ? 'Stall Detected' : 'No Stall'}
                    </Typography>
                  </Box>

                  {controllerOutput.progress.stagnationTurns > 0 && (
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: 'rgba(239, 68, 68, 0.1)',
                      borderRadius: 1.5,
                      border: '2px solid',
                      borderColor: 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      gridColumn: '1 / -1'
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                        {controllerOutput.progress.stagnationTurns}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                        Stagnant Turns
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* Control Flags - Compact List */}
            {controllerOutput.controlFlags && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, display: 'block', mb: 1.5 }}>
                  Control Flags
                </Typography>
                <Box sx={{ 
                  p: 1.5, 
                  bgcolor: 'rgba(0,0,0,0.02)', 
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>Can Advance</Typography>
                      <Box sx={{ 
                        width: 18, 
                        height: 18, 
                        borderRadius: '50%', 
                        bgcolor: controllerOutput.controlFlags.canAdvance ? 'success.main' : 'error.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.7rem'
                      }}>
                        {controllerOutput.controlFlags.canAdvance ? '✓' : '✗'}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 0.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>Needs Explanation</Typography>
                      <Box sx={{ 
                        width: 18, 
                        height: 18, 
                        borderRadius: '50%', 
                        bgcolor: controllerOutput.controlFlags.needsExplanation ? 'warning.main' : 'success.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.7rem'
                      }}>
                        {controllerOutput.controlFlags.needsExplanation ? '✓' : '✗'}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 0.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>Fast Track Eligible</Typography>
                      <Box sx={{ 
                        width: 18, 
                        height: 18, 
                        borderRadius: '50%', 
                        bgcolor: controllerOutput.controlFlags.fastTrackEligible ? 'success.main' : 'rgba(100, 116, 139, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.7rem'
                      }}>
                        {controllerOutput.controlFlags.fastTrackEligible ? '✓' : '✗'}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 0.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>Human Takeover</Typography>
                      <Box sx={{ 
                        width: 18, 
                        height: 18, 
                        borderRadius: '50%', 
                        bgcolor: controllerOutput.controlFlags.humanTakeoverAllowed ? 'info.main' : 'rgba(100, 116, 139, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.7rem'
                      }}>
                        {controllerOutput.controlFlags.humanTakeoverAllowed ? '✓' : '✗'}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 0.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>Step Sufficient</Typography>
                      <Box sx={{ 
                        width: 18, 
                        height: 18, 
                        borderRadius: '50%', 
                        bgcolor: controllerOutput.stepSufficiency ? 'success.main' : 'warning.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.7rem'
                      }}>
                        {controllerOutput.stepSufficiency ? '✓' : '✗'}
                      </Box>
                    </Box>
                  </Box>

                  {controllerOutput.controlFlags.allowedBlabberModes && controllerOutput.controlFlags.allowedBlabberModes.length > 0 && (
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block', mb: 0.75 }}>
                        Allowed Modes
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {controllerOutput.controlFlags.allowedBlabberModes.map((mode: string) => (
                          <Box 
                            key={mode}
                            sx={{ 
                              px: 1, 
                              py: 0.25, 
                              bgcolor: 'secondary.main', 
                              color: 'white', 
                              borderRadius: 0.5,
                              fontSize: '0.65rem',
                              fontWeight: 600
                            }}
                          >
                            {formatIntentLabel(mode)}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* Execution Metadata - Clean Cards */}
            {executionResult?.executionMetadata && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, display: 'block', mb: 1.5 }}>
                  Execution Metadata
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: 'rgba(34, 211, 238, 0.08)', 
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'secondary.main',
                    textAlign: 'center'
                  }}>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      Mode
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'secondary.main' }}>
                      {formatIntentLabel(executionResult.executionMetadata.blabberModeUsed)}
                    </Typography>
                  </Box>

                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: executionResult.executionMetadata.stepSatisfiedThisTurn ? 'rgba(34, 197, 94, 0.08)' : 'rgba(237, 108, 2, 0.08)', 
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: executionResult.executionMetadata.stepSatisfiedThisTurn ? 'success.main' : 'warning.main',
                    textAlign: 'center'
                  }}>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                      Step Status
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.75rem', color: executionResult.executionMetadata.stepSatisfiedThisTurn ? 'success.main' : 'warning.main' }}>
                      {executionResult.executionMetadata.stepSatisfiedThisTurn ? '✓ Satisfied' : '✗ Not Satisfied'}
                    </Typography>
                  </Box>
                </Box>

                {executionResult.executionMetadata.newlyKnownFacts && executionResult.executionMetadata.newlyKnownFacts.length > 0 && (
                  <Box sx={{ 
                    p: 1.5, 
                    background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(34, 211, 238, 0.03) 100%)',
                    borderRadius: 1.5, 
                    border: '1px solid', 
                    borderColor: 'secondary.light', 
                    mb: 1.5 
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LockOpenIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                      <Typography variant="caption" sx={{ color: 'secondary.main', fontSize: '0.7rem', fontWeight: 700 }}>
                        {executionResult.executionMetadata.newlyKnownFacts.length} New Facts Learned
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {executionResult.executionMetadata.newlyKnownFacts.map((fact: string) => (
                        <Box 
                          key={fact}
                          sx={{ 
                            px: 1, 
                            py: 0.5, 
                            bgcolor: 'rgba(255,255,255,0.6)', 
                            borderRadius: 0.75,
                            fontSize: '0.7rem',
                            border: '1px solid',
                            borderColor: 'secondary.light',
                          }}
                        >
                          {formatIntentLabel(fact)}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {executionResult?.executionMetadata?.readinessDelta && executionResult.executionMetadata.readinessDelta.length > 0 && (
                  <Box sx={{ 
                    p: 1.5, 
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                    borderRadius: 1.5, 
                    border: '2px solid', 
                    borderColor: 'success.main'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                      <Typography variant="caption" sx={{ color: 'success.dark', fontSize: '0.75rem', fontWeight: 700 }}>
                        Capabilities Unlocked
                      </Typography>
                    </Box>
                    {executionResult.executionMetadata.readinessDelta.map((item: string, idx: number) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                        <Typography variant="caption" sx={{ color: 'success.dark', fontSize: '0.75rem' }}>
                          {formatIntentLabel(item)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}



            {/* Gap Recommendation */}
            {executionResult?.gapRecommendation && (
              <Box sx={{ mb: 3, p: 1.5, bgcolor: 'error.lighter', border: '2px solid', borderColor: 'error.main', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.dark', mb: 0.5, fontSize: '0.85rem' }}>
                  ⚠️ Flow Gap Detected
                </Typography>
                <Typography variant="caption" sx={{ color: 'error.dark', fontSize: '0.75rem' }}>
                  {executionResult.gapRecommendation}
                </Typography>
              </Box>
            )}

            {/* Simulation Issues */}
            {simData?.issues && simData.issues.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1.5 }}>
                  ⚠️ Simulation Issues
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {simData.issues.map((issue: any, idx: number) => (
                    <Box 
                      key={idx} 
                      sx={{ 
                        p: 1.5, 
                        bgcolor: issue.severity > 5 ? 'error.lighter' : 'warning.lighter', 
                        borderRadius: 1, 
                        border: '1px solid', 
                        borderColor: issue.severity > 5 ? 'error.light' : 'warning.light' 
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip 
                          label={formatIntentLabel(issue.kind)}
                          size="small"
                          color={issue.severity > 5 ? 'error' : 'warning'}
                          sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                        />
                        {issue.severity !== undefined && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                            Severity: {issue.severity}/10
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                        {issue.details}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* User Intent & Signals */}
            {userIntentDetection && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1.5 }}>
                  User Intent & Signals
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                  {/* Primary Intent */}
                  <Chip 
                    label={formatIntentLabel(userIntentDetection.primaryIntent)}
                    size="small"
                    sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                  />
                  
                  {/* Hesitation Signal */}
                  {userIntentDetection.signals?.hesitation > 0 && (
                    <Chip 
                      label={`Hesitation: ${(userIntentDetection.signals.hesitation * 100).toFixed(0)}%`}
                      size="small" 
                      color="warning" 
                      variant="outlined" 
                      sx={{ fontSize: '0.7rem' }} 
                    />
                  )}
                  
                  {/* Confusion Signal */}
                  {userIntentDetection.signals?.confusion > 0 && (
                    <Chip 
                      label={`Confusion: ${(userIntentDetection.signals.confusion * 100).toFixed(0)}%`}
                      size="small" 
                      color="warning" 
                      variant="outlined" 
                      sx={{ fontSize: '0.7rem' }} 
                    />
                  )}
                  
                  {/* Objections */}
                  {userIntentDetection.signals?.objections && userIntentDetection.signals.objections.length > 0 && (
                    <Chip 
                      label={`${userIntentDetection.signals.objections.length} Objection${userIntentDetection.signals.objections.length > 1 ? 's' : ''}`}
                      size="small" 
                      color="error" 
                      variant="outlined" 
                      sx={{ fontSize: '0.7rem' }} 
                    />
                  )}
                  
                  {/* Engagement (from controller output if available) */}
                  {controllerOutput?.signals?.engagement !== undefined && (
                    <Chip 
                      label={`Engagement: ${controllerOutput.signals.engagement}/10`}
                      size="small"
                      color={controllerOutput.signals.engagement > 7 ? 'success' : controllerOutput.signals.engagement >= 5 ? 'default' : 'warning'}
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                    />
                  )}
                </Box>
                
                {/* Show objection details if any */}
                {userIntentDetection.signals?.objections && userIntentDetection.signals.objections.length > 0 && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'error.lighter', borderRadius: 1, border: '1px solid', borderColor: 'error.light' }}>
                    <Typography variant="caption" sx={{ color: 'error.dark', fontWeight: 600, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                      Objections Detected:
                    </Typography>
                    {userIntentDetection.signals.objections.map((objection: string, idx: number) => (
                      <Typography key={idx} variant="caption" sx={{ color: 'error.dark', display: 'block', fontSize: '0.72rem' }}>
                        • {objection}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            <Divider sx={{ my: 3 }} />
          </>
        )}

        {/* Show simplified readiness when viewing agent diagnostics */}
        {hasMetadata ? (
          <Box>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1.5, fontSize: '0.7rem' }}>
              Conversation State
            </Typography>
            
            {/* Quick summary */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                icon={<CheckCircleIcon />}
                label={`${knownFacts.length} known`}
                size="small" 
                sx={{ bgcolor: 'rgba(34, 211, 238, 0.15)', color: 'secondary.main', fontWeight: 600 }}
              />
              <Chip 
                icon={<HelpOutlineIcon />}
                label={`${missingFacts.length} needed`}
                size="small"
                color="warning"
              />
              <Chip 
                icon={<LockOpenIcon />}
                label={`${readinessDelta.length} unlocks`}
                size="small"
                sx={{ bgcolor: 'rgba(100, 116, 139, 0.15)', fontWeight: 600 }}
              />
            </Box>
          </Box>
        ) : (
          <>
            {/* Full readiness view when no agent selected */}
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 2 }}>
              Conversation Readiness
            </Typography>

            {/* Known So Far */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <CheckCircleIcon fontSize="small" sx={{ color: 'secondary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Known so far
                </Typography>
                <Chip 
                  label={knownFacts.length} 
                  size="small" 
                  sx={{ bgcolor: 'rgba(34, 211, 238, 0.15)', color: 'secondary.main', fontWeight: 600 }}
                />
              </Box>
              {knownFacts.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                  Nothing captured yet
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {knownFacts.map((item, index) => (
                    <Box key={index} sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                        {item.category}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', mb: 0.25 }}>
                        {formatIntentLabel(item.fact)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                        {formatFactValue(item.value)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Still Needed */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <HelpOutlineIcon fontSize="small" sx={{ color: 'warning.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Still needed
                </Typography>
                <Chip label={missingFacts.length} size="small" color="warning" />
              </Box>
              {missingFacts.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                  All required information captured
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {missingFacts.map((fact, index) => (
                    <Chip
                      key={index}
                      label={formatIntentLabel(fact)}
                      size="small"
                      variant="outlined"
                      color="warning"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Unlocks */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <LockOpenIcon fontSize="small" sx={{ color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Unlocks
                </Typography>
                <Chip 
                  label={readinessDelta.length} 
                  size="small" 
                  sx={{ bgcolor: 'rgba(100, 116, 139, 0.15)', color: 'primary.main', fontWeight: 600 }}
                />
              </Box>
              {readinessDelta.length === 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                  No new capabilities unlocked
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {readinessDelta.map((unlock, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: 'success.lighter',
                        border: '1px solid',
                        borderColor: 'success.light',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 600, fontSize: '0.75rem' }}>
                        {formatIntentLabel(unlock)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </>
              )}
            </>
          )}

          {/* Tab 1: Data Collected */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 2 }}>
                Data Collected
              </Typography>
              
              {/* Show turn-specific progress if agent node is selected */}
              {selectedNode && selectedNode.progress ? (
                <>
                  {(() => {
                    const directCollectedData = (selectedNode.metadata as any)?.collectedData || {};
                    const updatedStateData = (selectedNode.metadata as any)?.updatedState?.collectedData || {};
                    const allAgentNodes = currentRun?.nodes?.filter((n: any) => n.agentMessage) || [];
                    const latestWithData = allAgentNodes
                      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .find((n: any) => (n.metadata as any)?.collectedData && Object.keys((n.metadata as any).collectedData).length > 0);
                    
                    console.log('🔍 DEBUG ReadinessPanel Data Tab:', {
                      selectedNodeId: selectedNode.nodeId,
                      selectedNodeTimestamp: selectedNode.timestamp,
                      hasDirectCollectedData: Object.keys(directCollectedData).length,
                      hasUpdatedStateData: Object.keys(updatedStateData).length,
                      directCollectedDataKeys: Object.keys(directCollectedData),
                      updatedStateDataKeys: Object.keys(updatedStateData),
                      latestNodeWithDataId: latestWithData?.nodeId,
                      latestNodeDataKeys: latestWithData ? Object.keys((latestWithData.metadata as any)?.collectedData || {}) : [],
                      learnedThisTurn: selectedNode.progress?.learnedThisTurn,
                      knownSoFar: selectedNode.progress?.knownSoFar,
                      selectedNodeMetadataKeys: Object.keys(selectedNode.metadata || {}),
                      fullMetadata: selectedNode.metadata,
                    });
                    return null;
                  })()}
                  {/* Learned This Turn */}
                  {selectedNode.progress.learnedThisTurn && selectedNode.progress.learnedThisTurn.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Box sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          bgcolor: 'success.main', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                        }}>
                          <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, fontSize: '0.7rem' }}>
                            🆕
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          Learned This Turn
                        </Typography>
                        <Chip 
                          label={selectedNode.progress.learnedThisTurn.length} 
                          size="small" 
                          sx={{ bgcolor: 'rgba(34, 197, 94, 0.15)', color: 'success.main', fontWeight: 600 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {selectedNode.progress.learnedThisTurn.map((factId: string, index: number) => {
                          // Get collectedData with comprehensive fallback
                          const directData = (selectedNode.metadata as any)?.collectedData || {};
                          const updatedStateData = (selectedNode.metadata as any)?.updatedState?.collectedData || {};
                          const latestAgentWithData = currentRun?.nodes
                            ?.filter((n: any) => n.agentMessage && (n.metadata as any)?.collectedData)
                            ?.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                          const latestData = (latestAgentWithData?.metadata as any)?.collectedData || {};
                          
                          const collectedData = Object.keys(directData).length > 0 
                            ? directData 
                            : Object.keys(updatedStateData).length > 0 
                              ? updatedStateData 
                              : latestData;
                          
                          const factData = collectedData[factId];
                          const confidence = factData?.confidence ? Math.round(factData.confidence * 100) : null;
                          const value = factData?.value;
                          const inferredFrom = factData?.inferredFrom || [];
                          
                          // Check if this fact has a conflict - look in parent user node's intentDetection
                          const parentUserNode = currentRun?.nodes?.find((n: any) => n.nodeId === selectedNode.parentNodeId);
                          const conflicts = parentUserNode?.intentDetection?.conflicts || 
                                          selectedNode?.intentDetection?.conflicts || 
                                          [];
                          
                          console.log('🔍 Conflict check for fact:', {
                            factId,
                            parentUserNodeId: parentUserNode?.nodeId,
                            hasParentIntentDetection: !!parentUserNode?.intentDetection,
                            parentConflicts: parentUserNode?.intentDetection?.conflicts,
                            selectedNodeConflicts: selectedNode?.intentDetection?.conflicts,
                            allConflicts: conflicts,
                          });
                          
                          const hasConflict = conflicts.some((conflict: any) => 
                            conflict.factId === factId || conflict.affectedFactIds?.includes(factId)
                          );
                          const conflictInfo = conflicts.find((conflict: any) => 
                            conflict.factId === factId || conflict.affectedFactIds?.includes(factId)
                          );
                          
                          // Check if value is an object (not array, not null) - expand into sub-facts
                          const isObjectValue = value && typeof value === 'object' && !Array.isArray(value);
                          
                          if (isObjectValue) {
                            // Render each property as a separate fact
                            return Object.entries(value as Record<string, any>).map(([subKey, subValue], subIndex) => (
                              <Box 
                                key={`${index}-${subIndex}`} 
                                sx={{ 
                                  display: 'grid',
                                  gridTemplateColumns: '1fr auto auto',
                                  gap: 2,
                                  alignItems: 'center',
                                  p: 1.5,
                                  bgcolor: hasConflict ? 'rgba(245, 158, 11, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                                  borderLeft: '3px solid',
                                  borderLeftColor: hasConflict ? 'warning.main' : 'success.main',
                                  borderRadius: 0.5,
                                  animation: 'fadeIn 0.5s ease-in',
                                  '@keyframes fadeIn': {
                                    '0%': { opacity: 0, transform: 'translateX(-10px)' },
                                    '100%': { opacity: 1, transform: 'translateX(0)' },
                                  },
                                }}
                              >
                                {/* Fact Name & Value */}
                                <Box sx={{ flex: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                                      {formatIntentLabel(factId)} → {formatIntentLabel(subKey)}
                                    </Typography>
                                    {hasConflict && (
                                      <Tooltip title={conflictInfo?.implausibilityStatement || 'Conflict detected'} placement="top">
                                        <Box sx={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          px: 0.75,
                                          py: 0.25,
                                          borderRadius: 0.5,
                                          bgcolor: 'rgba(245, 158, 11, 0.15)',
                                          border: '1px solid',
                                          borderColor: 'warning.main',
                                          cursor: 'help',
                                        }}>
                                          <WarningIcon sx={{ fontSize: '0.75rem', color: 'warning.main' }} />
                                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'warning.main', fontWeight: 700, textTransform: 'uppercase' }}>
                                            Conflict
                                          </Typography>
                                        </Box>
                                      </Tooltip>
                                    )}
                                  </Box>
                                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: hasConflict ? 'warning.main' : 'text.primary', lineHeight: 1.2 }}>
                                    {typeof subValue === 'boolean' 
                                      ? (subValue ? '✓ Confirmed' : '✗ Not confirmed')
                                      : formatFactValue(subValue)}
                                  </Typography>
                                  {hasConflict && conflictInfo?.implausibilityStatement && (
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'error.main', lineHeight: 1.5, fontWeight: 600, mt: 1 }}>
                                      {conflictInfo.implausibilityStatement}
                                    </Typography>
                                  )}
                                </Box>
                                
                                {/* Confidence Badge */}
                                {confidence !== null && (
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.5,
                                    bgcolor: 'success.main',
                                    borderRadius: 1,
                                  }}>
                                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, fontSize: '0.7rem' }}>
                                      {confidence}%
                                    </Typography>
                                  </Box>
                                )}
                                
                                {/* New Indicator */}
                                <UpdateIcon sx={{ fontSize: 18, color: 'success.main' }} />
                              </Box>
                            ));
                          }
                          
                          // Regular fact rendering
                          return (
                            <Box 
                              key={index} 
                              sx={{ 
                                display: 'grid',
                                gridTemplateColumns: '1fr auto auto',
                                gap: 2,
                                alignItems: 'center',
                                p: 1.5,
                                bgcolor: hasConflict ? 'rgba(245, 158, 11, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                                borderLeft: '3px solid',
                                borderLeftColor: hasConflict ? 'warning.main' : 'success.main',
                                borderRadius: 0.5,
                                animation: 'fadeIn 0.5s ease-in',
                                '@keyframes fadeIn': {
                                  '0%': { opacity: 0, transform: 'translateX(-10px)' },
                                  '100%': { opacity: 1, transform: 'translateX(0)' },
                                },
                              }}
                            >
                              {/* Fact Name & Value */}
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                                    {formatIntentLabel(factId)}
                                  </Typography>
                                  {hasConflict && (
                                    <Tooltip title={conflictInfo?.implausibilityStatement || 'Conflict detected'} placement="top">
                                      <Box sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 0.75,
                                        py: 0.25,
                                        borderRadius: 0.5,
                                        bgcolor: 'rgba(245, 158, 11, 0.15)',
                                        border: '1px solid',
                                        borderColor: 'warning.main',
                                        cursor: 'help',
                                      }}>
                                        <WarningIcon sx={{ fontSize: '0.75rem', color: 'warning.main' }} />
                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'warning.main', fontWeight: 700, textTransform: 'uppercase' }}>
                                          Conflict
                                        </Typography>
                                      </Box>
                                    </Tooltip>
                                  )}
                                </Box>
                                {value !== undefined ? (
                                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: hasConflict ? 'warning.main' : 'text.primary', lineHeight: 1.2 }}>
                                    {typeof value === 'boolean' 
                                      ? (value ? '✓ Confirmed' : '✗ Not confirmed')
                                      : formatFactValue(value)}
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                    No value captured
                                  </Typography>
                                )}
                                {inferredFrom.length > 0 && (
                                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled', fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                                    ↳ inferred from {inferredFrom.map((f: string) => formatIntentLabel(f)).join(', ')}
                                  </Typography>
                                )}
                                {hasConflict && conflictInfo?.implausibilityStatement && (
                                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'error.main', lineHeight: 1.5, fontWeight: 600, mt: 1 }}>
                                    {conflictInfo.implausibilityStatement}
                                  </Typography>
                                )}
                              </Box>
                              
                              {/* Confidence Badge */}
                              {confidence !== null && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5,
                                  px: 1,
                                  py: 0.5,
                                  bgcolor: 'success.main',
                                  borderRadius: 1,
                                }}>
                                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, fontSize: '0.7rem' }}>
                                    {confidence}%
                                  </Typography>
                                </Box>
                              )}
                              
                              {/* New Indicator */}
                              <UpdateIcon sx={{ fontSize: 18, color: 'success.main' }} />
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  )}

                  {/* Conflicted Observations */}
                  {(() => {
                    // Get the parent user node for this agent response
                    const parentUserNode = currentRun?.nodes?.find((n: any) => n.nodeId === selectedNode.parentNodeId);
                    const observedFacts = parentUserNode?.intentDetection?.observedFacts || [];
                    const conflicts = parentUserNode?.intentDetection?.conflicts || [];
                    
                    // Filter observed facts that have conflicts
                    const conflictedFacts = observedFacts.filter((fact: any) => 
                      conflicts.some((conflict: any) => 
                        conflict.factId === fact.factId || conflict.affectedFactIds?.includes(fact.factId)
                      )
                    );

                    if (conflictedFacts.length === 0) return null;

                    return (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <Box sx={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: '50%', 
                              bgcolor: 'error.main', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                            }}>
                              <WarningIcon sx={{ fontSize: '0.8rem', color: 'white' }} />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'error.main' }}>
                              Conflicted Observations
                            </Typography>
                            <Chip 
                              label={conflictedFacts.length} 
                              size="small" 
                              sx={{ bgcolor: 'rgba(211, 47, 47, 0.15)', color: 'error.main', fontWeight: 600 }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {conflictedFacts.map((fact: any, index: number) => {
                              const conflictInfo = conflicts.find((conflict: any) => 
                                conflict.factId === fact.factId || conflict.affectedFactIds?.includes(fact.factId)
                              );
                              
                              return (
                                <Box 
                                  key={index} 
                                  sx={{ 
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto',
                                    gap: 2,
                                    alignItems: 'center',
                                    p: 1.5,
                                    bgcolor: 'rgba(60, 60, 60, 0.6)',
                                    borderLeft: '3px solid',
                                    borderLeftColor: 'error.main',
                                    borderRadius: 0.5,
                                  }}
                                >
                                  {/* Fact Name & Value */}
                                  <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                      <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.primary', fontWeight: 600 }}>
                                        {formatIntentLabel(fact.factId)}
                                      </Typography>
                                      <Tooltip title={conflictInfo?.implausibilityStatement || 'Conflict detected'} placement="top">
                                        <Box sx={{ 
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 0.35,
                                          px: 0.6,
                                          py: 0.3,
                                          bgcolor: 'error.main',
                                          borderRadius: 0.5,
                                          cursor: 'help',
                                        }}>
                                          <WarningIcon sx={{ fontSize: '0.7rem', color: 'white' }} />
                                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'white', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                            Conflict
                                          </Typography>
                                        </Box>
                                      </Tooltip>
                                    </Box>
                                    {fact.value !== undefined ? (
                                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                                        {typeof fact.value === 'boolean' 
                                          ? (fact.value ? '✓ Confirmed' : '✗ Not confirmed')
                                          : formatFactValue(fact.value)}
                                      </Typography>
                                    ) : (
                                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                        No value observed
                                      </Typography>
                                    )}
                                    {conflictInfo?.implausibilityStatement && (
                                      <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'error.main', lineHeight: 1.5, fontWeight: 600, mt: 1 }}>
                                        {conflictInfo.implausibilityStatement}
                                      </Typography>
                                    )}
                                  </Box>
                                  
                                  {/* Confidence Badge */}
                                  {fact.confidence !== undefined && (
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 0.5,
                                      px: 1,
                                      py: 0.5,
                                      bgcolor: 'error.main',
                                      borderRadius: 1,
                                    }}>
                                      <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, fontSize: '0.7rem' }}>
                                        {Math.round(fact.confidence * 100)}%
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      </>
                    );
                  })()}

                  <Divider sx={{ my: 2 }} />

                  {/* Known So Far (up until this turn) */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <CheckCircleIcon fontSize="small" sx={{ color: 'secondary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        Known Up Until Now
                      </Typography>
                      <Chip 
                        label={selectedNode.progress.knownSoFar?.length || 0} 
                        size="small" 
                        sx={{ bgcolor: 'rgba(34, 211, 238, 0.15)', color: 'secondary.main', fontWeight: 600 }}
                      />
                    </Box>
                    {!selectedNode.progress.knownSoFar || selectedNode.progress.knownSoFar.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                        Nothing captured yet
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {selectedNode.progress.knownSoFar.map((factId: string, index: number) => {
                          const isNewThisTurn = selectedNode.progress.learnedThisTurn?.includes(factId);
                          // Get collectedData with comprehensive fallback
                          const directData = (selectedNode.metadata as any)?.collectedData || {};
                          const updatedStateData = (selectedNode.metadata as any)?.updatedState?.collectedData || {};
                          const latestAgentWithData = currentRun?.nodes
                            ?.filter((n: any) => n.agentMessage && (n.metadata as any)?.collectedData)
                            ?.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                          const latestData = (latestAgentWithData?.metadata as any)?.collectedData || {};
                          
                          const collectedData = Object.keys(directData).length > 0 
                            ? directData 
                            : Object.keys(updatedStateData).length > 0 
                              ? updatedStateData 
                              : latestData;
                          
                          const factData = collectedData[factId];
                          const confidence = factData?.confidence ? Math.round(factData.confidence * 100) : null;
                          const value = factData?.value;
                          const inferredFrom = factData?.inferredFrom || [];
                          
                          // Check if value is an object (not array, not null) - expand into sub-facts
                          const isObjectValue = value && typeof value === 'object' && !Array.isArray(value);
                          
                          if (isObjectValue) {
                            // Render each property as a separate fact
                            return Object.entries(value as Record<string, any>).map(([subKey, subValue], subIndex) => (
                              <Box 
                                key={`${index}-${subIndex}`} 
                                sx={{ 
                                  display: 'grid',
                                  gridTemplateColumns: '1fr auto',
                                  gap: 2,
                                  alignItems: 'center',
                                  p: 1.5,
                                  bgcolor: isNewThisTurn ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                                  borderLeft: '3px solid',
                                  borderLeftColor: isNewThisTurn ? 'success.main' : 'divider',
                                  borderRadius: 0.5,
                                }}
                              >
                                {/* Fact Name & Value */}
                                <Box>
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 0.5, display: 'block' }}>
                                    {formatIntentLabel(factId)} → {formatIntentLabel(subKey)}
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                                    {typeof subValue === 'boolean' 
                                      ? (subValue ? '✓ Confirmed' : '✗ Not confirmed')
                                      : formatFactValue(subValue)}
                                  </Typography>
                                </Box>
                                
                                {/* Confidence Badge */}
                                {confidence !== null && (
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 0.5,
                                    px: 1,
                                    py: 0.5,
                                    bgcolor: isNewThisTurn ? 'success.main' : 'rgba(34, 211, 238, 0.2)',
                                    color: isNewThisTurn ? 'white' : 'secondary.main',
                                    borderRadius: 1,
                                  }}>
                                    <Typography variant="caption" sx={{ color: 'inherit', fontWeight: 700, fontSize: '0.7rem' }}>
                                      {confidence}%
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            ));
                          }
                          
                          // Regular fact rendering
                          return (
                            <Box 
                              key={index} 
                              sx={{ 
                                display: 'grid',
                                gridTemplateColumns: '1fr auto',
                                gap: 2,
                                alignItems: 'center',
                                p: 1.5,
                                bgcolor: isNewThisTurn ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                                borderLeft: '3px solid',
                                borderLeftColor: isNewThisTurn ? 'success.main' : 'divider',
                                borderRadius: 0.5,
                              }}
                            >
                              {/* Fact Name & Value */}
                              <Box>
                                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 0.5, display: 'block' }}>
                                  {formatIntentLabel(factId)}
                                </Typography>
                                {value !== undefined ? (
                                  <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                                    {typeof value === 'boolean' 
                                      ? (value ? '✓ Confirmed' : '✗ Not confirmed')
                                      : formatFactValue(value)}
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                    No value captured
                                  </Typography>
                                )}
                                {inferredFrom.length > 0 && (
                                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled', fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                                    ↳ inferred from {inferredFrom.map((f: string) => formatIntentLabel(f)).join(', ')}
                                  </Typography>
                                )}
                              </Box>
                              
                              {/* Confidence Badge */}
                              {confidence !== null && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5,
                                  px: 1,
                                  py: 0.5,
                                  bgcolor: isNewThisTurn ? 'success.main' : 'rgba(34, 211, 238, 0.2)',
                                  color: isNewThisTurn ? 'white' : 'secondary.main',
                                  borderRadius: 1,
                                }}>
                                  <Typography variant="caption" sx={{ color: 'inherit', fontWeight: 700, fontSize: '0.7rem' }}>
                                    {confidence}%
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Still Needed */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <HelpOutlineIcon fontSize="small" sx={{ color: 'warning.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        Still Needed
                      </Typography>
                      <Chip 
                        label={selectedNode.progress.pendingToLearn?.length || 0} 
                        size="small" 
                        color="warning" 
                      />
                    </Box>
                    {!selectedNode.progress.pendingToLearn || selectedNode.progress.pendingToLearn.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                        All required information captured (or no specific requirements)
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {selectedNode.progress.pendingToLearn.map((factId: string, index: number) => {
                          // Check if this pending fact has a conflict - look in parent user node's intentDetection
                          const parentUserNode = currentRun?.nodes?.find((n: any) => n.nodeId === selectedNode.parentNodeId);
                          const conflicts = parentUserNode?.intentDetection?.conflicts || 
                                          selectedNode?.intentDetection?.conflicts || 
                                          [];
                          const hasConflict = conflicts.some((conflict: any) => 
                            conflict.factId === factId || conflict.affectedFactIds?.includes(factId)
                          );
                          const conflictInfo = conflicts.find((conflict: any) => 
                            conflict.factId === factId || conflict.affectedFactIds?.includes(factId)
                          );
                          
                          return (
                            <Box 
                              key={index} 
                              sx={{ 
                                display: 'grid',
                                gridTemplateColumns: '1fr auto',
                                gap: 2,
                                alignItems: 'center',
                                p: 1.5,
                                bgcolor: hasConflict ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                                borderLeft: '3px dashed',
                                borderLeftColor: hasConflict ? 'error.main' : 'warning.main',
                                borderRadius: 0.5,
                              }}
                            >
                              {/* Fact Name */}
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'text.primary' }}>
                                    {formatIntentLabel(factId)}
                                  </Typography>
                                  {hasConflict && (
                                    <Tooltip title={conflictInfo?.implausibilityStatement || 'Conflict detected'} placement="top">
                                      <Box sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: 0.75,
                                        py: 0.25,
                                        borderRadius: 0.5,
                                        bgcolor: 'rgba(239, 68, 68, 0.15)',
                                        border: '1px solid',
                                        borderColor: 'error.main',
                                        cursor: 'help',
                                      }}>
                                        <WarningIcon sx={{ fontSize: '0.75rem', color: 'error.main' }} />
                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'error.main', fontWeight: 700, textTransform: 'uppercase' }}>
                                          Conflict
                                        </Typography>
                                      </Box>
                                    </Tooltip>
                                  )}
                                </Box>
                                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                  {hasConflict ? 'Needs resolution' : 'Not yet collected'}
                                </Typography>
                                {hasConflict && conflictInfo?.implausibilityStatement && (
                                  <Box sx={{ 
                                    mt: 1, 
                                    p: 1, 
                                    bgcolor: 'rgba(239, 68, 68, 0.08)', 
                                    borderRadius: 0.5,
                                    border: '1px solid',
                                    borderColor: 'rgba(239, 68, 68, 0.2)',
                                  }}>
                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'error.dark', lineHeight: 1.4 }}>
                                      {conflictInfo.implausibilityStatement}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                              
                              {/* Status Badge */}
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 0.5,
                                px: 1,
                              py: 0.5,
                              bgcolor: 'rgba(245, 158, 11, 0.15)',
                              color: 'warning.main',
                              borderRadius: 1,
                            }}>
                              <Typography variant="caption" sx={{ color: 'inherit', fontWeight: 600, fontSize: '0.7rem' }}>
                                PENDING
                              </Typography>
                            </Box>
                          </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>

                  {/* Generic Attributes (if any) */}
                  {selectedNode.metadata?.genericAttributes && selectedNode.metadata.genericAttributes.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1.5, color: 'text.secondary' }}>
                          Generic Attributes
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {selectedNode.metadata.genericAttributes.map((attr: any, index: number) => (
                            <Box key={index} sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', mb: 0.25 }}>
                                {typeof attr === 'string' ? attr : JSON.stringify(attr)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </>
                  )}
                </>
              ) : (
                /* Fallback to global state if no node selected */
                <>
                  {/* Known Facts */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <CheckCircleIcon fontSize="small" sx={{ color: 'secondary.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        Known Facts
                      </Typography>
                      <Chip 
                        label={knownFacts.length} 
                        size="small" 
                        sx={{ bgcolor: 'rgba(34, 211, 238, 0.15)', color: 'secondary.main', fontWeight: 600 }}
                      />
                    </Box>
                    {knownFacts.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                        Nothing captured yet
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {knownFacts.map((item, index) => (
                          <Box key={index} sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                              {item.category}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', mb: 0.25 }}>
                              {formatIntentLabel(item.fact)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                              {formatFactValue(item.value)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Missing Facts */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <HelpOutlineIcon fontSize="small" sx={{ color: 'warning.main' }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        Still Needed
                      </Typography>
                      <Chip label={missingFacts.length} size="small" color="warning" />
                    </Box>
                    {missingFacts.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }}>
                        All required information captured
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {missingFacts.map((fact, index) => (
                          <Chip
                            key={index}
                            label={formatIntentLabel(fact)}
                            size="small"
                            variant="outlined"
                            color="warning"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* Tab 2: Turn Cost */}
          {activeTab === 2 && (
            <Box>
              <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 2 }}>
                Turn Cost & Metrics
              </Typography>
              
              {(() => {
                // Calculate current turn cost
                const tokens = (selectedNode?.metadata as any)?.executionResult?.tokens || 
                               selectedNode?.executionResult?.tokens;
                
                console.log('🔍 Cost Tab - Tokens:', {
                  tokens,
                  hasIntentDetection: !!tokens?.intentDetection,
                  hasMergedTickStep: !!tokens?.mergedTickStep,
                  hasProcessorLLM: !!tokens?.processorLLM,
                  hasTotal: !!tokens?.total,
                  tokenKeys: tokens ? Object.keys(tokens) : 'N/A',
                });
                
                // Use total.costUsd for turn cost if available, otherwise sum individual services
                const currentTurnCost = tokens?.total?.costUsd || 
                  (tokens ? (
                    (tokens.intentDetection?.costUsd || 0) +
                    (tokens.mergedTickStep?.costUsd || 0) +
                    (tokens.processorLLM?.costUsd || 0)
                  ) : 0);

                const currentTurnTokens = tokens?.total ? (
                  (tokens.total.input || 0) + (tokens.total.output || 0)
                ) : 0;

                // Traverse upwards from selected node to calculate branch cost
                const branchNodes: any[] = [];
                let currentNodeId = selectedNode?.nodeId;
                const nodeMap = new Map((currentRun?.nodes || []).map((n: any) => [n.nodeId, n]));
                
                console.log('🔍 Cost Tab Debug:', {
                  selectedNodeId: selectedNode?.nodeId,
                  selectedNodeType: selectedNode?.type,
                  currentRunNodesCount: currentRun?.nodes?.length,
                  nodeMapSize: nodeMap.size,
                  nodeMapKeys: Array.from(nodeMap.keys()).slice(0, 5),
                  currentTurnCost,
                  currentTurnTokens,
                  tokensSource: tokens ? 'found' : 'missing'
                });
                
                // Walk up the tree collecting all ancestor agent nodes
                while (currentNodeId) {
                  const node = nodeMap.get(currentNodeId);
                  console.log(`  -> Checking node ${currentNodeId}: ${node ? `type=${node.type}` : 'NOT FOUND'}`);
                  if (!node) break;
                  
                  if (node.type === 'agent') {
                    branchNodes.push(node);
                    const nodeTokens = (node.metadata as any)?.executionResult?.tokens || node.executionResult?.tokens;
                    console.log(`    ✓ Agent node added, has tokens: ${!!nodeTokens}`);
                  }
                  
                  currentNodeId = node.parentNodeId;
                }

                console.log('🔍 Branch traversal complete:', {
                  branchNodesCount: branchNodes.length,
                  branchNodeIds: branchNodes.map(n => n.nodeId)
                });

                // Calculate cumulative cost for this branch only
                const branchCost = branchNodes.reduce((sum: number, node: any) => {
                  const nodeTokens = (node.metadata as any)?.executionResult?.tokens || node.executionResult?.tokens;
                  if (!nodeTokens) {
                    console.log(`    ❌ Node ${node.nodeId}: No tokens found`);
                    return sum;
                  }
                  
                  // Use total.costUsd if available, otherwise sum individual services
                  const nodeCost = nodeTokens.total?.costUsd || (
                    (nodeTokens.intentDetection?.costUsd || 0) +
                    (nodeTokens.mergedTickStep?.costUsd || 0) +
                    (nodeTokens.processorLLM?.costUsd || 0)
                  );
                  console.log(`    💰 Node ${node.nodeId}: $${nodeCost.toFixed(4)}`);
                  return sum + nodeCost;
                }, 0);

                console.log(`💵 Total branch cost: $${branchCost.toFixed(4)}`);

                const branchTokens = branchNodes.reduce((sum: number, node: any) => {
                  const nodeTokens = (node.metadata as any)?.executionResult?.tokens || node.executionResult?.tokens;
                  if (!nodeTokens?.total) return sum;
                  return sum + (nodeTokens.total.input || 0) + (nodeTokens.total.output || 0);
                }, 0);

                const currentTurnTiming = (selectedNode?.metadata as any)?.executionResult?.timing || 
                                         selectedNode?.executionResult?.timing;

                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Branch Total */}
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(139, 92, 246, 0.1)', 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'rgba(139, 92, 246, 0.3)'
                    }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        Conversation Branch Cost
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#8b5cf6', mt: 0.5 }}>
                        ${branchCost.toFixed(4)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                        {branchTokens.toLocaleString()} tokens • {branchNodes.length} turns
                      </Typography>
                    </Box>

                    {/* Current Turn Cost */}
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(34, 197, 94, 0.1)', 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'rgba(34, 197, 94, 0.3)'
                    }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                        This Turn
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main', mt: 0.5 }}>
                        ${currentTurnCost.toFixed(4)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                        {currentTurnTokens.toLocaleString()} tokens
                      </Typography>
                    </Box>

                    {/* Cost Breakdown */}
                    {tokens && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                          Breakdown
                        </Typography>
                        {tokens.intentDetection && tokens.intentDetection.costUsd !== undefined && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>
                              Intent Detection
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                                {(tokens.intentDetection.input + tokens.intentDetection.output).toLocaleString()} tok
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                ${tokens.intentDetection.costUsd.toFixed(4)}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        {tokens.mergedTickStep && tokens.mergedTickStep.costUsd !== undefined && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>
                              Tick & Step Analysis
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                                {(tokens.mergedTickStep.input + tokens.mergedTickStep.output).toLocaleString()} tok
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                ${tokens.mergedTickStep.costUsd.toFixed(4)}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                        {tokens.processorLLM && tokens.processorLLM.costUsd !== undefined && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>
                              Processor LLM
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                                {(tokens.processorLLM.input + tokens.processorLLM.output).toLocaleString()} tok
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                                ${tokens.processorLLM.costUsd.toFixed(4)}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Timing Metrics */}
                    {currentTurnTiming && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
                          Performance
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                          <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>
                            Total Time
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'primary.main' }}>
                            {currentTurnTiming.total}ms
                          </Typography>
                        </Box>
                        {currentTurnTiming.parallelMode && (
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                            <Typography variant="caption" sx={{ fontSize: '0.72rem' }}>
                              Parallel Mode
                            </Typography>
                            <Chip 
                              label={currentTurnTiming.parallelMode}
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })()}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

