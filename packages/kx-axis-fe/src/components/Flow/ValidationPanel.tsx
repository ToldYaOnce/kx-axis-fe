/**
 * ValidationPanel - Displays validation errors and warnings
 * 
 * MATCHES BACKEND VALIDATION RESPONSE SHAPE
 */

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { ValidateFlowResponse, ValidationError, ValidationWarning } from '../../types/flow-api';

export interface ValidationPanelProps {
  report: ValidateFlowResponse;
  onClose: () => void;
  onNodeClick?: (nodeId: string) => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ report, onClose, onNodeClick }) => {
  const errorCount = report.errors.length;
  const warningCount = report.warnings.length;

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        right: 16,
        top: 80,
        bottom: 16,
        width: 400,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: report.ok ? 'success.main' : 'error.main',
          color: '#FFFFFF',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {report.ok ? (
            <CheckCircleIcon />
          ) : (
            <ErrorIcon />
          )}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {report.ok ? 'Validation Passed' : 'Validation Failed'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#FFFFFF' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Summary */}
      {!report.ok && (
        <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {errorCount > 0 && (
              <Chip
                label={`${errorCount} error${errorCount > 1 ? 's' : ''}`}
                size="small"
                color="error"
              />
            )}
            {warningCount > 0 && (
              <Chip
                label={`${warningCount} warning${warningCount > 1 ? 's' : ''}`}
                size="small"
                color="warning"
              />
            )}
          </Box>
        </Box>
      )}

      <Divider />

      {/* Issues List */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {errorCount === 0 && warningCount === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No issues found. Your decision constraints are ready to publish!
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {/* Errors */}
            {report.errors.map((error, index) => (
              <ListItem
                key={`error-${index}`}
                alignItems="flex-start"
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'error.main',
                  cursor: error.nodeId && onNodeClick ? 'pointer' : 'default',
                  '&:hover': {
                    backgroundColor: error.nodeId && onNodeClick ? 'action.hover' : 'background.paper',
                  },
                }}
                onClick={() => {
                  if (error.nodeId && onNodeClick) {
                    onNodeClick(error.nodeId);
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  <ErrorIcon sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        label="Error"
                        size="small"
                        color="error"
                        sx={{ height: 20, fontSize: '0.75rem' }}
                      />
                      {error.nodeId && (
                        <Typography variant="caption" color="text.secondary">
                          Node: {error.nodeId}
                        </Typography>
                      )}
                      {error.field && (
                        <Typography variant="caption" color="text.secondary">
                          • {error.field}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.primary">
                      {error.message}
                    </Typography>
                  }
                />
              </ListItem>
            ))}

            {/* Warnings */}
            {report.warnings.map((warning, index) => (
              <ListItem
                key={`warning-${index}`}
                alignItems="flex-start"
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'warning.main',
                  cursor: warning.nodeId && onNodeClick ? 'pointer' : 'default',
                  '&:hover': {
                    backgroundColor: warning.nodeId && onNodeClick ? 'action.hover' : 'background.paper',
                  },
                }}
                onClick={() => {
                  if (warning.nodeId && onNodeClick) {
                    onNodeClick(warning.nodeId);
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  <WarningIcon sx={{ color: 'warning.main' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        label="Warning"
                        size="small"
                        color="warning"
                        sx={{ height: 20, fontSize: '0.75rem' }}
                      />
                      {warning.nodeId && (
                        <Typography variant="caption" color="text.secondary">
                          Node: {warning.nodeId}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.primary">
                      {warning.message}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Footer with Stats */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.default',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Stats: {report.stats.nodeCount} nodes, {report.stats.edgeCount} edges, {report.stats.factCount} facts
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Entry points: {report.stats.entryNodeCount}
        </Typography>
      </Box>
    </Paper>
  );
};
