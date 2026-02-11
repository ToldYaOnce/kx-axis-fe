import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { DraggableFactChip } from './DraggableFactChip';
import { AVAILABLE_VARIABLES } from '../../types/templates';

interface FactsPaletteProps {
  producesFacts?: string[];
  optionalFacts?: string[];
  showSystemVariables?: boolean;
}

/**
 * Convert snake_case to Title Case for display
 * e.g., "contact_email" → "Contact Email"
 */
const toTitleCase = (snakeCase: string): string => {
  return snakeCase
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Display all available facts and variables as draggable chips
 */
export const FactsPalette: React.FC<FactsPaletteProps> = ({
  producesFacts = [],
  optionalFacts = [],
  showSystemVariables = true,
}) => {
  const hasProducesFacts = producesFacts.length > 0;
  const hasOptionalFacts = optionalFacts.length > 0;
  const hasAnyFacts = hasProducesFacts || hasOptionalFacts;

  return (
    <Paper 
      sx={{ 
        p: 2, 
        bgcolor: 'rgba(34, 211, 238, 0.03)',
        border: '1px solid rgba(34, 211, 238, 0.2)',
        height: 'fit-content',
        position: 'sticky',
        top: 16,
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
        Available Facts
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
        Drag these into your messages →
      </Typography>

      {/* Produces Facts (Required) */}
      {hasProducesFacts && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
            Required Facts
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {producesFacts.map((fact) => (
              <DraggableFactChip
                key={fact}
                factName={fact}
                label={toTitleCase(fact)}
                color="primary"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Optional Facts */}
      {hasOptionalFacts && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
            Optional Facts
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {optionalFacts.map((fact) => (
              <DraggableFactChip
                key={fact}
                factName={fact}
                label={toTitleCase(fact)}
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}

      {/* System Variables */}
      {showSystemVariables && (
        <>
          {hasAnyFacts && <Divider sx={{ my: 2 }} />}
          <Box>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
              System Variables
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {AVAILABLE_VARIABLES.map((variable) => (
                <DraggableFactChip
                  key={variable.name}
                  factName={variable.name}
                  label={variable.name}
                  tooltip={`${variable.description} (e.g., "${variable.example}")`}
                  color="secondary"
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </>
      )}

      {!hasAnyFacts && !showSystemVariables && (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          Add produces facts above to use them in your messages
        </Typography>
      )}
    </Paper>
  );
};

