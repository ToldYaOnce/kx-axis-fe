/**
 * Simulator Context - State management for Execution Mode
 * 
 * Updated to work with new /agent/simulations API
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type {
  SimulationRun,
  SimulationNode,
  SimulationBranch,
  ScenarioContext,
  KnownFacts,
} from '../types/simulator';
import { simulatorAPI, transformFlowNodesForAPI } from '../api/simulatorClient';
import { mockSimulatorResponses } from '../fixtures/simulatorFixtures';
import { generateUUID } from '../utils/uuid';
import type { ConversationFlow } from '../types';
import { flowAPI } from '../api/flowClient';

interface SimulatorContextType {
  // Current state
  currentRun: SimulationRun | null;
  activeBranchId: string | null;
  selectedNodeId: string | null;
  alternateReplyAnchorNodeId: string | null;
  useMockData: boolean;
  
  // NEW: Real API state
  simulationId: string | null;  // For real API
  flow: ConversationFlow | null;  // Current flow being simulated
  isLoadingFlow: boolean;         // Flow loading state
  
  // Actions
  createEmptySimulation: (scenario: ScenarioContext) => Promise<void>;  // NEW: POST /agent/simulations
  stepSimulation: (userMessage: string, explicitParentNodeId?: string) => Promise<void>;  // PATCH /agent/simulations/:id
  forkSimulation: (nodeId: string, branchLabel: string) => Promise<void>;
  selectNode: (nodeId: string) => void;
  selectBranch: (branchId: string) => void;
  setAlternateReplyAnchor: (nodeId: string | null) => void;
  setUseMockData: (useMock: boolean) => void;
  reset: () => void;
  
  // Computed
  getNodesForBranch: (branchId: string) => SimulationNode[];
  getNodeById: (nodeId: string) => SimulationNode | null;
  getBranchById: (branchId: string) => SimulationBranch | null;
  getLatestNode: () => SimulationNode | null;
  getCurrentFacts: () => KnownFacts;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export const useSimulator = () => {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error('useSimulator must be used within SimulatorProvider');
  }
  return context;
};

interface SimulatorProviderProps {
  children: React.ReactNode;
  flowId?: string;  // Optional: if provided, loads flow automatically
  simulationId?: string;  // Optional: if provided, loads existing simulation
  initialSimulationData?: any;  // Optional: simulation data from POST (avoids GET)
  initialChannel?: string;  // Optional: channel for new simulation
  initialLeadState?: string;  // Optional: lead state for new simulation
}

export const SimulatorProvider: React.FC<SimulatorProviderProps> = ({ 
  children, 
  flowId, 
  simulationId: initialSimulationId,
  initialSimulationData,
  initialChannel = 'SMS',
  initialLeadState = 'ANONYMOUS',
}) => {
  console.log('🎬 SimulatorProvider initialized with:', {
    flowId,
    initialSimulationId,
    hasInitialSimulationData: !!initialSimulationData,
    initialSimulationData,
    initialChannel,
    initialLeadState,
  });
  
  const [currentRun, setCurrentRun] = useState<SimulationRun | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [alternateReplyAnchorNodeId, setAlternateReplyAnchorNodeId] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState<boolean>(false); // Use real API by default
  
  // NEW: Real API state
  const [simulationId, setSimulationId] = useState<string | null>(initialSimulationId || null);
  const [flow, setFlow] = useState<ConversationFlow | null>(null);
  const [isLoadingFlow, setIsLoadingFlow] = useState<boolean>(false);
  
  // Load flow when flowId changes
  useEffect(() => {
    if (!flowId) {
      console.log('⚠️ SimulatorProvider: No flowId provided');
      return;
    }
    
    console.log('🔄 SimulatorProvider: Loading flow:', flowId);
    
    const loadFlow = async () => {
      try {
        setIsLoadingFlow(true);
        const response = await flowAPI.getFlow(flowId);
        
        console.log('✅ SimulatorProvider: Flow loaded:', response.flow.name);
        
        if (!response.draft) {
          console.error('❌ SimulatorProvider: No draft available for flow:', flowId);
          return;
        }
        
        console.log('📋 SimulatorProvider: Draft loaded with', response.draft.draftGraph.nodes.length, 'nodes');
        
        // Convert to ConversationFlow format
        const conversationFlow: ConversationFlow = {
          id: response.flow.flowId,
          name: response.flow.name,
          description: response.flow.description,
          industry: response.flow.industry,
          nodes: response.draft.draftGraph.nodes.map((node) => ({
            id: node.id,
            type: node.type as any,
            title: node.title,
            requires: node.requires?.facts || [],
            produces: node.produces?.facts || [],
          })),
          activeGoalLenses: [],
        };
        
        setFlow(conversationFlow);
        console.log('✅ SimulatorProvider: ConversationFlow ready:', conversationFlow.name);
      } catch (error) {
        console.error('❌ SimulatorProvider: Failed to load flow:', error);
      } finally {
        setIsLoadingFlow(false);
      }
    };
    
    loadFlow();
  }, [flowId]);
  
  // Simulation loading is now handled in the main useEffect below
  // Removing this duplicate loading logic

  const stepSimulation = useCallback(async (userMessage: string, explicitParentNodeId?: string) => {
    console.log('💬 stepSimulation called with:', { 
      userMessage,
      explicitParentNodeId,
      hasCurrentRun: !!currentRun, 
      activeBranchId, 
      simulationId,
      useMockData
    });
    
    if (!currentRun) {
      console.error('❌ No active simulation');
      throw new Error('No active simulation');
    }

    // Find the last AGENT node in the current conversation path
    // Walk up from selectedNodeId to find the most recent agent response
    const findLastAgentInPath = (nodes: SimulationNode[], startNodeId: string | null): SimulationNode | null => {
      if (!startNodeId) {
        // No selected node, find the absolute latest agent
        const allAgents = nodes
          .filter(n => n.agentMessage !== undefined)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return allAgents[0] || null;
      }
      
      // Walk up from selected node to find last agent
      let current = nodes.find(n => n.nodeId === startNodeId);
      while (current) {
        if (current.agentMessage !== undefined) {
          return current;
        }
        // Move to parent
        if (current.parentNodeId) {
          current = nodes.find(n => n.nodeId === current!.parentNodeId);
        } else {
          break;
        }
      }
      
      // Fallback: find latest agent overall
      const allAgents = nodes
        .filter(n => n.agentMessage !== undefined)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return allAgents[0] || null;
    };
    
    console.log('🔍 Finding last agent node:', {
      selectedNodeId,
      explicitParentNodeId,
      alternateReplyAnchorNodeId,
      totalNodes: currentRun.nodes.length,
    });
    
    // If explicit parent provided, use that directly
    let latestAgentNode: SimulationNode | null = null;
    if (explicitParentNodeId) {
      latestAgentNode = currentRun.nodes.find(n => n.nodeId === explicitParentNodeId) || null;
      console.log('✅ Using explicit parent node:', {
        nodeId: latestAgentNode?.nodeId,
        message: latestAgentNode?.agentMessage?.substring(0, 50),
      });
    } else {
      latestAgentNode = findLastAgentInPath(currentRun.nodes, selectedNodeId);
      console.log('🎯 Found last agent node via path:', {
        nodeId: latestAgentNode?.nodeId,
        message: latestAgentNode?.agentMessage?.substring(0, 50),
        timestamp: latestAgentNode?.timestamp,
        isSelectedNode: latestAgentNode?.nodeId === selectedNodeId,
      });
    }
    
    // Handle first message - no agent exists yet, use root node
    if (!latestAgentNode) {
      const rootNode = currentRun.nodes.find(n => n.parentNodeId === null);
      if (!rootNode) {
        console.error('❌ No root node found');
        throw new Error('No root node found');
      }
      
      console.log('📍 First message - using root node as parent:', {
        nodeId: rootNode.nodeId,
        explanation: 'No agent nodes exist yet, this is the first user message'
      });
      
      // For the first message, parent is root
      const firstMessageParentId = rootNode.nodeId;
      
      // Continue with API call using root as parent
      if (!flow) {
        console.error('❌ No flow loaded');
        throw new Error('No flow loaded');
      }
      
      // Handle first message - use root node as parent
      const apiFlowNodes = transformFlowNodesForAPI(flow.nodes);
      const patchPayload = {
        userMessage,
        parentNodeId: firstMessageParentId,
        flowNodes: apiFlowNodes,
      };
      
      console.log('📤 PATCH payload (first message):', patchPayload);
      
      try {
        const response = await simulatorAPI.stepSimulation(simulationId!, patchPayload);
        
        console.log('📡 PATCH response:', response);
        console.log('📊 tickSignals from API:', response.tickSignals);
        
        const { userNode, agentNode, tickSignals } = response;
        const turnNumber = 1;
        
        // Convert API response to our SimulationNode format
        const newUserNode: SimulationNode = {
          nodeId: userNode.nodeId,
          parentNodeId: userNode.parentNodeId,
          branchId: null,
          turnNumber,
          userMessage: userNode.content,
          knownFactsBefore: {},
          controllerOutput: {} as any,
          executionResult: {} as any,
          knownFactsAfter: {},
          timestamp: userNode.timestamp,
          contractVersion: '1.0.0',
          designVersionHash: 'pending',
          status: 'VALID',
          // Preserve top-level tickSignals (matching GET response structure)
          tickSignals,
          metadata: {
            tickSignals,
            intentDetection: userNode.intentDetection,
          },
          intentDetection: userNode.intentDetection,
        };
        
        // Build controllerOutput from API response structure (first message)
        const firstMsgControllerOutput = (agentNode as any).metadata?.controllerOutput || {
          intent: { 
            primary: userNode.intentDetection?.primaryIntent || 'provide_information',
            confidence: (response as any).decision?.confidence || (agentNode as any).sim?.decision?.confidence || 0.85 
          },
          affectScalars: { 
            pain: tickSignals.pain / 10, 
            urgency: tickSignals.urgency / 10, 
            vulnerability: tickSignals.vulnerability / 10 
          },
          signals: { 
            hesitation: tickSignals.hesitation > 0,
            objection: tickSignals.objections.length > 0,
            confusion: tickSignals.confusion > 0,
            engagement: tickSignals.engagement 
          },
          progress: { 
            madeProgress: ((response as any).factsCollected?.newFactsThisTurn?.length || 0) > 0,
            stallDetected: (response as any).loopDetection?.isApproachingLoop || false,
            stagnationTurns: (response as any).loopDetection?.turnsOnCurrentNode || 0 
          },
          stepSufficiency: true,
          targetNodeId: (response as any).decision?.targetNodeId || (agentNode as any).sim?.selectedNodeId,
          controlFlags: {
            canAdvance: (response as any).decision?.move === 'ADVANCE',
            needsExplanation: false,
            fastTrackEligible: (response as any).fastTrackStatus !== null,
            humanTakeoverAllowed: false,
            recommendedStep: {
              stepId: (response as any).decision?.targetNodeId || (agentNode as any).sim?.selectedNodeId,
              confidence: (response as any).decision?.confidence || (agentNode as any).sim?.decision?.confidence || 0.85,
            },
            allowedBlabberModes: ['ACK'],
          },
          stepRecommendation: (response as any).decision ? {
            decision: {
              move: (response as any).decision.move,
              targetNodeId: (response as any).decision.targetNodeId,
              confidence: (response as any).decision.confidence,
            },
            rankedCandidates: [],
          } : undefined,
        };
        
        const firstMsgExecutionResult = (agentNode as any).metadata?.executionResult || {
          executionDecision: (response as any).decision?.action || (response as any).decision?.move || 'ADVANCE',
          reasoning: `Selected node: ${(agentNode as any).sim?.selectedNodeId} (confidence: ${(agentNode as any).sim?.decision?.confidence || 0.85})`,
          agentMessage: agentNode.content,
          executionMetadata: {
            blabberModeUsed: (response as any).updatedState?.lastTurnType || 'VALUE_ANCHOR',
            stepSatisfiedThisTurn: ((response as any).progress?.completedSteps?.length || 0) > 0,
            newlyKnownFacts: (response as any).progress?.learnedThisTurn || [],
            readinessDelta: [],
          },
        };
        
        const newAgentNode: SimulationNode = {
          nodeId: agentNode.nodeId,
          parentNodeId: agentNode.parentNodeId,
          branchId: null,
          turnNumber: turnNumber + 1,
          agentMessage: agentNode.content,
          knownFactsBefore: {},
          controllerOutput: firstMsgControllerOutput,
          executionResult: firstMsgExecutionResult,
          knownFactsAfter: {},
          timestamp: agentNode.timestamp,
          contractVersion: '1.0.0',
          designVersionHash: 'pending',
          status: 'VALID',
          // Preserve top-level tickSignals (matching GET response structure)
          tickSignals,
          metadata: {
            tickSignals,
            controllerOutput: firstMsgControllerOutput,
            executionResult: firstMsgExecutionResult,
            sim: (agentNode as any).sim,
            knownFactsBefore: response.factsCollected?.before || [],
            knownFactsAfter: response.factsCollected?.after || [],
            progress: (response as any).progress,
            decision: (response as any).decision,
            loopDetection: (response as any).loopDetection,
          },
        };
        
        const updatedRun = {
          ...currentRun,
          nodes: [...currentRun.nodes, newUserNode, newAgentNode],
          updatedAt: agentNode.timestamp,
        };
        
        setCurrentRun(updatedRun);
        setSelectedNodeId(agentNode.nodeId);
        setAlternateReplyAnchorNodeId(null); // Clear fork mode
        console.log('✅ First message completed successfully');
        return;
      } catch (error) {
        console.error('❌ Failed to send first message:', error);
        throw error;
      }
    }
    
    console.log('📍 Latest agent node in current path:', {
      nodeId: latestAgentNode.nodeId,
      message: (latestAgentNode.agentMessage || '').substring(0, 50),
      timestamp: latestAgentNode.timestamp
    });

    try {
      if (useMockData) {
        // Use mock data - simulate a step
        const mockData = mockSimulatorResponses[currentRun.flowId as keyof typeof mockSimulatorResponses];
        if (mockData && mockData.steps.length > 0) {
          const response = mockData.steps[0];
          
          // Add new node to current run
          const updatedRun = {
            ...currentRun,
            nodes: [...currentRun.nodes, response.node],
            updatedAt: new Date().toISOString(),
          };
          
          setCurrentRun(updatedRun);
          setSelectedNodeId(response.node.nodeId);
          setAlternateReplyAnchorNodeId(null); // Clear fork mode
        } else {
          throw new Error('No mock step data available');
        }
      } else {
        // Call real API - PATCH /agent/simulations/:simulationId
        if (!simulationId) {
          console.error('❌ No simulation ID available');
          throw new Error('No simulation ID available');
        }
        
        if (!flow) {
          console.error('❌ No flow loaded');
          throw new Error('No flow loaded');
        }
        
        const apiFlowNodes = transformFlowNodesForAPI(flow.nodes);
        
        // CRITICAL: When forking (alternateReplyAnchorNodeId is set), we need to use the ANCHOR NODE'S PARENT, not the latest node
        let parentNodeIdForPatch: string;
        
        if (alternateReplyAnchorNodeId) {
          // User is creating an alternate reply to replace the anchor node
          // So the new message should have the SAME parent as the anchor node
          const anchorNode = currentRun.nodes.find(n => n.nodeId === alternateReplyAnchorNodeId);
          if (!anchorNode) {
            console.error('❌ Anchor node not found:', alternateReplyAnchorNodeId);
            throw new Error('Anchor node not found');
          }
          parentNodeIdForPatch = anchorNode.parentNodeId!;
          console.log('🔀 FORKING MODE DETECTED:', {
            anchorNodeId: alternateReplyAnchorNodeId,
            anchorMessage: anchorNode.userMessage,
            anchorParentNodeId: anchorNode.parentNodeId,
            usingParentNodeId: parentNodeIdForPatch,
            explanation: 'Alternate reply will have the SAME parent as the anchor node'
          });
        } else {
          // Normal mode: new USER message responds to the latest AGENT node
          parentNodeIdForPatch = latestAgentNode.nodeId;
          console.log('➡️ NORMAL MODE:', {
            latestAgentNodeId: latestAgentNode.nodeId,
            latestAgentMessage: (latestAgentNode.agentMessage || '').substring(0, 50),
            usingParentNodeId: parentNodeIdForPatch,
            explanation: 'New USER message responds to latest AGENT in current path'
          });
        }
        
        const patchPayload = {
          userMessage,
          parentNodeId: parentNodeIdForPatch,
          flowNodes: apiFlowNodes,
        };
        
        console.log('📡 Calling PATCH /agent/simulations/:id with:', {
          simulationId,
          userMessage,
          parentNodeId: parentNodeIdForPatch,
          flowNodesCount: apiFlowNodes.length,
        });
        console.log('📦 FULL PATCH PAYLOAD:', JSON.stringify(patchPayload, null, 2));
        
        const response = await simulatorAPI.stepSimulation(simulationId, patchPayload);
        
        console.log('📡 PATCH response:', response);
        console.log('📊 tickSignals from API:', response.tickSignals);
        
        const { userNode, agentNode, tickSignals } = response;
        const turnNumber = latestAgentNode.turnNumber + 1;
        
        // Convert API response to our SimulationNode format
        const newUserNode: SimulationNode = {
          nodeId: userNode.nodeId,
          parentNodeId: userNode.parentNodeId,
          branchId: null, // No longer using branchId - rely on parentNodeId
          turnNumber,
          userMessage: userNode.content,
          knownFactsBefore: {},
          controllerOutput: {
            intent: { primary: userNode.intentDetection.primaryIntent, confidence: 0.85 },
            affectScalars: { 
              pain: tickSignals.pain / 10, 
              urgency: tickSignals.urgency / 10, 
              vulnerability: tickSignals.vulnerability / 10 
            },
            signals: {
              hesitation: tickSignals.hesitation > 0,
              objection: tickSignals.objections.length > 0,
              confusion: tickSignals.confusion > 0,
              engagement: tickSignals.engagement,
            },
            progress: { madeProgress: true, stallDetected: false, stagnationTurns: 0 },
            stepSufficiency: false,
            controlFlags: {
              canAdvance: true,
              needsExplanation: false,
              fastTrackEligible: false,
              humanTakeoverAllowed: false,
              allowedBlabberModes: ['ACK'],
            },
          },
          executionResult: {
            executionDecision: 'ADVANCE',
            reasoning: 'User message received',
            executionMetadata: {
              blabberModeUsed: 'ACK',
              stepSatisfiedThisTurn: false,
              newlyKnownFacts: [],
              readinessDelta: [],
            },
          },
          knownFactsAfter: {},
          timestamp: userNode.timestamp,
          contractVersion: '1.0.0',
          designVersionHash: 'pending',
          status: 'VALID',
          // Preserve top-level tickSignals (matching GET response structure)
          tickSignals,
          // Store tickSignals in metadata for ReadinessPanel
          metadata: {
            tickSignals,
            intentDetection: userNode.intentDetection,
          },
          intentDetection: userNode.intentDetection,
        };
        
        // Build controllerOutput from API response structure
        const controllerOutput = agentNode.metadata?.controllerOutput || {
          intent: { 
            primary: userNode.intentDetection?.primaryIntent || 'provide_information',
            confidence: response.decision?.confidence || agentNode.sim.decision.confidence 
          },
          affectScalars: { 
            pain: tickSignals.pain / 10, 
            urgency: tickSignals.urgency / 10, 
            vulnerability: tickSignals.vulnerability / 10 
          },
          signals: { 
            hesitation: tickSignals.hesitation > 0,
            objection: tickSignals.objections.length > 0,
            confusion: tickSignals.confusion > 0,
            engagement: tickSignals.engagement 
          },
          progress: { 
            madeProgress: (response.factsCollected?.newFactsThisTurn?.length || 0) > 0,
            stallDetected: response.loopDetection?.isApproachingLoop || false,
            stagnationTurns: response.loopDetection?.turnsOnCurrentNode || 0 
          },
          stepSufficiency: true,
          targetNodeId: response.decision?.targetNodeId || agentNode.sim.selectedNodeId,
          controlFlags: {
            canAdvance: response.decision?.move === 'ADVANCE',
            needsExplanation: false,
            fastTrackEligible: response.fastTrackStatus !== null,
            humanTakeoverAllowed: false,
            recommendedStep: {
              stepId: response.decision?.targetNodeId || agentNode.sim.selectedNodeId,
              confidence: response.decision?.confidence || agentNode.sim.decision.confidence,
            },
            allowedBlabberModes: ['ACK'],
          },
          stepRecommendation: response.decision ? {
            decision: {
              move: response.decision.move,
              targetNodeId: response.decision.targetNodeId,
              confidence: response.decision.confidence,
            },
            rankedCandidates: [], // Not provided in new API
          } : undefined,
        };
        
        const executionResult = agentNode.metadata?.executionResult || {
          executionDecision: response.decision?.action || response.decision?.move || 'ADVANCE',
          reasoning: `Selected node: ${agentNode.sim.selectedNodeId} (confidence: ${agentNode.sim.decision.confidence})`,
          agentMessage: agentNode.content,
          executionMetadata: {
            blabberModeUsed: response.updatedState?.lastTurnType || 'VALUE_ANCHOR',
            stepSatisfiedThisTurn: (response.progress?.completedSteps?.length || 0) > 0,
            newlyKnownFacts: response.progress?.learnedThisTurn || [],
            readinessDelta: [],
          },
        };
        
        const newAgentNode: SimulationNode = {
          nodeId: agentNode.nodeId,
          parentNodeId: agentNode.parentNodeId,
          branchId: null, // No longer using branchId - rely on parentNodeId
          turnNumber: turnNumber + 1,
          agentMessage: agentNode.content,
          knownFactsBefore: {},
          controllerOutput,
          executionResult,
          knownFactsAfter: {},
          timestamp: agentNode.timestamp,
          contractVersion: '1.0.0',
          designVersionHash: 'pending',
          status: 'VALID',
          // Preserve top-level tickSignals (matching GET response structure)
          tickSignals,
          // Store all metadata from API response including tickSignals, controllerOutput, executionResult, sim, progress, decision
          metadata: {
            tickSignals,
            controllerOutput,
            executionResult,
            sim: agentNode.sim,
            knownFactsBefore: response.factsCollected?.before || [],
            knownFactsAfter: response.factsCollected?.after || [],
            progress: response.progress,
            decision: response.decision,
            loopDetection: response.loopDetection,
          },
        };
        
        // Add both user and agent nodes to run
        const updatedRun = {
          ...currentRun,
          nodes: [...currentRun.nodes, newUserNode, newAgentNode],
          updatedAt: agentNode.timestamp,
        };
        
        console.log('✅ Updating run with new nodes:', {
          totalNodes: updatedRun.nodes.length,
          newUserNodeId: newUserNode.nodeId,
          newUserNodeParentId: newUserNode.parentNodeId,
          newAgentNodeId: newAgentNode.nodeId,
          newAgentNodeParentId: newAgentNode.parentNodeId,
        });
        
        // DEBUG: Check for fork detection
        const parentNode = updatedRun.nodes.find(n => n.nodeId === newUserNode.parentNodeId);
        if (parentNode) {
          const siblings = updatedRun.nodes.filter(n => n.parentNodeId === parentNode.nodeId);
          if (siblings.length > 1) {
            console.log('🔀 FORK DETECTED! Parent node has multiple children:', {
              parentNodeId: parentNode.nodeId,
              parentMessage: (parentNode.agentMessage || parentNode.userMessage || '').substring(0, 50),
              siblingCount: siblings.length,
              siblings: siblings.map(s => ({
                nodeId: s.nodeId,
                type: s.userMessage ? 'USER' : 'AGENT',
                message: (s.userMessage || s.agentMessage || '').substring(0, 50),
              })),
            });
          }
        }
        
        setCurrentRun(updatedRun);
        
        // CRITICAL: Select the new agent node so user can see the response details
        console.log('🎯 Selecting new agent node:', agentNode.nodeId);
        console.log('🎯 Previous selectedNodeId:', selectedNodeId);
        setSelectedNodeId(agentNode.nodeId);
        console.log('🎯 After setSelectedNodeId called for:', agentNode.nodeId);
        
        setAlternateReplyAnchorNodeId(null); // Clear fork mode after successful message
        
        console.log('✅ stepSimulation completed successfully, agent node selected:', agentNode.nodeId);
        
        // Log gap detection if present
        if (agentNode.sim.gapRecommendation) {
          console.warn('⚠️ Gap detected:', agentNode.sim.gapRecommendation);
        }
      }
    } catch (error) {
      console.error('❌ stepSimulation failed:', error);
      throw error;
    }
  }, [currentRun, activeBranchId, useMockData, simulationId, flow, alternateReplyAnchorNodeId]);

  const forkSimulation = useCallback(async (nodeId: string, branchLabel: string) => {
    if (!currentRun) {
      throw new Error('No active simulation');
    }

    try {
      let newBranch: SimulationBranch;
      let replayedNodes: SimulationNode[] = [];

      if (useMockData) {
        // Mock fork
        newBranch = {
          branchId: generateUUID(),
          parentBranchId: activeBranchId,
          forkFromNodeId: nodeId,
          label: branchLabel,
          createdAt: new Date().toISOString(),
        };
      } else {
        // Real API doesn't support forking yet - fallback to mock behavior
        console.warn('🚧 Fork simulation not yet supported by real API - using mock behavior');
        newBranch = {
          branchId: generateUUID(),
          parentBranchId: activeBranchId,
          forkFromNodeId: nodeId,
          label: branchLabel,
          createdAt: new Date().toISOString(),
        };
      }

      const updatedRun = {
        ...currentRun,
        branches: [...currentRun.branches, newBranch],
        nodes: [...currentRun.nodes, ...replayedNodes],
        updatedAt: new Date().toISOString(),
      };

      setCurrentRun(updatedRun);
      setActiveBranchId(newBranch.branchId);
      setSelectedNodeId(nodeId);
    } catch (error) {
      console.error('Failed to fork simulation:', error);
      throw error;
    }
  }, [currentRun, activeBranchId, useMockData]);

  const selectNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const selectBranch = useCallback((branchId: string) => {
    setActiveBranchId(branchId);
  }, []);

  const reset = useCallback(() => {
    setCurrentRun(null);
    setActiveBranchId(null);
    setSelectedNodeId(null);
    setAlternateReplyAnchorNodeId(null);
    setSimulationId(null);
    // Don't clear flow - it persists across simulations
  }, []);

  // Computed helpers
  const getNodesForBranch = useCallback((branchId: string): SimulationNode[] => {
    if (!currentRun) return [];
    return currentRun.nodes
      .filter((n) => n.branchId === branchId)
      .sort((a, b) => a.turnNumber - b.turnNumber);
  }, [currentRun]);

  const getNodeById = useCallback((nodeId: string): SimulationNode | null => {
    if (!currentRun) return null;
    return currentRun.nodes.find((n) => n.nodeId === nodeId) || null;
  }, [currentRun]);

  const getBranchById = useCallback((branchId: string): SimulationBranch | null => {
    if (!currentRun) return null;
    return currentRun.branches.find((b) => b.branchId === branchId) || null;
  }, [currentRun]);

  const getLatestNode = useCallback((): SimulationNode | null => {
    if (!currentRun) return null;
    
    // If a node is selected, return that node
    if (selectedNodeId) {
      return currentRun.nodes.find(n => n.nodeId === selectedNodeId) || null;
    }
    
    // Otherwise, return the absolute latest node by timestamp
    const sortedNodes = [...currentRun.nodes].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sortedNodes[0] || null;
  }, [currentRun, selectedNodeId]);

  const getCurrentFacts = useCallback((): KnownFacts => {
    const latestNode = getLatestNode();
    return latestNode?.knownFactsAfter || {};
  }, [getLatestNode]);

  const setAlternateReplyAnchor = useCallback((nodeId: string | null) => {
    setAlternateReplyAnchorNodeId(nodeId);
    // When setting an anchor, also select that node
    if (nodeId) {
      setSelectedNodeId(nodeId);
    }
  }, []);
  
  // Initialize simulation (either from passed data or by loading from API)
  useEffect(() => {
    console.log('🔍 useEffect triggered:', { 
      initialSimulationId, 
      hasInitialSimulationData: !!initialSimulationData,
      hasFlow: !!flow, 
      hasCurrentRun: !!currentRun,
      currentRunId: currentRun?.runId
    });
    
    // Skip if no ID, new simulation, or no flow
    if (!initialSimulationId || initialSimulationId === 'new' || !flow) {
      console.log('⏭️ Skipping initialization:', {
        noId: !initialSimulationId,
        isNew: initialSimulationId === 'new',
        noFlow: !flow
      });
      return;
    }
    
    // Skip if we already loaded this exact simulation
    if (currentRun && currentRun.runId === initialSimulationId) {
      console.log('⏭️ Skipping initialization: Already loaded this simulation');
      return;
    }
    
    // SIMPLIFIED: Don't use initialSimulationData at all - just always load from API
    // This avoids issues with cached browser state
    console.log('🔄 Loading simulation from API (ignoring any cached state)');
    
    // Go directly to API load (dead code removed)
    
    // Otherwise, load from API (for existing simulations opened from list)
    console.log('🔄 Loading existing simulation from API:', initialSimulationId);
    
    const loadExistingSimulation = async () => {
      try {
        const response = await simulatorAPI.getSimulation(initialSimulationId);
        
        if (!response.simulationId) {
          throw new Error('Failed to load simulation');
        }
        
        console.log('✅ Simulation loaded from API:', response);
        console.log('📊 API nodes count:', response.nodes?.length);
        console.log('📊 API nodes:', response.nodes);
        
        // Debug: Check what's in the first agent node from API
        const firstAgentNode = response.nodes?.find((n: any) => n.type === 'agent');
        if (firstAgentNode) {
          console.log('🔍 First agent node from API:', firstAgentNode);
          console.log('🔍 Agent node metadata:', firstAgentNode.metadata);
          console.log('🔍 Does it have tickSignals?', firstAgentNode.metadata?.tickSignals);
        }
        
        // Convert API response to SimulationRun format
        // For now, create an empty run structure - we'll build it from API data
        const scenario: ScenarioContext = {
          channel: (response.metadata?.channel || 'SMS') as any,
          leadState: (response.leadState || 'ANONYMOUS') as any,
          resumable: false,
        };
        
        const mainBranch: SimulationBranch = {
          branchId: 'branch-main',
          parentBranchId: null,
          forkFromNodeId: null,
          label: 'Main',
          createdAt: response.createdAt,
        };
        
        // Get conversation tree nodes from API
        const apiNodes = response.nodes || [];
        
        // Convert API nodes to SimulationNode format
        const simulationNodes: SimulationNode[] = apiNodes.map((node: any, index: number) => {
          console.log(`🔄 Converting node ${index}:`, {
            nodeId: node.nodeId,
            type: node.type,
            hasMetadata: !!node.metadata,
            hasTopLevelTickSignals: !!node.tickSignals,
            tickSignals: node.tickSignals,
            metadata: node.metadata,
            metadataKeys: node.metadata ? Object.keys(node.metadata) : []
          });
          
          return {
            nodeId: node.nodeId,
            parentNodeId: node.parentNodeId,
            branchId: 'branch-main',
            turnNumber: index,
            userMessage: node.type === 'user' ? node.content : undefined,
            agentMessage: node.type === 'agent' ? node.content : undefined,
            knownFactsBefore: {},
            controllerOutput: node.metadata?.controllerOutput || {
              intent: { primary: 'ENGAGE', confidence: 0.9 },
              affectScalars: { pain: 0, urgency: 0, vulnerability: 0 },
              signals: { hesitation: false, objection: false, confusion: false, engagement: 7 },
              progress: { madeProgress: true, stallDetected: false, stagnationTurns: 0 },
              stepSufficiency: false,
              controlFlags: {
                canAdvance: true,
                needsExplanation: false,
                fastTrackEligible: false,
                humanTakeoverAllowed: false,
                allowedBlabberModes: ['ACK'],
              },
            },
            executionResult: node.metadata?.executionResult || {
              executionDecision: 'ADVANCE',
              reasoning: 'Loaded from API',
              executionMetadata: {
                blabberModeUsed: 'ACK',
                stepSatisfiedThisTurn: true,
                newlyKnownFacts: [],
                readinessDelta: [],
              },
            },
            knownFactsAfter: {},
            timestamp: node.timestamp,
            contractVersion: '1.0.0',
            designVersionHash: 'pending',
            status: 'VALID',
            // Preserve all metadata from API including tickSignals, controllerOutput, executionResult, sim
            metadata: node.metadata,
            intentDetection: node.metadata?.intentDetection,
            // Preserve top-level tickSignals from GET responses (they're duplicated here from user nodes)
            tickSignals: node.tickSignals,
            // Preserve timing and progress info from GET responses
            timing: node.timing,
            progress: node.progress,
          };
        });
        
        const run: SimulationRun = {
          runId: initialSimulationId,
          flowId: flow.id,
          flowName: flow.name,
          scenarioContext: scenario,
          branches: [mainBranch],
          nodes: simulationNodes,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
        };
        
        console.log('📋 Converted simulation nodes:', simulationNodes);
        console.log('📋 Simulation nodes count:', simulationNodes.length);
        
        setSimulationId(initialSimulationId);
        setCurrentRun(run);
        setActiveBranchId('branch-main');
        
        // Select the last AGENT node (so user can see the response details immediately)
        if (simulationNodes.length > 0) {
          // Find the last agent node in the array
          const lastAgentNode = [...simulationNodes].reverse().find(n => n.agentMessage !== undefined);
          const lastNodeId = lastAgentNode ? lastAgentNode.nodeId : simulationNodes[simulationNodes.length - 1].nodeId;
          
          console.log('🎯 Selecting last node for initial load:', {
            totalNodes: simulationNodes.length,
            lastNodeId,
            lastNodeIndex: simulationNodes.findIndex(n => n.nodeId === lastNodeId),
            isAgentNode: !!lastAgentNode,
            actualLastNodeInArray: simulationNodes[simulationNodes.length - 1].nodeId,
          });
          
          setSelectedNodeId(lastNodeId);
        }
        
        console.log('✅ Simulation loaded into context:', { 
          nodes: simulationNodes.length,
          simulationId: initialSimulationId,
          runId: run.runId,
          flowId: run.flowId
        });
      } catch (error) {
        console.error('❌ Failed to load existing simulation:', error);
      }
    };
    
    loadExistingSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSimulationId, flow, initialSimulationData]);
  
  // NEW: Create empty simulation (POST /agent/simulations)
  const createEmptySimulation = useCallback(async (scenario: ScenarioContext) => {
    console.log('🚀 createEmptySimulation called with scenario:', scenario);
    
    try {
      setAlternateReplyAnchorNodeId(null);
      
      if (!flow) {
        console.error('❌ No flow loaded in createEmptySimulation');
        throw new Error('No flow loaded');
      }
      
      const currentFlowId = flow.id;
      const currentFlowName = flow.name;
      
      console.log('📡 Calling POST /agent/simulations with:', {
        name: `${currentFlowName} - ${scenario.leadState} User`,
        flowId: currentFlowId,
        leadState: scenario.leadState,
      });
      
      // Call POST /agent/simulations to create empty simulation
      // Note: personaId should be passed from the UI, but for now using a placeholder
      const createResponse = await simulatorAPI.startSimulation({
        name: `${currentFlowName} - ${scenario.leadState} User`,
        flowId: currentFlowId,
        leadState: scenario.leadState,
        personaId: 'default-persona', // TODO: Pass from UI
      });
      
      console.log('📡 POST response:', createResponse);
      
      const simId = createResponse.simulationId;
      const rootId = createResponse.rootNodeId;
      
      console.log('✅ Empty simulation created:', { simId, rootId });
      
      setSimulationId(simId);
      
      // Create initial SimulationRun structure with empty root
      const mainBranch: SimulationBranch = {
        branchId: 'branch-main',
        parentBranchId: null,
        forkFromNodeId: null,
        label: 'Main',
        createdAt: createResponse.createdAt,
      };
      
      const rootNode: SimulationNode = {
        nodeId: rootId,
        parentNodeId: null,
        branchId: 'branch-main',
        turnNumber: 0,
        knownFactsBefore: {},
        controllerOutput: {
          intent: { primary: 'ENGAGE', confidence: 1.0 },
          affectScalars: { pain: 0, urgency: 0, vulnerability: 0 },
          signals: { hesitation: false, objection: false, confusion: false, engagement: 0 },
          progress: { madeProgress: false, stallDetected: false, stagnationTurns: 0 },
          stepSufficiency: false,
          controlFlags: {
            canAdvance: true,
            needsExplanation: false,
            fastTrackEligible: false,
            humanTakeoverAllowed: false,
            allowedBlabberModes: [],
          },
        },
        executionResult: {
          executionDecision: 'STALL',
          reasoning: 'Root node - awaiting user message',
          executionMetadata: {
            blabberModeUsed: 'ACK',
            stepSatisfiedThisTurn: true,
            newlyKnownFacts: [],
            readinessDelta: [],
          },
        },
        knownFactsAfter: {},
        timestamp: createResponse.createdAt,
        contractVersion: '1.0.0',
        designVersionHash: 'pending',
        status: 'VALID',
      };
      
      const run: SimulationRun = {
        runId: simId,
        flowId: currentFlowId,
        flowName: currentFlowName,
        scenarioContext: scenario,
        branches: [mainBranch],
        nodes: [rootNode],
        createdAt: createResponse.createdAt,
        updatedAt: createResponse.createdAt,
      };
      
      setCurrentRun(run);
      setActiveBranchId('branch-main');
      setSelectedNodeId(rootId);
      
      console.log('✅ Empty simulation ready for user input');
    } catch (error) {
      console.error('Failed to create empty simulation:', error);
      throw error;
    }
  }, [flow]);

  const value: SimulatorContextType = {
    currentRun,
    activeBranchId,
    selectedNodeId,
    alternateReplyAnchorNodeId,
    useMockData,
    simulationId,
    flow,
    isLoadingFlow,
    createEmptySimulation,
    stepSimulation,
    forkSimulation,
    selectNode,
    selectBranch,
    setAlternateReplyAnchor,
    setUseMockData,
    reset,
    getNodesForBranch,
    getNodeById,
    getBranchById,
    getLatestNode,
    getCurrentFacts,
  };

  return (
    <SimulatorContext.Provider value={value}>
      {children}
    </SimulatorContext.Provider>
  );
};
