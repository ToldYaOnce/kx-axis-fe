/**
 * useDraftSave - Save draft with debounce and optimistic UI
 * 
 * Tracks sourceHash for optimistic concurrency control
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { flowAPI } from '../api/flowClient';
import type { DraftGraph, UiLayout, FlowApiError } from '../types/flow-api';

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export interface UseDraftSaveResult {
  saveDraft: (draftGraph: DraftGraph, uiLayout?: UiLayout, updatedBy?: string) => Promise<void>;
  saveStatus: SaveStatus;
  saveError: FlowApiError | null;
  lastSavedAt: Date | null;
  currentSourceHash: string | null;  // Track current sourceHash
}

export interface UseDraftSaveOptions {
  flowId: string | null;
  autosaveDelay?: number;  // ms, default 1000
  onSaveSuccess?: (sourceHash: string) => void;
  onSaveError?: (error: FlowApiError) => void;
}

export function useDraftSave(options: UseDraftSaveOptions): UseDraftSaveResult {
  const { flowId, autosaveDelay = 1000, onSaveSuccess, onSaveError } = options;

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<FlowApiError | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [currentSourceHash, setCurrentSourceHash] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveQueueRef = useRef<{ draftGraph: DraftGraph; uiLayout?: UiLayout; updatedBy?: string } | null>(null);
  const isSavingRef = useRef<boolean>(false);

  /**
   * Perform the actual save
   */
  const performSave = useCallback(
    async (draftGraph: DraftGraph, uiLayout?: UiLayout, updatedBy?: string) => {
      if (!flowId) return;

      // Avoid overlapping saves
      if (isSavingRef.current) {
        // Queue this save for after current one completes
        saveQueueRef.current = { draftGraph, uiLayout, updatedBy };
        setSaveStatus('pending');
        return;
      }

      isSavingRef.current = true;
      setSaveStatus('saving');
      setSaveError(null);

      try {
        const response = await flowAPI.replaceDraft(flowId, { 
          draftGraph, 
          uiLayout,
          updatedBy,
        });
        
        // Update sourceHash from response
        setCurrentSourceHash(response.sourceHash);
        
        setSaveStatus('saved');
        setLastSavedAt(new Date(response.updatedAt));
        onSaveSuccess?.(response.sourceHash);

        // If there's a queued save, execute it now
        if (saveQueueRef.current) {
          const queued = saveQueueRef.current;
          saveQueueRef.current = null;
          isSavingRef.current = false;
          // Use setTimeout to avoid deep recursion
          setTimeout(() => performSave(queued.draftGraph, queued.uiLayout, queued.updatedBy), 0);
        } else {
          isSavingRef.current = false;
        }
      } catch (err) {
        const error = err as FlowApiError;
        setSaveStatus('error');
        setSaveError(error);
        onSaveError?.(error);
        isSavingRef.current = false;
      }
    },
    [flowId, onSaveSuccess, onSaveError]
  );

  /**
   * Manual save (immediate, no debounce)
   */
  const saveDraft = useCallback(
    async (draftGraph: DraftGraph, uiLayout?: UiLayout, updatedBy?: string) => {
      // Clear debounce timer if exists
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      await performSave(draftGraph, uiLayout, updatedBy);
    },
    [performSave]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    saveDraft,
    saveStatus,
    saveError,
    lastSavedAt,
    currentSourceHash,
  };
}
