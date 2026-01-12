/**
 * Playback - Turn-by-turn conversation display with inspector on hover
 * 
 * CORE INVARIANT:
 * Branches exist because the user said something different.
 * The agent merely responded.
 * 
 * Visual Rules:
 * - 👤 User messages (blue, right) = BRANCH POINTS (marked with fork icon in dotted circle)
 * - 🤖 Agent messages (gray, left) = READ-ONLY OUTCOMES (no fork affordance)
 * - Composer behavior reflects selection:
 *   - User turn selected → "Alternate Reply"
 *   - Agent turn selected → Composer disabled
 *   - Leaf turn selected → "Send"
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import { useSimulator } from '../../context/SimulatorContext';
import type { SimulationNode } from '../../types/simulator';

interface TurnCardProps {
  node: SimulationNode;
  isSelected: boolean;
  isAlternateReplyAnchor: boolean; // NEW: Is this the anchor for creating an alternate reply?
  isInAlternateReplyMode: boolean; // NEW: Is ANY anchor set (used to dim other messages)?
  onClick: () => void;
  onSetAlternateReplyAnchor?: () => void; // NEW: Handler for fork icon click
}

const TurnCard: React.FC<TurnCardProps> = ({ node, isSelected, isAlternateReplyAnchor, isInAlternateReplyMode, onClick, onSetAlternateReplyAnchor }) => {
  const [showForkIcon, setShowForkIcon] = useState(false);

  return (
    <Box sx={{ mb: 2 }}>

      {/* User Message Bubble (left-aligned, blue) */}
      {node.userMessage && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 0.5 }}>
          <Paper
            onClick={onClick}
            onMouseEnter={() => setShowForkIcon(true)}
            onMouseLeave={() => setShowForkIcon(false)}
            sx={{
              maxWidth: '70%',
              p: 2,
              bgcolor: isAlternateReplyAnchor ? '#1565c0' : '#1976d2',
              color: 'white',
              borderRadius: '4px 16px 16px 16px',
              cursor: 'pointer',
              boxShadow: isAlternateReplyAnchor 
                ? '0 0 12px 3px rgba(255, 215, 0, 0.6)'
                : '0 1px 3px rgba(0,0,0,0.1)',
              border: isAlternateReplyAnchor 
                ? '2px solid #FFD700'
                : isSelected 
                  ? '2px solid #1976d2' 
                  : '1px solid transparent',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              opacity: isAlternateReplyAnchor ? 1 : (isInAlternateReplyMode ? 0.4 : 1),
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: isAlternateReplyAnchor 
                  ? '0 0 16px 4px rgba(255, 215, 0, 0.7)'
                  : '0 2px 8px rgba(0,0,0,0.15)',
              },
            }}
          >
            <Typography variant="body1" sx={{ flex: 1, whiteSpace: 'pre-wrap' }}>
              {node.userMessage}
            </Typography>
            
            {/* Fork icon (only on hover) */}
            {(showForkIcon || isAlternateReplyAnchor) && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSetAlternateReplyAnchor) {
                    onSetAlternateReplyAnchor();
                  }
                }}
                sx={{
                  flexShrink: 0,
                  p: 0.5,
                  color: isAlternateReplyAnchor ? '#FFD700' : 'rgba(255,255,255,0.8)',
                  border: isAlternateReplyAnchor ? '2px solid #FFD700' : '2px dashed rgba(255,255,255,0.5)',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  '&:hover': {
                    color: isAlternateReplyAnchor ? '#FFD700' : 'white',
                    borderColor: isAlternateReplyAnchor ? '#FFD700' : 'rgba(255,255,255,0.9)',
                    bgcolor: isAlternateReplyAnchor ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.1)',
                  },
                }}
                title="Try a different reply from here"
              >
                <CallSplitIcon sx={{ fontSize: 14 }} />
              </IconButton>
            )}
          </Paper>
        </Box>
      )}

      {/* Agent Message Bubble (right-aligned, gray) */}
      {node.agentMessage && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
          <Paper
            sx={{
              maxWidth: '70%',
              p: 2,
              bgcolor: '#f5f5f5',
              color: 'text.primary',
              borderRadius: '16px 4px 16px 16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {node.agentMessage}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export const Playback: React.FC = () => {
  const { 
    currentRun, 
    activeBranchId, 
    selectedNodeId, 
    alternateReplyAnchorNodeId,
    selectNode, 
    setAlternateReplyAnchor,
    stepSimulation, 
    forkSimulation, 
    getNodesForBranch 
  } = useSimulator();
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Build ancestry path to selected node (only show this path, not sibling branches)
  const nodes = useMemo(() => {
    if (!currentRun) return [];
    
    // If no node selected, show the first root-to-leaf path
    if (!selectedNodeId) {
      // Find root node
      const root = currentRun.nodes.find(n => n.parentNodeId === null);
      if (!root) return [];
      
      // Follow first child until leaf
      const path: string[] = [root.nodeId];
      let current = root.nodeId;
      while (true) {
        const child = currentRun.nodes.find(n => n.parentNodeId === current);
        if (!child) break;
        path.push(child.nodeId);
        current = child.nodeId;
      }
      
      return currentRun.nodes
        .filter(n => path.includes(n.nodeId))
        .sort((a, b) => path.indexOf(a.nodeId) - path.indexOf(b.nodeId));
    }
    
    // Build ancestry chain from selected node back to root
    const ancestryChain: string[] = [];
    let currentNodeId: string | null = selectedNodeId;
    
    while (currentNodeId) {
      ancestryChain.unshift(currentNodeId);
      const node = currentRun.nodes.find(n => n.nodeId === currentNodeId);
      currentNodeId = node?.parentNodeId || null;
    }
    
    // Return only nodes in the ancestry chain
    return currentRun.nodes
      .filter(n => ancestryChain.includes(n.nodeId))
      .sort((a, b) => ancestryChain.indexOf(a.nodeId) - ancestryChain.indexOf(b.nodeId));
  }, [currentRun, selectedNodeId]);

  // Build breadcrumb trail from user messages in the path (MUST be before any function declarations)
  const breadcrumb = useMemo(() => {
    const userMessages = nodes
      .filter(n => n.userMessage)
      .map(n => {
        const msg = n.userMessage!;
        return msg.length > 30 ? msg.substring(0, 30) + '...' : msg;
      });
    
    if (userMessages.length === 0) return 'Main';
    return 'Main > ' + userMessages.map(m => `"${m}"`).join(' > ');
  }, [nodes]);

  // Check if selected node is a leaf (no children)
  const isLeafNode = () => {
    if (!selectedNodeId || !currentRun) return true;
    
    // Check if any node in the entire run has this as parent
    return !currentRun.nodes.some(n => n.parentNodeId === selectedNodeId);
  };

  // Check if selected node has a user message (is a user turn)
  const selectedNode = selectedNodeId ? nodes.find(n => n.nodeId === selectedNodeId) : null;
  const isUserTurn = selectedNode?.userMessage !== undefined && selectedNode?.userMessage !== null;
  
  // Agent-only turns should only disable composer if they're NOT the leaf (can't branch from middle agent messages)
  // But if it's the leaf (latest turn), user should always be able to reply
  const isAgentOnlyTurn = selectedNode && !selectedNode.userMessage && selectedNode.agentMessage && !isLeafNode();

  const handleSendMessage = async () => {
    if (!userInput.trim() || isSending) return;

    // CORE INVARIANT: Branches exist because the user said something different.
    // The agent merely responded. This function creates branches ONLY at user message boundaries.
    // Agent responses are deterministic outcomes, never edited or forked.
    // Clicking a user message icon selects a divergence anchor.
    // A branch is created only when a different reply is submitted.

    setIsSending(true);
    try {
      // If an alternate reply anchor is set, fork from that point
      if (alternateReplyAnchorNodeId) {
        const anchorNode = nodes.find(n => n.nodeId === alternateReplyAnchorNodeId);
        const branchLabel = `Alternate Reply from Turn ${anchorNode?.turnNumber || '?'}`;
        await forkSimulation(alternateReplyAnchorNodeId, branchLabel);
        // Clear the anchor after creating the branch
        setAlternateReplyAnchor(null);
      }
      
      // Send message (either on current branch or new fork)
      await stepSimulation(userInput);
      setUserInput('');
    } catch (error) {
      console.error('Failed to send:', error);
      alert('Failed to send message. Check console for details.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Render composer even without a run for testing
  const renderComposer = () => (
    <Box
      sx={{
        borderTop: '2px solid',
        borderColor: 'primary.main',
        p: 2,
        backgroundColor: '#f0f0f0',
        flexShrink: 0,
        minHeight: 100,
        maxHeight: 150,
      }}
      >
        {/* BRANCHES EXIST BECAUSE THE USER SAID SOMETHING DIFFERENT. THE AGENT MERELY RESPONDED. */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Helper text based on selection */}
          {isAgentOnlyTurn && (
            <Typography variant="caption" sx={{ color: 'warning.main', fontStyle: 'italic' }}>
              ⚠️ Agent messages are read-only outcomes. Select a user reply to create an alternate branch.
            </Typography>
          )}
          {alternateReplyAnchorNodeId && (
            <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: '#FFF9C4', p: 1, borderRadius: 1 }}>
              <CallSplitIcon sx={{ fontSize: 14 }} />
              This will create a new branch
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder={(() => {
                if (isAgentOnlyTurn) {
                  return "Select a user reply to create an alternate branch";
                }
                if (alternateReplyAnchorNodeId) {
                  // Get the anchor node's message
                  const anchorNode = nodes.find(n => n.nodeId === alternateReplyAnchorNodeId);
                  const anchorMessage = anchorNode?.userMessage || '';
                  const truncated = anchorMessage.length > 40 
                    ? anchorMessage.substring(0, 40) + '...'
                    : anchorMessage;
                  return `Alternate reply to: "${truncated}"`;
                }
                return "Type as the lead…";
              })()}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSending || !currentRun || isAgentOnlyTurn}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isAgentOnlyTurn ? '#f5f5f5' : alternateReplyAnchorNodeId ? '#FFFDE7' : 'white',
                }
              }}
            />
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isSending || !currentRun || isAgentOnlyTurn}
              sx={{ 
                minWidth: 200, 
                height: 40,
                backgroundColor: alternateReplyAnchorNodeId ? '#FF9800' : undefined,
                '&:hover': {
                  backgroundColor: alternateReplyAnchorNodeId ? '#F57C00' : undefined,
                }
              }}
              title={
                isAgentOnlyTurn 
                  ? 'Select a user reply to create an alternate branch'
                  : alternateReplyAnchorNodeId
                    ? 'Try a different reply from here'
                    : 'Send message'
              }
            >
              {isSending ? 'Sending...' : (alternateReplyAnchorNodeId ? 'Create Alternate Reply' : 'Send')}
            </Button>
          </Box>
        </Box>
      </Box>
  );

  if (!currentRun) {
    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
            minHeight: 0,
          }}
        >
          <Typography>Start a simulation to begin playback</Typography>
        </Box>
        {renderComposer()}
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Breadcrumb Trail */}
      <Box
        sx={{
          py: 1,
          px: 2,
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          {breadcrumb}
        </Typography>
      </Box>

      {/* Conversation History */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 3,
          backgroundColor: '#ffffff',
          minHeight: 0,
        }}
      >
        {nodes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            <Typography variant="body2">No turns yet</Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              {activeBranchId ? `Branch "${activeBranchId}" is empty` : 'No branch selected'}
            </Typography>
          </Box>
        ) : (
          nodes.map((node) => (
            <TurnCard
              key={node.nodeId}
              node={node}
              isSelected={node.nodeId === selectedNodeId}
              isAlternateReplyAnchor={node.nodeId === alternateReplyAnchorNodeId}
              isInAlternateReplyMode={alternateReplyAnchorNodeId !== null}
              onClick={() => selectNode(node.nodeId)}
              onSetAlternateReplyAnchor={node.userMessage ? () => setAlternateReplyAnchor(node.nodeId) : undefined}
            />
          ))
        )}
      </Box>

      {/* User Input Composer - Always visible at bottom */}
      {renderComposer()}
    </Box>
  );
};

