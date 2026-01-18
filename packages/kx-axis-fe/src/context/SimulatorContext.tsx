/**
 * Simulator Context - State management for Execution Mode
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type {
  SimulationRun,
  SimulationNode,
  SimulationBranch,
  ScenarioContext,
  KnownFacts,
} from '../types/simulator';
import { simulatorAPI } from '../api/simulatorClient';
import { mockSimulatorResponses } from '../fixtures/simulatorFixtures';

interface SimulatorContextType {
  // Current state
  currentRun: SimulationRun | null;
  activeBranchId: string | null;
  selectedNodeId: string | null;
  alternateReplyAnchorNodeId: string | null; // CRITICAL: Tracks which user message we're creating an alternate reply from
  useMockData: boolean;
  
  // Actions
  startSimulation: (flowId: string, scenario: ScenarioContext, initialFacts?: Partial<KnownFacts>) => Promise<void>;
  stepSimulation: (userMessage: string) => Promise<void>;
  forkSimulation: (nodeId: string, branchLabel: string) => Promise<void>;
  selectNode: (nodeId: string) => void;
  selectBranch: (branchId: string) => void;
  setAlternateReplyAnchor: (nodeId: string | null) => void; // NEW: Enter/exit alternate reply mode
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
}

export const SimulatorProvider: React.FC<SimulatorProviderProps> = ({ children }) => {
  const [currentRun, setCurrentRun] = useState<SimulationRun | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Clicking a user message icon selects a divergence anchor.
  // A branch is created only when a different reply is submitted.
  const [alternateReplyAnchorNodeId, setAlternateReplyAnchorNodeId] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState<boolean>(true); // Default to mock for demo

  const startSimulation = useCallback(async (
    flowId: string,
    scenario: ScenarioContext,
    initialFacts?: Partial<KnownFacts>
  ) => {
    try {
      // Clear alternate reply mode when starting new simulation
      setAlternateReplyAnchorNodeId(null);
      
      let response;
      
      if (useMockData) {
        // Use mock data
        const mockData = mockSimulatorResponses[flowId as keyof typeof mockSimulatorResponses];
        if (!mockData) {
          throw new Error(`No mock data for flow: ${flowId}`);
        }
        response = mockData.start;
      } else {
        // Call real API
        response = await simulatorAPI.startSimulation({
          flowId,
          scenarioContext: scenario,
          initialFacts,
        });
      }
      
      setCurrentRun(response.run);
      setActiveBranchId(response.run.branches[0].branchId);
      if (response.run.nodes.length > 0) {
        setSelectedNodeId(response.run.nodes[response.run.nodes.length - 1].nodeId);
      }
    } catch (error) {
      console.error('Failed to start simulation:', error);
      throw error;
    }
  }, [useMockData]);

  const stepSimulation = useCallback(async (userMessage: string) => {
    if (!currentRun || !activeBranchId) {
      throw new Error('No active simulation');
    }

    const latestNode = currentRun.nodes
      .filter((n) => n.branchId === activeBranchId)
      .sort((a, b) => b.turnNumber - a.turnNumber)[0];

    try {
      let response;
      
      if (useMockData) {
        // Use mock data - simulate a step
        const mockData = mockSimulatorResponses[currentRun.flowId as keyof typeof mockSimulatorResponses];
        if (mockData && mockData.steps.length > 0) {
          response = mockData.steps[0];
        } else {
          throw new Error('No mock step data available');
        }
      } else {
        // Call real API
        response = await simulatorAPI.stepSimulation({
          runId: currentRun.runId,
          branchId: activeBranchId,
          parentNodeId: latestNode.nodeId,
          userMessage,
        });
      }

      // Add new node to current run
      const updatedRun = {
        ...currentRun,
        nodes: [...currentRun.nodes, response.node],
        updatedAt: new Date().toISOString(),
      };
      
      setCurrentRun(updatedRun);
      setSelectedNodeId(response.node.nodeId);
    } catch (error) {
      console.error('Failed to step simulation:', error);
      throw error;
    }
  }, [currentRun, activeBranchId, useMockData]);

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
          branchId: `branch-${Date.now()}`,
          parentBranchId: activeBranchId,
          forkFromNodeId: nodeId,
          label: branchLabel,
          createdAt: new Date().toISOString(),
        };
      } else {
        // Call real API
        const response = await simulatorAPI.forkSimulation({
          runId: currentRun.runId,
          forkFromNodeId: nodeId,
          newBranchLabel: branchLabel,
        });
        newBranch = response.branch;
        replayedNodes = response.replayedHistory;
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
    setAlternateReplyAnchorNodeId(null); // Clear alternate reply mode
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
    if (!currentRun || !activeBranchId) return null;
    const branchNodes = getNodesForBranch(activeBranchId);
    return branchNodes[branchNodes.length - 1] || null;
  }, [currentRun, activeBranchId, getNodesForBranch]);

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

  const value: SimulatorContextType = {
    currentRun,
    activeBranchId,
    selectedNodeId,
    alternateReplyAnchorNodeId,
    useMockData,
    startSimulation,
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

