import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useFlow } from '../../context/FlowContext';
import type { GoalLens, ActiveGoalLens } from '../../types';

export const GoalLensPanel: React.FC = () => {
  const { flow, registry, addGoalLens, removeGoalLens, setSelection } = useFlow();

  const activeLensIds = flow.activeGoalLenses.map((agl) => agl.lensId);
  const availableLenses = registry.lenses.filter((lens) => !activeLensIds.includes(lens.id));

  const handleAddLens = (lens: GoalLens) => {
    const newActive: ActiveGoalLens = {
      lensId: lens.id,
      required: false,
    };
    addGoalLens(newActive);
  };

  const handleSelectLens = (lensId: string) => {
    setSelection({ type: 'goal-lens', id: lensId });
  };

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 3 }}>
      {/* Active Goal Lenses */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Active Goal Lenses ({flow.activeGoalLenses.length})
      </Typography>

      {flow.activeGoalLenses.length > 0 ? (
        <Box sx={{ mb: 3 }}>
          {flow.activeGoalLenses.map((activeGoalLens) => {
            const lens = registry.lenses.find((l) => l.id === activeGoalLens.lensId);
            if (!lens) return null;

            return (
              <Paper
                key={lens.id}
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                  },
                }}
                onClick={() => handleSelectLens(lens.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
                      {lens.icon}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {lens.name}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeGoalLens(lens.id);
                    }}
                    sx={{ color: 'error.main' }}
                  >
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  {lens.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {activeGoalLens.required && (
                    <Chip label="Required" size="small" color="error" sx={{ height: 20 }} />
                  )}
                  <Chip
                    label={`${lens.metricBundle.baselineMetrics.length} baseline metrics`}
                    size="small"
                    sx={{ height: 20 }}
                  />
                  <Chip
                    label={`${lens.metricBundle.targetMetrics.length} target metrics`}
                    size="small"
                    sx={{ height: 20 }}
                  />
                </Box>

                {activeGoalLens.usageLabel && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled', display: 'block', mt: 1, fontStyle: 'italic' }}
                  >
                    {activeGoalLens.usageLabel}
                  </Typography>
                )}
              </Paper>
            );
          })}
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: '1px dashed',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            No goal lenses active. Add from available lenses below.
          </Typography>
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Available Goal Lenses */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Available Goal Lenses ({availableLenses.length})
      </Typography>

      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
        From {registry.industry} industry
      </Typography>

      {availableLenses.map((lens) => (
        <Accordion
          key={lens.id}
          elevation={0}
          sx={{
            mb: 1,
            border: '1px solid',
            borderColor: 'divider',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '1.2rem' }}>{lens.icon}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {lens.name}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddLens(lens);
                }}
                sx={{ color: 'primary.main' }}
              >
                <AddCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
              {lens.description}
            </Typography>

            {/* Baseline Metrics */}
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              Baseline Metrics:
            </Typography>
            <Box sx={{ pl: 2, mb: 2 }}>
              {lens.metricBundle.baselineMetrics.map((metric) => (
                <Box key={metric.id} sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.primary' }}>
                    • {metric.name}
                    {metric.required && (
                      <Chip label="required" size="small" color="error" sx={{ height: 16, ml: 0.5 }} />
                    )}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', pl: 2 }}>
                    {metric.description}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Target Metrics */}
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              Target Metrics:
            </Typography>
            <Box sx={{ pl: 2, mb: 2 }}>
              {lens.metricBundle.targetMetrics.map((metric) => (
                <Box key={metric.id} sx={{ mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.primary' }}>
                    • {metric.name}
                    {metric.required && (
                      <Chip label="required" size="small" color="error" sx={{ height: 16, ml: 0.5 }} />
                    )}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', pl: 2 }}>
                    {metric.description}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Deadline Policy */}
            <Box
              sx={{
                p: 1,
                backgroundColor: 'action.hover',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                Deadline Policy:
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {lens.metricBundle.deadlinePolicy === 'EXACT_DATE' && '📅 Exact date required'}
                {lens.metricBundle.deadlinePolicy === 'RANGE_OK' && '📆 Date range acceptable'}
                {lens.metricBundle.deadlinePolicy === 'DURATION_OK' && '⏱️ Duration acceptable ("3 months")'}
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      {availableLenses.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: '1px dashed',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            All goal lenses from registry are active
          </Typography>
        </Paper>
      )}
    </Box>
  );
};


