import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Button,
  Tooltip,
} from '@mui/material';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import type { ConversationTemplate } from '../../types/templates';

interface TemplateCardProps {
  template: ConversationTemplate;
  onEdit: () => void;
}

const TYPE_ICONS: Record<string, string> = {
  'contact-capture': '📧',
  'fitness-assessment': '🏋️',
  'nutrition-preferences': '🍎',
  'injury-history': '🤕',
  'booking': '📅',
  'handoff': '🤝',
  'welcome-intro': 'ℹ️',
  'goal-gap-tracker': '🎯',
  'reflective-question': '💭',
};

/**
 * Convert node type to title case for display
 * e.g., "BASELINE_CAPTURE" → "Baseline Capture"
 */
const formatNodeType = (nodeType: string): string => {
  return nodeType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit }) => {
  const getTypeIcon = (type: string | undefined) => {
    if (!type) return '📄';
    return TYPE_ICONS[type] || '📄';
  };

  const displayTitle = template.description || template.nodeType || 'Untitled Template';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h4">{getTypeIcon(template.nodeType)}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            {displayTitle}
          </Typography>
        </Box>

        {/* Metadata Pills */}
        <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
          {template.nodeType && (
            <Chip label={formatNodeType(template.nodeType)} size="small" color="primary" variant="outlined" />
          )}
          {template.isSpecialNode && (
            <Chip label="Special" size="small" color="secondary" />
          )}
        </Box>

        {/* Explanation Preview */}
        {template.explanation && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              fontStyle: 'italic',
            }}
          >
            "{template.explanation}"
          </Typography>
        )}

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {template.skipLLM && (
            <Tooltip title="Template-based (no LLM call)">
              <Chip
                icon={<FlashOnIcon sx={{ fontSize: '1rem' }} />}
                label="Skip LLM"
                size="small"
                sx={{
                  bgcolor: 'rgba(34, 211, 238, 0.1)',
                  color: '#22d3ee',
                  fontWeight: 600,
                }}
              />
            </Tooltip>
          )}
          {template.variables && template.variables.length > 0 && (
            <Tooltip title={`Variables: ${template.variables.join(', ')}`}>
              <Chip
                icon={<CodeIcon sx={{ fontSize: '1rem' }} />}
                label={`${template.variables.length} var${template.variables.length > 1 ? 's' : ''}`}
                size="small"
              />
            </Tooltip>
          )}
          {template.requiredFacts && template.requiredFacts.length > 0 && (
            <Tooltip title={`Facts: ${template.requiredFacts.join(', ')}`}>
              <Chip
                icon={<StorageIcon sx={{ fontSize: '1rem' }} />}
                label={`${template.requiredFacts.length} fact${template.requiredFacts.length > 1 ? 's' : ''}`}
                size="small"
              />
            </Tooltip>
          )}
        </Box>
      </CardContent>

      <CardActions>
        <Button size="small" onClick={onEdit} fullWidth>
          Edit Template
        </Button>
      </CardActions>
    </Card>
  );
};

