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
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useSimulator } from '../../context/SimulatorContext';
import type { KnownFacts } from '../../types/simulator';

const formatFactValue = (value: any): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
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
  const { getCurrentFacts, getLatestNode, selectedNodeId, getNodeById, flow } = useSimulator();
  const currentFacts = getCurrentFacts();
  const latestNode = getLatestNode();
  const selectedNode = selectedNodeId ? getNodeById(selectedNodeId) : null;
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  
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

      <Box sx={{ 
        flex: 1, 
        minHeight: 0, 
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <Box sx={{ p: 2, pb: 4 }}>
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
        </Box>
      </Box>
    </Box>
  );
};

