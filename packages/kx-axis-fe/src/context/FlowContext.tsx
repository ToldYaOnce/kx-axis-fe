import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type {
  ConversationFlow,
  FlowNode,
  ActiveGoalLens,
  Selection,
  GoalLensRegistry,
} from '../types';

interface FlowContextValue {
  flow: ConversationFlow;
  registry: GoalLensRegistry;
  selection: Selection;
  updateFlow: (updates: Partial<ConversationFlow>) => void;
  updateNode: (nodeId: string, updates: Partial<FlowNode>) => void;
  addNode: (node: FlowNode) => void;
  removeNode: (nodeId: string) => void;
  updateGoalLens: (lensId: string, updates: Partial<ActiveGoalLens>) => void;
  addGoalLens: (lens: ActiveGoalLens) => void;
  removeGoalLens: (lensId: string) => void;
  setSelection: (selection: Selection) => void;
  onChange?: (flow: ConversationFlow) => void;
}

const FlowContext = createContext<FlowContextValue | undefined>(undefined);

interface FlowProviderProps {
  children: ReactNode;
  initialFlow: ConversationFlow;
  registry: GoalLensRegistry;
  onChange?: (flow: ConversationFlow) => void;
}

export const FlowProvider: React.FC<FlowProviderProps> = ({
  children,
  initialFlow,
  registry,
  onChange,
}) => {
  const [flow, setFlow] = useState<ConversationFlow>(initialFlow);
  const [selection, setSelection] = useState<Selection>({ type: 'overview' });
  const lastSyncedFlowId = useRef<string>(initialFlow.id);

  // Sync flow state when initialFlow changes from external source (e.g., loaded from API)
  useEffect(() => {
    // Check if this is a new flow being loaded or initial flow with nodes
    const isDifferentFlow = initialFlow.id !== lastSyncedFlowId.current;
    const hasNodes = initialFlow.nodes.length > 0;
    
    if (isDifferentFlow && hasNodes) {
      console.log('🔄 Syncing flow state with loaded flow:', {
        flowId: initialFlow.id,
        nodeCount: initialFlow.nodes.length,
      });
      setFlow(initialFlow);
      lastSyncedFlowId.current = initialFlow.id;
    }
  }, [initialFlow]);

  const notifyChange = useCallback(
    (updatedFlow: ConversationFlow) => {
      onChange?.(updatedFlow);
    },
    [onChange]
  );

  const updateFlow = useCallback(
    (updates: Partial<ConversationFlow>) => {
      setFlow((prev) => {
        const updated = { ...prev, ...updates };
        notifyChange(updated);
        return updated;
      });
    },
    [notifyChange]
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<FlowNode>) => {
      setFlow((prev) => {
        const updated = {
          ...prev,
          nodes: prev.nodes.map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node
          ),
        };
        notifyChange(updated);
        return updated;
      });
    },
    [notifyChange]
  );

  const addNode = useCallback(
    (node: FlowNode) => {
      setFlow((prev) => {
        const updated = {
          ...prev,
          nodes: [...prev.nodes, node],
        };
        notifyChange(updated);
        return updated;
      });
    },
    [notifyChange]
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      setFlow((prev) => {
        const updated = {
          ...prev,
          nodes: prev.nodes.filter((node) => node.id !== nodeId),
        };
        notifyChange(updated);
        return updated;
      });
    },
    [notifyChange]
  );

  const updateGoalLens = useCallback(
    (lensId: string, updates: Partial<ActiveGoalLens>) => {
      setFlow((prev) => {
        const updated = {
          ...prev,
          activeGoalLenses: prev.activeGoalLenses.map((lens) =>
            lens.lensId === lensId ? { ...lens, ...updates } : lens
          ),
        };
        notifyChange(updated);
        return updated;
      });
    },
    [notifyChange]
  );

  const addGoalLens = useCallback(
    (lens: ActiveGoalLens) => {
      setFlow((prev) => {
        const updated = {
          ...prev,
          activeGoalLenses: [...prev.activeGoalLenses, lens],
        };
        notifyChange(updated);
        return updated;
      });
    },
    [notifyChange]
  );

  const removeGoalLens = useCallback(
    (lensId: string) => {
      setFlow((prev) => {
        const updated = {
          ...prev,
          activeGoalLenses: prev.activeGoalLenses.filter((lens) => lens.lensId !== lensId),
        };
        notifyChange(updated);
        return updated;
      });
    },
    [notifyChange]
  );

  const value: FlowContextValue = {
    flow,
    registry,
    selection,
    updateFlow,
    updateNode,
    addNode,
    removeNode,
    updateGoalLens,
    addGoalLens,
    removeGoalLens,
    setSelection,
    onChange,
  };

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
};

export const useFlow = (): FlowContextValue => {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within FlowProvider');
  }
  return context;
};

