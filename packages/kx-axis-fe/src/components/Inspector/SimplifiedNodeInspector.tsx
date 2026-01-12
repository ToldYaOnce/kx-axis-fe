import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useFlow } from '../../context/FlowContext';
import type { FlowNode, NodeKind } from '../../types';

interface SimplifiedNodeInspectorProps {
  nodeId: string;
}

const NODE_KINDS: NodeKind[] = [
  'EXPLANATION',
  'REFLECTIVE_QUESTION',
  'GOAL_DEFINITION',
  'BASELINE_CAPTURE',
  'DEADLINE_CAPTURE',
  'GOAL_GAP_TRACKER',
  'ACTION_BOOKING',
  'HANDOFF',
];

// Human-friendly labels for node kinds
const NODE_KIND_LABELS: Record<NodeKind, string> = {
  EXPLANATION: 'Explanation',
  REFLECTIVE_QUESTION: 'Reflective Question',
  GOAL_DEFINITION: 'Goal Definition',
  BASELINE_CAPTURE: 'Capture Info',
  DEADLINE_CAPTURE: 'Deadline Capture',
  GOAL_GAP_TRACKER: 'Goal Gap Tracker',
  ACTION_BOOKING: 'Booking Action',
  HANDOFF: 'Handoff to Human',
};

// Map lanes to human-readable text
const LANE_LABELS: Record<string, string> = {
  BEFORE_CONTACT: 'Before Contact',
  CONTACT_GATE: 'Contact Gate',
  AFTER_CONTACT: 'After Contact',
  AFTER_BOOKING: 'After Booking',
};

export const SimplifiedNodeInspector: React.FC<SimplifiedNodeInspectorProps> = ({ nodeId }) => {
  const { flow, updateNode, removeNode } = useFlow();
  const node = flow.nodes.find((n) => n.id === nodeId);

  if (!node) return null;

  const handleUpdate = (updates: Partial<FlowNode>) => {
    updateNode(nodeId, updates);
  };

  // Determine locks (what this node requires)
  const locks: string[] = [];
  if (node.requires?.includes('CONTACT')) locks.push('Contact');
  if (node.requires?.includes('BOOKING')) locks.push('Booking');

  // Determine unlocks (gates and states this node satisfies)
  const unlocks: string[] = [];
  if (node.satisfies?.gates?.includes('CONTACT')) unlocks.push('Contact Captured');
  if (node.satisfies?.gates?.includes('BOOKING')) unlocks.push('Booking Confirmed');
  if (node.satisfies?.gates?.includes('HANDOFF')) unlocks.push('Handoff Complete');
  if (node.satisfies?.states?.includes('GOAL_GAP_CAPTURED')) {
    unlocks.push('Goal Gap Captured');
  }
  
  // Determine produces (metrics/data this node produces)
  const produces: string[] = [];
  if (node.satisfies?.metrics && node.satisfies.metrics.length > 0) {
    produces.push(...node.satisfies.metrics);
  }
  if (node.kind === 'GOAL_GAP_TRACKER') {
    // Add GOAL_GAP_TRACKER specific outputs
    if (!produces.includes('goal_delta')) produces.push('Delta');
    if (!produces.includes('goal_category')) produces.push('Category');
  }

  // Lane info
  const lane = node.ui?.lane || 'BEFORE_CONTACT';
  const runsIn = LANE_LABELS[lane] || lane;

  // Check if this is a Data Capture node
  const isDataCaptureNode = ['BASELINE_CAPTURE', 'GOAL_DEFINITION', 'DEADLINE_CAPTURE'].includes(node.kind);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header - lighter, more secondary */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          Item Details
        </Typography>
        <IconButton
          size="small"
          onClick={() => removeNode(nodeId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Box>

      {/* ========== MAIN SECTION ========== */}

      {/* 1. What this does */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 2, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
          What this does
        </Typography>

        <TextField
          fullWidth
          label="Title"
          value={node.title}
          onChange={(e) => handleUpdate({ title: e.target.value })}
          sx={{ mb: 2 }}
          size="small"
        />

        <FormControl fullWidth sx={{ mb: 2 }} size="small">
          <InputLabel>Node Type</InputLabel>
          <Select
            value={node.kind}
            label="Node Type"
            onChange={(e) => handleUpdate({ kind: e.target.value as NodeKind })}
          >
            {NODE_KINDS.map((kind) => (
              <MenuItem key={kind} value={kind}>
                {NODE_KIND_LABELS[kind]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Purpose (optional)"
          value={node.purpose || ''}
          onChange={(e) => handleUpdate({ purpose: e.target.value })}
          multiline
          rows={2}
          placeholder="Why does this node exist? What's its job?"
          size="small"
          helperText="A brief note to help you remember what this does"
        />
      </Box>

      <Divider sx={{ my: 2, borderColor: 'divider', opacity: 0.3 }} />

      {/* 2. When this can run (read-only mirror) */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
          When this can run
        </Typography>
        
        <Box
          sx={{
            p: 1.5,
            backgroundColor: 'background.default',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {locks.length > 0 ? (
            <Box>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.75, fontSize: '0.7rem' }}>
                Must know before:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {locks.map((lock) => (
                  <Chip
                    key={lock}
                    label={lock.toLowerCase()}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      backgroundColor: 'transparent',
                      border: '1px solid',
                      borderColor: 'divider',
                      color: 'text.secondary',
                    }}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.7rem' }}>
              No prerequisites — can run anytime
            </Typography>
          )}
        </Box>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1, fontSize: '0.65rem', fontStyle: 'italic' }}>
          Edit prerequisites on the card to change this
        </Typography>
      </Box>

      <Divider sx={{ my: 2, borderColor: 'divider', opacity: 0.3 }} />

      {/* 3. What this reveals (read-only mirror) */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
          What this reveals
        </Typography>
        
        <Box
          sx={{
            p: 1.5,
            backgroundColor: 'background.default',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {produces.length > 0 || unlocks.length > 0 ? (
            <Box>
              {produces.length > 0 && (
                <Box sx={{ mb: produces.length > 0 && unlocks.length > 0 ? 1.5 : 0 }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.75, fontSize: '0.7rem' }}>
                    Data captured:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {produces.map((metric) => (
                      <Chip
                        key={metric}
                        label={metric}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          backgroundColor: '#E1F5FE',
                          color: '#01579B',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {unlocks.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 0.75, fontSize: '0.7rem' }}>
                    Gates unlocked:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {unlocks.map((unlock) => (
                      <Chip
                        key={unlock}
                        label={unlock}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 500,
                          backgroundColor: 'transparent',
                          border: '1px solid',
                          borderColor: 'success.light',
                          color: 'text.secondary',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.7rem' }}>
              No data or gates produced
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* ========== ADVANCED (COLLAPSED) ========== */}

      <Accordion
        sx={{
          backgroundColor: 'transparent',
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            '& .MuiAccordionSummary-content': {
              my: 1,
            },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Advanced (optional)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Targeting */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1.5, display: 'block' }}>
                Targeting
              </Typography>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Channels (optional)</InputLabel>
                <Select
                  multiple
                  value={node.eligibility?.channels || []}
                  label="Channels (optional)"
                  onChange={(e) =>
                    handleUpdate({
                      eligibility: {
                        ...node.eligibility,
                        channels: e.target.value as string[],
                      },
                    })
                  }
                  renderValue={(selected) =>
                    selected.length > 0 ? selected.join(', ') : 'All channels'
                  }
                >
                  <MenuItem value="SMS">SMS</MenuItem>
                  <MenuItem value="Email">Email</MenuItem>
                  <MenuItem value="Web Chat">Web Chat</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Lead States (optional)</InputLabel>
                <Select
                  multiple
                  value={node.eligibility?.leadStates || []}
                  label="Lead States (optional)"
                  onChange={(e) =>
                    handleUpdate({
                      eligibility: {
                        ...node.eligibility,
                        leadStates: e.target.value as string[],
                      },
                    })
                  }
                  renderValue={(selected) =>
                    selected.length > 0 ? selected.join(', ') : 'All lead states'
                  }
                >
                  <MenuItem value="New">New</MenuItem>
                  <MenuItem value="Engaged">Engaged</MenuItem>
                  <MenuItem value="Qualified">Qualified</MenuItem>
                  <MenuItem value="Nurturing">Nurturing</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider />

            {/* Importance */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1.5, display: 'block' }}>
                Importance
              </Typography>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Importance</InputLabel>
                <Select
                  value={node.importance || 'normal'}
                  label="Importance"
                  onChange={(e) =>
                    handleUpdate({ importance: e.target.value as 'low' | 'normal' | 'high' })
                  }
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Max Runs</InputLabel>
                <Select
                  value={node.maxRuns || 'multiple'}
                  label="Max Runs"
                  onChange={(e) =>
                    handleUpdate({
                      maxRuns: e.target.value as 'once' | 'multiple' | 'unlimited',
                    })
                  }
                >
                  <MenuItem value="once">Once</MenuItem>
                  <MenuItem value="multiple">Multiple</MenuItem>
                  <MenuItem value="unlimited">Unlimited</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Cooldown</InputLabel>
                <Select
                  value={node.cooldownTurns ?? 0}
                  label="Cooldown"
                  onChange={(e) => handleUpdate({ cooldownTurns: e.target.value as number })}
                >
                  <MenuItem value={0}>Off (no cooldown)</MenuItem>
                  <MenuItem value={1}>1 turn</MenuItem>
                  <MenuItem value={2}>2 turns</MenuItem>
                  <MenuItem value={3}>3 turns</MenuItem>
                  <MenuItem value={5}>5 turns</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider />

            {/* Style Allowance */}
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1.5, display: 'block' }}>
                Style Allowance
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={node.allowSupportiveLine ?? false}
                    onChange={(e) => handleUpdate({ allowSupportiveLine: e.target.checked })}
                  />
                }
                label="Allow a short supportive line before the main message"
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                e.g., "Great question!" or "I'm glad you asked."
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

