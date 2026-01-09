import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  IconButton,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CategoryIcon from '@mui/icons-material/Category';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import type { FlowNode, DeltaComputeMode, DeadlinePolicy } from '../../types';

interface GoalGapTrackerInspectorProps {
  node: FlowNode;
  onUpdate: (updates: Partial<FlowNode>) => void;
}

export const GoalGapTrackerInspector: React.FC<GoalGapTrackerInspectorProps> = ({ node, onUpdate }) => {
  const config = node.goalGapTracker || {
    targetLabel: "What's the exact outcome you want?",
    baselineLabel: "Where are you at right now with that?",
    showExamples: true,
    examples: [],
    computeMode: 'AUTO',
    askClarifierIfIncomparable: true,
    deadlinePolicyDefault: 'INHERIT',
    categories: [],
  };

  const [newExample, setNewExample] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleConfigUpdate = (updates: Partial<typeof config>) => {
    onUpdate({
      goalGapTracker: {
        ...config,
        ...updates,
      },
    });
  };

  const handleAddExample = () => {
    if (newExample.trim()) {
      handleConfigUpdate({
        examples: [...config.examples, newExample.trim()],
      });
      setNewExample('');
    }
  };

  const handleRemoveExample = (index: number) => {
    handleConfigUpdate({
      examples: config.examples.filter((_, i) => i !== index),
    });
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      handleConfigUpdate({
        categories: [
          ...config.categories,
          {
            id: `cat-${Date.now()}`,
            name: newCategoryName.trim(),
            deadlinePolicyOverride: 'INHERIT',
          },
        ],
      });
      setNewCategoryName('');
    }
  };

  const handleUpdateCategory = (index: number, updates: Partial<typeof config.categories[0]>) => {
    const updatedCategories = [...config.categories];
    updatedCategories[index] = { ...updatedCategories[index], ...updates };
    handleConfigUpdate({ categories: updatedCategories });
  };

  const handleRemoveCategory = (index: number) => {
    handleConfigUpdate({
      categories: config.categories.filter((_, i) => i !== index),
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <ShowChartIcon sx={{ fontSize: 28, color: '#E91E63' }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            Goal Gap Tracker
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Delta-first: Target → Baseline → Delta → Category
          </Typography>
        </Box>
      </Box>

      {/* Overview (read-only summary) */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            📊 Overview
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper sx={{ p: 2, backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
              This tracker captures:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip
                icon={<TrendingUpIcon sx={{ fontSize: '0.8rem' }} />}
                label="Target + Baseline"
                size="small"
                sx={{ justifyContent: 'flex-start', fontWeight: 600 }}
              />
              <Chip
                icon={<CategoryIcon sx={{ fontSize: '0.8rem' }} />}
                label="Delta (computed) + Category (classified)"
                size="small"
                sx={{ justifyContent: 'flex-start', fontWeight: 600 }}
              />
              {config.deadlinePolicyDefault !== 'INHERIT' && (
                <Chip
                  label={`Deadline: ${config.deadlinePolicyDefault.replace('_', ' ')}`}
                  size="small"
                  color="warning"
                  sx={{ justifyContent: 'flex-start', fontWeight: 600 }}
                />
              )}
            </Box>
          </Paper>
        </AccordionDetails>
      </Accordion>

      {/* Capture Questions */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            💬 Capture Questions (Semantic)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Target Prompt Label"
              fullWidth
              value={config.targetLabel}
              onChange={(e) => handleConfigUpdate({ targetLabel: e.target.value })}
              placeholder="e.g., What's the exact outcome you want?"
              helperText="This is a semantic label, NOT a full LLM prompt"
              size="small"
            />
            <TextField
              label="Baseline Prompt Label"
              fullWidth
              value={config.baselineLabel}
              onChange={(e) => handleConfigUpdate({ baselineLabel: e.target.value })}
              placeholder="e.g., Where are you at right now with that?"
              helperText="This is a semantic label, NOT a full LLM prompt"
              size="small"
            />

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={config.showExamples}
                  onChange={(e) => handleConfigUpdate({ showExamples: e.target.checked })}
                />
              }
              label="Show examples to end-user"
            />

            {config.showExamples && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  Examples:
                </Typography>
                <List dense sx={{ mb: 1 }}>
                  {config.examples.map((example, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton edge="end" size="small" onClick={() => handleRemoveExample(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={example} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  ))}
                </List>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g., bench 300"
                    value={newExample}
                    onChange={(e) => setNewExample(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExample();
                      }
                    }}
                  />
                  <Button variant="outlined" size="small" onClick={handleAddExample} startIcon={<AddIcon />}>
                    Add
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Delta Computation Mode */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            🧮 Delta Computation
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Compute Mode</InputLabel>
              <Select
                value={config.computeMode}
                label="Compute Mode"
                onChange={(e) => handleConfigUpdate({ computeMode: e.target.value as DeltaComputeMode })}
              >
                <MenuItem value="AUTO">AUTO (recommended)</MenuItem>
                <MenuItem value="TIME_BASED">Time-based (faster 5K, longer plank)</MenuItem>
                <MenuItem value="LOAD_BASED">Load-based (heavier bench, more weight)</MenuItem>
                <MenuItem value="REPS_BASED">Reps-based (more pushups, more reps)</MenuItem>
                <MenuItem value="PERCENT_BASED">Percent-based (lower body fat %, higher rate)</MenuItem>
                <MenuItem value="MANUAL">Manual (no compute; classification only)</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={config.askClarifierIfIncomparable}
                  onChange={(e) => handleConfigUpdate({ askClarifierIfIncomparable: e.target.checked })}
                />
              }
              label="Ask clarifier if target/baseline aren't comparable"
            />

            <Paper
              sx={{
                p: 1.5,
                backgroundColor: 'info.lighter',
                border: '1px solid',
                borderColor: 'info.light',
              }}
            >
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InfoOutlinedIcon sx={{ fontSize: '1rem' }} />
                Delta computation happens at runtime. This is config only.
              </Typography>
            </Paper>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Category Taxonomy */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            🏷️ Category Taxonomy (Google Tracking Style)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Define categories for classification. No nested rules or conditions.
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Default Deadline Policy</InputLabel>
              <Select
                value={config.deadlinePolicyDefault}
                label="Default Deadline Policy"
                onChange={(e) =>
                  handleConfigUpdate({
                    deadlinePolicyDefault: e.target.value as 'INHERIT' | DeadlinePolicy,
                  })
                }
              >
                <MenuItem value="INHERIT">Inherit from flow</MenuItem>
                <MenuItem value="EXACT_DATE">Exact date required</MenuItem>
                <MenuItem value="RANGE_OK">Range acceptable</MenuItem>
                <MenuItem value="DURATION_OK">Duration acceptable</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            {config.categories.length > 0 && (
              <List dense>
                {config.categories.map((category, index) => (
                  <Paper
                    key={category.id}
                    sx={{
                      mb: 1,
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={category.name}
                        onChange={(e) => handleUpdateCategory(index, { name: e.target.value })}
                        placeholder="Category name"
                      />
                      <IconButton size="small" onClick={() => handleRemoveCategory(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <FormControl fullWidth size="small">
                      <InputLabel>Deadline Override</InputLabel>
                      <Select
                        value={category.deadlinePolicyOverride || 'INHERIT'}
                        label="Deadline Override"
                        onChange={(e) =>
                          handleUpdateCategory(index, {
                            deadlinePolicyOverride: e.target.value as 'INHERIT' | DeadlinePolicy,
                          })
                        }
                      >
                        <MenuItem value="INHERIT">Inherit</MenuItem>
                        <MenuItem value="EXACT_DATE">Exact date</MenuItem>
                        <MenuItem value="RANGE_OK">Range OK</MenuItem>
                        <MenuItem value="DURATION_OK">Duration OK</MenuItem>
                      </Select>
                    </FormControl>
                  </Paper>
                ))}
              </List>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <Button variant="outlined" size="small" onClick={handleAddCategory} startIcon={<AddIcon />}>
                Add
              </Button>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Outputs (read-only) */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            📤 Outputs (Backend Consumes)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper sx={{ p: 2, backgroundColor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
              This node produces (read-only):
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="goal.target"
                  secondary="Structured target state"
                  primaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="goal.baseline"
                  secondary="Structured baseline state"
                  primaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="goal.delta"
                  secondary="Computed delta (system derived)"
                  primaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="goal.deltaCategory"
                  secondary="Classified category (LLM classification)"
                  primaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="goal.deadlinePolicy"
                  secondary="From node config"
                  primaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            </List>
          </Paper>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

