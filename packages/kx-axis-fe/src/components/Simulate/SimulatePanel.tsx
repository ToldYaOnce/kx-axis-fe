import React, { useState } from 'react';
import {
  Box,
  Typography,
  Drawer,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useFlow } from '../../context/FlowContext';
import type { SimulationInput, SimulationOutput } from '../../types';

interface SimulatePanelProps {
  open: boolean;
  onClose: () => void;
}

const CHANNELS = ['SMS', 'Email', 'Web Chat', 'Phone'];
const LEAD_STATES = ['New', 'Engaged', 'Qualified', 'Nurturing', 'Lost'];

export const SimulatePanel: React.FC<SimulatePanelProps> = ({ open, onClose }) => {
  const { flow } = useFlow();

  const [input, setInput] = useState<SimulationInput>({
    channel: 'SMS',
    leadState: 'New',
    vulnerability: 0.5,
    contactCaptured: false,
  });

  const [output, setOutput] = useState<SimulationOutput | null>(null);

  const handleSimulate = () => {
    // Mock simulation logic - deterministic based on input
    const eligibleNodes = flow.nodes
      .filter((node) => {
        // Simple eligibility check
        if (node.eligibility?.requiresContact && !input.contactCaptured) {
          return false;
        }
        if (node.eligibility?.channels && !node.eligibility.channels.includes(input.channel)) {
          return false;
        }
        if (
          node.eligibility?.leadStates &&
          !node.eligibility.leadStates.includes(input.leadState)
        ) {
          return false;
        }
        return true;
      })
      .map((node) => node.id);

    const selectedNode = eligibleNodes.length > 0 ? eligibleNodes[0] : undefined;
    const selectedNodeData = flow.nodes.find((n) => n.id === selectedNode);

    const exampleMessage = selectedNodeData
      ? `[${selectedNodeData.kind}] ${selectedNodeData.title}: This is a simulated message based on your flow configuration. In a real system, this would be dynamically generated based on the node's content and the lead's context.`
      : 'No eligible nodes found for this configuration.';

    // Generate mock outputs for GOAL_GAP_TRACKER nodes
    const goalGapTrackerNode = flow.nodes.find((n) => n.kind === 'GOAL_GAP_TRACKER');
    const mockGoalGapOutputs = goalGapTrackerNode
      ? {
          target: 'bench 300 lbs',
          baseline: 'currently benching 225 lbs',
          delta: '75 lbs increase (33% gain)',
          category: 'Strength PR',
          deadlinePolicy: goalGapTrackerNode.goalGapTracker?.deadlinePolicyDefault || 'INHERIT',
        }
      : undefined;

    setOutput({
      eligibleNodes,
      selectedNode,
      exampleMessage,
      goalGapTrackerOutputs: mockGoalGapOutputs,
    });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 480,
          p: 3,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Simulate Flow
        </Typography>
        <Button size="small" onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Test your flow configuration with different lead scenarios. This is a lightweight simulation
        for UX clarity.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Inputs */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
        Scenario Inputs
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Channel</InputLabel>
        <Select
          value={input.channel}
          label="Channel"
          onChange={(e) => setInput({ ...input, channel: e.target.value })}
        >
          {CHANNELS.map((channel) => (
            <MenuItem key={channel} value={channel}>
              {channel}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Lead State</InputLabel>
        <Select
          value={input.leadState}
          label="Lead State"
          onChange={(e) => setInput({ ...input, leadState: e.target.value })}
        >
          {LEAD_STATES.map((state) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
        Vulnerability: {Math.round(input.vulnerability * 100)}%
      </Typography>
      <Slider
        value={input.vulnerability}
        onChange={(_, value) => setInput({ ...input, vulnerability: value as number })}
        min={0}
        max={1}
        step={0.1}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={input.contactCaptured}
            onChange={(e) => setInput({ ...input, contactCaptured: e.target.checked })}
          />
        }
        label="Contact Captured"
        sx={{ mb: 3 }}
      />

      <Button
        fullWidth
        variant="contained"
        startIcon={<PlayArrowIcon />}
        onClick={handleSimulate}
        sx={{ mb: 3 }}
      >
        Run Simulation
      </Button>

      <Divider sx={{ mb: 3 }} />

      {/* Outputs */}
      {output && (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Simulation Results
          </Typography>

          <Paper sx={{ p: 2, mb: 2, backgroundColor: 'action.hover' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              Eligible Nodes ({output.eligibleNodes.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {output.eligibleNodes.map((nodeId) => {
                const node = flow.nodes.find((n) => n.id === nodeId);
                return (
                  <Chip
                    key={nodeId}
                    label={node?.title || nodeId}
                    size="small"
                    color={nodeId === output.selectedNode ? 'primary' : 'default'}
                  />
                );
              })}
              {output.eligibleNodes.length === 0 && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  No eligible nodes
                </Typography>
              )}
            </Box>
          </Paper>

          {output.selectedNode && (
            <Paper sx={{ p: 2, mb: 2, backgroundColor: 'success.light' }}>
              <Typography variant="caption" sx={{ color: 'success.dark', mb: 1, display: 'block' }}>
                Selected Node
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                {flow.nodes.find((n) => n.id === output.selectedNode)?.title || output.selectedNode}
              </Typography>
            </Paper>
          )}

          <Paper sx={{ p: 2, backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              Example Message
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
              {output.exampleMessage}
            </Typography>
          </Paper>

          {/* GOAL_GAP_TRACKER Outputs (mocked) */}
          {output.goalGapTrackerOutputs && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                🎯 Goal Gap Tracker Outputs (Mocked)
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  backgroundColor: 'primary.lighter',
                  border: '1px solid',
                  borderColor: 'primary.light',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                      goal.target
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                      {output.goalGapTrackerOutputs.target}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                      goal.baseline
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                      {output.goalGapTrackerOutputs.baseline}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                      goal.delta (computed)
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'success.dark' }}
                    >
                      {output.goalGapTrackerOutputs.delta}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                      goal.deltaCategory (classified)
                    </Typography>
                    <Chip
                      label={output.goalGapTrackerOutputs.category}
                      size="small"
                      color="secondary"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                      goal.deadlinePolicy
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>
                      {output.goalGapTrackerOutputs.deadlinePolicy}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
                💡 These are deterministic mock outputs. In production, delta is computed and category is
                classified by the backend.
              </Typography>
            </>
          )}
        </>
      )}
    </Drawer>
  );
};


