/**
 * Readiness Panel - Shows known facts, missing facts, and unlocks
 * Uses availability language (not schema jargon)
 * 
 * PROGRESSIVE FOCUS:
 * - Playback Focus: Fully expanded (supports reasoning)
 * - Branching Focus: Collapsed by default (structure takes priority)
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useSimulator } from '../../context/SimulatorContext';
import type { KnownFacts } from '../../types/simulator';

const formatFactValue = (value: any): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }
  return String(value);
};

interface ReadinessPanelProps {
  isCollapsed?: boolean;
}

export const ReadinessPanel: React.FC<ReadinessPanelProps> = ({ isCollapsed = false }) => {
  const { getCurrentFacts, getLatestNode } = useSimulator();
  const currentFacts = getCurrentFacts();
  const latestNode = getLatestNode();
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);

  // Determine if panel should be shown
  const isVisible = !isCollapsed || isManuallyExpanded;

  // Extract known facts into flat list
  const knownFacts: Array<{ category: string; fact: string; value: any }> = [];
  
  Object.entries(currentFacts).forEach(([category, data]) => {
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          knownFacts.push({
            category: category.charAt(0).toUpperCase() + category.slice(1),
            fact: key,
            value,
          });
        }
      });
    }
  });

  // Extract missing facts from constraints
  const missingFacts = currentFacts.constraints?.missing || [];

  // Extract readiness delta from latest node
  const readinessDelta = latestNode?.executionResult.executionMetadata.readinessDelta || [];

  // Collapsed state - minimal toggle button
  if (isCollapsed && !isManuallyExpanded) {
    return (
      <Box sx={{ 
        width: 48, 
        borderLeft: '1px solid', 
        borderColor: 'divider', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        backgroundColor: 'background.paper',
        py: 2,
      }}>
        <Tooltip title="Show readiness" placement="left">
          <IconButton 
            size="small" 
            onClick={() => setIsManuallyExpanded(true)}
            sx={{ 
              transform: 'rotate(-90deg)',
              mb: 2,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', letterSpacing: 1 }}>
              READY
            </Typography>
          </IconButton>
        </Tooltip>
        
        {/* Summary badges (vertical) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
          <Tooltip title={`${knownFacts.length} facts known`} placement="left">
            <Chip 
              icon={<CheckCircleIcon />}
              label={knownFacts.length} 
              size="small" 
              sx={{ height: 24, '& .MuiChip-label': { px: 1 } }}
            />
          </Tooltip>
          <Tooltip title={`${missingFacts.length} still needed`} placement="left">
            <Chip 
              icon={<HelpOutlineIcon />}
              label={missingFacts.length} 
              size="small" 
              color="warning"
              sx={{ height: 24, '& .MuiChip-label': { px: 1 } }}
            />
          </Tooltip>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: 320, borderLeft: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Readiness
        </Typography>
        {isCollapsed && (
          <Tooltip title="Hide readiness" placement="left">
            <IconButton size="small" onClick={() => setIsManuallyExpanded(false)}>
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {/* Known So Far */}
        <Accordion defaultExpanded disableGutters elevation={0} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon fontSize="small" sx={{ color: 'secondary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Known so far
              </Typography>
              <Chip 
                label={knownFacts.length} 
                size="small" 
                sx={{ 
                  backgroundColor: 'rgba(34, 211, 238, 0.15)', 
                  color: 'secondary.main',
                  fontWeight: 600,
                }} 
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {knownFacts.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Nothing captured yet
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {knownFacts.map((item, index) => (
                  <Box key={index}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', display: 'block', mb: 0.5 }}>
                      {item.category}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {item.fact}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFactValue(item.value)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        {/* Still Needed */}
        <Accordion disableGutters elevation={0} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HelpOutlineIcon fontSize="small" sx={{ color: 'warning.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Still needed
              </Typography>
              <Chip label={missingFacts.length} size="small" color="warning" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {missingFacts.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                All required information captured
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {missingFacts.map((fact, index) => (
                  <Chip
                    key={index}
                    label={fact}
                    size="small"
                    variant="outlined"
                    sx={{ justifyContent: 'flex-start' }}
                  />
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        {/* Unlocks (Readiness Delta) */}
        <Accordion disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LockOpenIcon fontSize="small" sx={{ color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Unlocks
              </Typography>
              <Chip 
                label={readinessDelta.length} 
                size="small" 
                sx={{ 
                  backgroundColor: 'rgba(100, 116, 139, 0.15)', 
                  color: 'primary.main',
                  fontWeight: 600,
                }} 
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {readinessDelta.length === 0 ? (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No new capabilities unlocked
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {readinessDelta.map((unlock, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1,
                      borderRadius: 1,
                      backgroundColor: 'success.lighter',
                      border: '1px solid',
                      borderColor: 'success.light',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 500 }}>
                      {unlock}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

