/**
 * Playback - Turn-by-turn conversation display with inspector on hover
 * 
 * CORE INVARIANT:
 * Branches exist because the user said something different.
 * The agent merely responded.
 * 
 * Visual Rules:
 * - 👤 User messages (blue, left) = BRANCH POINTS (marked with fork icon in dotted circle)
 * - 🤖 Agent messages (slate, right) = READ-ONLY OUTCOMES (no fork affordance, thick colored border)
 *   - Click agent messages to see diagnostics in Readiness Panel:
 *     - Why this flow node was selected
 *     - What alternatives were considered
 *     - User intent & behavioral signals
 *     - Performance metrics & gap recommendations
 * - Composer behavior reflects selection:
 *   - User turn selected → "Alternate Reply"
 *   - Agent turn selected → Composer disabled
 *   - Leaf turn selected → "Send"
 * 
 * Message Formatting:
 * - *action* → Muted italic action text (like IRC /me command)
 * - **text** → Bold italic cyan emphasis
 * - [emoji_name] → Converted to emoji (e.g., [boxing_glove] → 🥊)
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
  Snackbar,
  Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import { useSimulator } from '../../context/SimulatorContext';
import type { SimulationNode } from '../../types/simulator';

// Emoji mapping for [emoji_name] syntax
const emojiMap: Record<string, string> = {
  'boxing_glove': '🥊',
  'fire': '🔥',
  'sparkles': '✨',
  'rocket': '🚀',
  'star': '⭐',
  'heart': '❤️',
  'thumbs_up': '👍',
  'wave': '👋',
  'smile': '😊',
  'thinking': '🤔',
  'celebration': '🎉',
  'check': '✓',
  'warning': '⚠️',
};

// Format message text with **emphasis** and [emoji] support
const formatMessageText = (text: string): React.ReactNode => {
  if (!text) return text;

  // Split by **, *, and [] patterns
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Combined regex to match **text** or *action* or [emoji_name]
  // Important: Check ** before * to avoid partial matches
  const regex = /(\*\*.*?\*\*|\*.*?\*|\[[\w_]+\])/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matched = match[0];
    
    if (matched.startsWith('**') && matched.endsWith('**')) {
      // Handle **emphasis** - styled like IRC /me command
      const innerText = matched.slice(2, -2);
      parts.push(
        <Typography
          key={match.index}
          component="span"
          sx={{
            fontStyle: 'italic',
            color: 'secondary.main',
            fontWeight: 600,
          }}
        >
          {innerText}
        </Typography>
      );
    } else if (matched.startsWith('*') && matched.endsWith('*') && !matched.startsWith('**')) {
      // Handle *action* - styled like old /me action text
      const innerText = matched.slice(1, -1);
      parts.push(
        <Typography
          key={match.index}
          component="span"
          sx={{
            fontStyle: 'italic',
            color: 'text.secondary',
            fontSize: '0.95em',
          }}
        >
          {innerText}
        </Typography>
      );
    } else if (matched.startsWith('[') && matched.endsWith(']')) {
      // Handle [emoji_name]
      const emojiName = matched.slice(1, -1);
      const emoji = emojiMap[emojiName] || matched; // Fallback to original if not found
      parts.push(
        <Typography
          key={match.index}
          component="span"
          sx={{ fontSize: '1.1em' }}
        >
          {emoji}
        </Typography>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
};

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
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 0.5, alignItems: 'flex-start' }}>
          {/* User Avatar Badge */}
          <Box sx={{
            flexShrink: 0,
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            border: '2px solid',
            borderColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1,
            mt: 0.5,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}>
            <PersonIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
          </Box>
          
          {isAlternateReplyAnchor && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mr: 1,
              color: 'warning.main',
              fontSize: '0.75rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              Instead of →
            </Box>
          )}
          <Paper
            onClick={onClick}
            onMouseEnter={() => setShowForkIcon(true)}
            onMouseLeave={() => setShowForkIcon(false)}
            sx={{
              maxWidth: '70%',
              p: 2,
              bgcolor: isAlternateReplyAnchor ? 'warning.main' : 'primary.main',
              color: '#FFFFFF',
              borderRadius: '4px 16px 16px 16px',
              cursor: 'pointer',
              boxShadow: isAlternateReplyAnchor 
                ? '0 0 0 3px rgba(167, 139, 250, 0.3), 0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)'
                : '0 3px 10px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.3)',
              border: isAlternateReplyAnchor 
                ? '2px dashed'
                : isSelected 
                  ? '2px solid' 
                  : '1px solid transparent',
              borderColor: isAlternateReplyAnchor 
                ? 'warning.dark'
                : isSelected 
                  ? 'primary.main' 
                  : 'transparent',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              opacity: isAlternateReplyAnchor ? 0.9 : (isInAlternateReplyMode ? 0.4 : 1),
              transition: 'all 0.2s ease-out',
              position: 'relative',
              transform: 'translateY(0)',
              backgroundImage: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
              '&:hover': {
                boxShadow: isAlternateReplyAnchor 
                  ? '0 0 0 3px rgba(167, 139, 250, 0.4), 0 6px 16px rgba(0, 0, 0, 0.5), 0 3px 8px rgba(0, 0, 0, 0.4)'
                  : '0 4px 14px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4)',
                transform: 'translateY(-2px)',
              },
              '&::before': isAlternateReplyAnchor ? {
                content: '"📌"',
                position: 'absolute',
                top: -8,
                right: -8,
                fontSize: '1.2rem',
              } : {},
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
                    console.log('🔀 FORK ICON CLICKED:', {
                      forkingFromNodeId: node.nodeId,
                      forkingFromMessage: node.userMessage,
                      parentNodeIdOfThisNode: node.parentNodeId,
                      message: 'When we submit alternate reply, it should use parentNodeId: ' + node.parentNodeId
                    });
                    onSetAlternateReplyAnchor();
                  }
                }}
                sx={{
                  flexShrink: 0,
                  p: 0.5,
                  color: isAlternateReplyAnchor ? 'warning.light' : 'rgba(255,255,255,0.8)',
                  border: isAlternateReplyAnchor ? '2px solid' : '2px dashed rgba(255,255,255,0.5)',
                  borderColor: isAlternateReplyAnchor ? 'warning.light' : undefined,
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  '&:hover': {
                    color: isAlternateReplyAnchor ? 'warning.light' : 'white',
                    borderColor: isAlternateReplyAnchor ? 'warning.light' : 'rgba(255,255,255,0.9)',
                    bgcolor: isAlternateReplyAnchor ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.1)',
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

      {/* Agent Message Bubble (right-aligned, dark card with subtle accent) */}
      {node.agentMessage && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5, alignItems: 'flex-start' }}>
          <Paper
            onClick={onClick}
            elevation={0}
            sx={{
              maxWidth: '70%',
              p: 2,
              bgcolor: 'rgba(51, 65, 85, 1)',
              color: '#FFFFFF',
              borderRadius: '16px 4px 16px 16px',
              boxShadow: '0 3px 10px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.3)',
              border: isSelected ? '2px solid' : '1px solid transparent',
              borderColor: isSelected ? 'secondary.main' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease-out',
              opacity: isInAlternateReplyMode ? 0.4 : 1,
              transform: 'translateY(0)',
              backgroundImage: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
              '&:hover': {
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4)',
                borderColor: isSelected ? 'secondary.main' : 'rgba(34, 211, 238, 0.2)',
                bgcolor: 'rgba(71, 85, 105, 1)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {formatMessageText(node.agentMessage)}
            </Typography>
          </Paper>
          
          {/* Agent Avatar Badge - Circular with cyan glow */}
          <Box sx={{
            flexShrink: 0,
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'rgba(34, 211, 238, 0.15)',
            border: '2px solid',
            borderColor: 'secondary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ml: 1,
            mt: 0.5,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}>
            <SmartToyIcon sx={{ fontSize: '1.1rem', color: 'secondary.main' }} />
          </Box>
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
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  
  // Scroll container ref for auto-scrolling
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Toast notification state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  
  const showToast = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };
  
  // Auto-scroll to bottom when new messages arrive or pending states change
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [currentRun?.nodes.length, pendingUserMessage, showTypingIndicator]);

  // Build ancestry path to selected node (only show this path, not sibling branches)
  const nodes = useMemo(() => {
    console.log('🔍 Playback useMemo - Building nodes list:', { 
      hasCurrentRun: !!currentRun, 
      selectedNodeId,
      totalNodesInRun: currentRun?.nodes.length 
    });
    
    if (!currentRun) {
      console.log('⚠️ No currentRun');
      return [];
    }
    
    console.log('📋 All nodes in currentRun:', currentRun.nodes);
    
    // If no node selected, show the first root-to-leaf path
    if (!selectedNodeId) {
      console.log('⚠️ No selectedNodeId, building default path');

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
      
      const filteredNodes = currentRun.nodes
        .filter(n => path.includes(n.nodeId))
        .sort((a, b) => path.indexOf(a.nodeId) - path.indexOf(b.nodeId));
      
      console.log('✅ Default path nodes:', filteredNodes.length, filteredNodes.map(n => n.nodeId));
      return filteredNodes;
    }
    
    // Build ancestry chain from selected node back to root
    console.log('🔍 Building ancestry from selected node:', selectedNodeId);
    const ancestryChain: string[] = [];
    let currentNodeId: string | null = selectedNodeId;
    
    while (currentNodeId) {
      ancestryChain.unshift(currentNodeId);
      const node = currentRun.nodes.find(n => n.nodeId === currentNodeId);
      currentNodeId = node?.parentNodeId || null;
    }
    
    // Return only nodes in the ancestry chain
    console.log('📍 Ancestry chain:', ancestryChain);
    const ancestryNodes = currentRun.nodes
      .filter(n => ancestryChain.includes(n.nodeId))
      .sort((a, b) => ancestryChain.indexOf(a.nodeId) - ancestryChain.indexOf(b.nodeId));
    
    console.log('✅ Ancestry nodes to display:', ancestryNodes.length, ancestryNodes.map(n => n.nodeId));
    return ancestryNodes;
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
    console.log('📨 handleSendMessage called with:', { userInput, isSending, hasCurrentRun: !!currentRun });
    
    if (!userInput.trim() || isSending) {
      console.log('⚠️ Message not sent:', { 
        noInput: !userInput.trim(), 
        alreadySending: isSending 
      });
      return;
    }

    // CORE INVARIANT: Branches exist because the user said something different.
    // The agent merely responded. This function creates branches ONLY at user message boundaries.
    // Agent responses are deterministic outcomes, never edited or forked.
    // Clicking a user message icon selects a divergence anchor.
    // A branch is created only when a different reply is submitted.

    // Optimistic UI: Show user message immediately
    const messageToSend = userInput.trim();
    setPendingUserMessage(messageToSend);
    setUserInput('');
    setIsSending(true);
    
    try {
      // If no simulation is running yet, this is an error (simulation should be created on page load)
      if (!currentRun) {
        console.error('❌ No simulation loaded');
        showToast('No simulation loaded. Please go back and create a new simulation.', 'error');
        setPendingUserMessage(null);
        setUserInput(messageToSend); // Restore message
        setIsSending(false);
        return;
      }
      
      console.log('✅ Current run exists, proceeding with message');
      
      // Store anchor before clearing it
      const anchorNodeId = alternateReplyAnchorNodeId;
      
      // Show typing indicator after a brief moment
      setTimeout(() => setShowTypingIndicator(true), 300);
      
      // Send message (PATCH /agent/simulations/:id)
      // Note: stepSimulation will check alternateReplyAnchorNodeId to determine parent
      // For real API, we DON'T call forkSimulation - the API handles forks via parentNodeId
      console.log('💬 Calling stepSimulation with:', { 
        userInput: messageToSend, 
        alternateReplyAnchorNodeId: anchorNodeId,
        explanation: anchorNodeId ? `Will fork from anchor node's parent (creating sibling to ${anchorNodeId})` : 'Will use latest node'
      });
      await stepSimulation(messageToSend);
      console.log('✅ Message sent successfully');
      
      // Clear the anchor AFTER stepSimulation so it can use it
      if (anchorNodeId) {
        console.log('🧹 Clearing alternate reply anchor');
        setAlternateReplyAnchor(null);
      }
      
      // Clear optimistic UI
      setPendingUserMessage(null);
      setShowTypingIndicator(false);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      showToast(`Failed to send message: ${error.message}`, 'error');
      setPendingUserMessage(null);
      setShowTypingIndicator(false);
      setUserInput(messageToSend); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    } else if (event.key === 'Escape' && alternateReplyAnchorNodeId) {
      event.preventDefault();
      setAlternateReplyAnchor(null);
      setUserInput('');
    }
  };

  // COMPOSER HEIGHT - adjust this constant to change composer size
  const COMPOSER_HEIGHT = alternateReplyAnchorNodeId ? 180 : 80;

  // Render composer even without a run for testing
  const renderComposer = () => (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${COMPOSER_HEIGHT}px`,
        borderTop: '2px solid',
        borderColor: 'primary.main',
        p: 1.5,
        pb: 0.5,
        backgroundColor: 'background.default',
        zIndex: 10,
      }}
      >
        {/* BRANCHES EXIST BECAUSE THE USER SAID SOMETHING DIFFERENT. THE AGENT MERELY RESPONDED. */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Helper text based on selection */}
          {isAgentOnlyTurn && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'warning.main', 
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backgroundColor: 'rgba(167, 139, 250, 0.1)',
                p: 0.75,
                borderRadius: 1,
                borderLeft: '3px solid',
                borderLeftColor: 'warning.main',
              }}
            >
              ⚠️ Agent messages are read-only outcomes. Select a user reply to create an alternate branch.
            </Typography>
          )}
          {alternateReplyAnchorNodeId && (
            <Box sx={{ 
              backgroundColor: 'rgba(167, 139, 250, 0.15)', 
              p: 1, 
              borderRadius: 1,
              border: '2px solid',
              borderColor: 'warning.main',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CallSplitIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                  <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 600 }}>
                    Creating Alternate Branch
                  </Typography>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={() => {
                    setAlternateReplyAnchor(null);
                    setUserInput('');
                  }}
                  sx={{ 
                    p: 0.25,
                    color: 'warning.main',
                    '&:hover': {
                      backgroundColor: 'rgba(167, 139, 250, 0.2)',
                    }
                  }}
                  title="Cancel alternate branch"
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>
                {(() => {
                  const anchorNode = nodes.find(n => n.nodeId === alternateReplyAnchorNodeId);
                  const anchorMessage = anchorNode?.userMessage || '';
                  const truncated = anchorMessage.length > 45 
                    ? anchorMessage.substring(0, 45) + '...'
                    : anchorMessage;
                  return `Instead of: "${truncated}"`;
                })()}
              </Typography>
              <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 600, fontSize: '0.7rem' }}>
                ↓ Type your alternate message below ↓
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder={(() => {
                if (isAgentOnlyTurn) {
                  return "Select a user reply to create an alternate branch";
                }
                if (alternateReplyAnchorNodeId) {
                  return "Type your alternate message here...";
                }
                return "Type as the lead…";
              })()}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSending || isAgentOnlyTurn}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: isAgentOnlyTurn ? 'action.disabledBackground' : alternateReplyAnchorNodeId ? 'rgba(167, 139, 250, 0.2)' : 'background.paper',
                  borderWidth: alternateReplyAnchorNodeId ? '2px' : '1px',
                  borderColor: alternateReplyAnchorNodeId ? 'warning.main' : undefined,
                },
                '& .MuiOutlinedInput-root:hover': {
                  borderColor: alternateReplyAnchorNodeId ? 'warning.dark' : undefined,
                },
                '& .MuiOutlinedInput-root.Mui-focused': {
                  borderColor: alternateReplyAnchorNodeId ? 'warning.main' : undefined,
                  borderWidth: alternateReplyAnchorNodeId ? '2px' : undefined,
                }
              }}
            />
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isSending || isAgentOnlyTurn}
              sx={{ 
                minWidth: 200, 
                height: 40,
                backgroundColor: alternateReplyAnchorNodeId ? 'warning.main' : undefined,
                '&:hover': {
                  backgroundColor: alternateReplyAnchorNodeId ? 'warning.dark' : undefined,
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
      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
            pb: `${COMPOSER_HEIGHT + 12}px`, // Add padding for absolute composer
          }}
        >
          <Typography>Type your first message below to start the conversation</Typography>
        </Box>
        {renderComposer()}
      </Box>
    );
  }

  return (
    <Box sx={{ 
      flex: 1, 
      position: 'relative',
      backgroundColor: 'background.default',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,  // Critical for flex scroll
    }}>
      {/* Breadcrumb Trail */}
      <Box
        sx={{
          flexShrink: 0,  // Prevent shrinking
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
        ref={scrollContainerRef}
        sx={{
          flex: 1,
          minHeight: 0,  // Critical for flex scroll
          overflowY: 'auto',
          overflowX: 'hidden',
          p: 3,
          pb: `${COMPOSER_HEIGHT + 12}px`, // Padding for absolute composer + breathing room
          backgroundColor: 'rgba(15, 23, 42, 1)',
          backgroundImage: `
            linear-gradient(45deg, rgba(255,255,255,0.015) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.015) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.015) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.015) 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          backgroundAttachment: 'local', // Makes pattern scroll with content
          position: 'relative',
        }}
      >
        {nodes.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8, 
            color: 'text.secondary',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}>
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>No turns yet</Typography>
            <Typography variant="caption" sx={{ color: 'secondary.main', fontWeight: 500 }}>
              {activeBranchId ? `Branch "${activeBranchId}" is empty` : 'No branch selected'}
            </Typography>
          </Box>
        ) : (
          <>
            {nodes.map((node) => (
              <TurnCard
                key={node.nodeId}
                node={node}
                isSelected={node.nodeId === selectedNodeId}
                isAlternateReplyAnchor={node.nodeId === alternateReplyAnchorNodeId}
                isInAlternateReplyMode={alternateReplyAnchorNodeId !== null}
                onClick={() => selectNode(node.nodeId)}
                onSetAlternateReplyAnchor={node.userMessage ? () => {
                  console.log('🔀 FORK BUTTON CLICKED:', {
                    anchorNodeId: node.nodeId,
                    anchorMessage: node.userMessage,
                    anchorParentNodeId: node.parentNodeId,
                    explanation: 'New message will use the same parentNodeId as this anchor node'
                  });
                  setAlternateReplyAnchor(node.nodeId);
                } : undefined}
              />
            ))}
            
            {/* Pending User Message (Optimistic UI) */}
            {pendingUserMessage && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
                {/* User Avatar Badge */}
                <Box sx={{
                  flexShrink: 0,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(37, 99, 235, 0.15)',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1,
                  mt: 0.5,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}>
                  <PersonIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                </Box>
                
                <Paper
                  sx={{
                    maxWidth: '70%',
                    p: 2,
                    bgcolor: 'primary.main',
                    color: '#FFFFFF',
                    borderRadius: '4px 16px 16px 16px',
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.3)',
                    border: '1px solid transparent',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    opacity: 0.8,
                    backgroundImage: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {pendingUserMessage}
                  </Typography>
                </Paper>
              </Box>
            )}
            
            {/* Typing Indicator */}
            {showTypingIndicator && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Paper
                  elevation={0}
                  sx={{
                    maxWidth: '70%',
                    p: 2,
                    bgcolor: 'rgba(51, 65, 85, 1)',
                    color: '#FFFFFF',
                    borderRadius: '16px 4px 16px 16px',
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.3)',
                    border: '1px solid transparent',
                    backgroundImage: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 0.5,
                    '& > span': {
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: 'secondary.main',
                      animation: 'typing 1.4s infinite',
                      '@keyframes typing': {
                        '0%, 60%, 100%': { opacity: 0.3 },
                        '30%': { opacity: 1 },
                      },
                    },
                    '& > span:nth-of-type(2)': {
                      animationDelay: '0.2s',
                    },
                    '& > span:nth-of-type(3)': {
                      animationDelay: '0.4s',
                    },
                  }}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </Box>
                  <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                    Agent is thinking...
                  </Typography>
                </Paper>
                
                {/* Agent Avatar Badge */}
                <Box sx={{
                  flexShrink: 0,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 211, 238, 0.15)',
                  border: '2px solid',
                  borderColor: 'secondary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ml: 1,
                  mt: 0.5,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}>
                  <SmartToyIcon sx={{ fontSize: '1.1rem', color: 'secondary.main' }} />
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* User Input Composer - Always visible at bottom */}
      {renderComposer()}

      {/* Toast Notifications - Above composer */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: `${COMPOSER_HEIGHT + 12}px !important` }}
      >
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} sx={{ width: '100%', zIndex: 20 }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

