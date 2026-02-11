import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Paper,
  Divider,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MessageIcon from '@mui/icons-material/Message';
import LabelIcon from '@mui/icons-material/Label';
import TuneIcon from '@mui/icons-material/Tune';
import StorageIcon from '@mui/icons-material/Storage';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { templatesAPI } from '../api/templatesClient';
import { AVAILABLE_VARIABLES } from '../types/templates';
import type { ConversationTemplate } from '../types/templates';
import { ContentEditor } from '../components/ConversationTemplates/ContentEditor';
import { FactsPalette } from '../components/ConversationTemplates/FactsPalette';

const NODE_TYPES = [
  'BASELINE_CAPTURE',
  'ACTION_BOOKING',
  'EXPLANATION',
  'REFLECTIVE_QUESTION',
  'GOAL_GAP_TRACKER',
  'HANDOFF',
];

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

/**
 * Convert user-friendly text to snake_case
 * e.g., "Contact Email" → "contact_email"
 */
const toSnakeCase = (text: string): string => {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_');   // Replace spaces with underscores
};

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

export const ConversationTemplateEditRoute: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const isNew = templateId === 'new';

  const [template, setTemplate] = useState<ConversationTemplate>({
    nodeType: '',
    description: '',
    explanation: '',
    ack: '',
    permission: '',
    isSpecialNode: false,
    skipLLM: true,
    suppressAck: false,
    producesFacts: [],
    optionalFacts: [],
    variables: [],
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newRequiredFact, setNewRequiredFact] = useState('');
  const [newOptionalFact, setNewOptionalFact] = useState('');
  
  // Multiple reasons support
  const [reasons, setReasons] = useState<string[]>([]);

  // Load existing template
  useEffect(() => {
    if (!isNew && templateId) {
      loadTemplate(templateId);
    }
  }, [templateId, isNew]);

  const loadTemplate = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await templatesAPI.get(id);
      setTemplate(data);
      
      // Parse explanation into reasons array (split by newlines or bullets)
      if (data.explanation) {
        const parsedReasons = data.explanation
          .split(/\n+/)
          .map(r => r.trim().replace(/^[-•*]\s*/, ''))
          .filter(r => r.length > 0);
        setReasons(parsedReasons.length > 0 ? parsedReasons : []);
      } else {
        setReasons([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Combine reasons into explanation with newlines
      const combinedExplanation = reasons.filter(r => r.trim()).join('\n');

      if (isNew) {
        const created = await templatesAPI.create({
          nodeType: template.nodeType,
          description: template.description,
          isSpecialNode: template.isSpecialNode,
          skipLLM: template.skipLLM,
        });
        // Navigate to edit the newly created template
        navigate(`/conversation-item-templates/${created.id}`, { replace: true });
      } else if (templateId) {
        await templatesAPI.update(templateId, {
          ack: template.ack,
          explanation: combinedExplanation,
          permission: template.permission,
          description: template.description,
          nodeType: template.nodeType,
          isSpecialNode: template.isSpecialNode,
          suppressAck: template.suppressAck,
          skipLLM: template.skipLLM,
          producesFacts: template.producesFacts,
          optionalFacts: template.optionalFacts,
          targetFactId: template.targetFactId,
          variables: template.variables,
          metadata: template.metadata,
        });
        // Reload to get updated data
        await loadTemplate(templateId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!templateId || isNew) return;
    
    try {
      setSaving(true);
      await templatesAPI.delete(templateId);
      navigate('/conversation-item-templates');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
      setSaving(false);
    }
  };

  const handleAddRequiredFact = () => {
    if (newRequiredFact.trim()) {
      const snakeCaseFact = toSnakeCase(newRequiredFact);
      if (!template.producesFacts?.includes(snakeCaseFact)) {
        setTemplate({
          ...template,
          producesFacts: [...(template.producesFacts || []), snakeCaseFact],
        });
        setNewRequiredFact('');
      }
    }
  };

  const handleAddOptionalFact = () => {
    if (newOptionalFact.trim()) {
      const snakeCaseFact = toSnakeCase(newOptionalFact);
      if (!template.optionalFacts?.includes(snakeCaseFact)) {
        setTemplate({
          ...template,
          optionalFacts: [...(template.optionalFacts || []), snakeCaseFact],
        });
        setNewOptionalFact('');
      }
    }
  };

  const handleRemoveRequiredFact = (fact: string) => {
    setTemplate({
      ...template,
      producesFacts: template.producesFacts?.filter((f) => f !== fact),
    });
  };

  const handleRemoveOptionalFact = (fact: string) => {
    setTemplate({
      ...template,
      optionalFacts: template.optionalFacts?.filter((f) => f !== fact),
    });
  };

  const handleAddReason = () => {
    setReasons([...reasons, '']);
  };

  const handleUpdateReason = (index: number, value: string) => {
    const updated = [...reasons];
    updated[index] = value;
    setReasons(updated);
  };

  const handleRemoveReason = (index: number) => {
    setReasons(reasons.filter((_, i) => i !== index));
  };

  const getPreviewMessage = () => {
    let message = '';
    if (template.ack) message += template.ack + '. ';
    
    // Include all reasons
    const validReasons = reasons.filter(r => r.trim());
    if (validReasons.length > 0) {
      message += validReasons.join(' ');
    }
    
    if (template.permission) message += ', ' + template.permission;
    return message || 'No message configured yet';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/conversation-item-templates')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {isNew ? 'Create Template' : 'Edit Template'}
            </Typography>
            {template.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {template.description}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isNew && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              disabled={saving}
            >
              Delete
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !template.nodeType}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Message Components */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <MessageIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Message Components
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {/* Left/Right Layout: Facts Palette | Message Fields */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            {/* Left: Facts Palette - Drag Source */}
            <Box sx={{ width: 300, flexShrink: 0 }}>
              <FactsPalette
                producesFacts={template.producesFacts}
                optionalFacts={template.optionalFacts}
                showSystemVariables={true}
              />
            </Box>

            {/* Right: Message Fields - Drop Targets */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <ContentEditor
                label="Acknowledgment (optional)"
                placeholder="Got it - drag facts here"
                value={template.ack || ''}
                onChange={(value) => setTemplate({ ...template, ack: value })}
                multiline
                rows={2}
                helperText="Acknowledge what the user just said"
              />

              {/* Multiple Reasons */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Reason/justification this info is needed (optional)
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddReason}
                    variant="outlined"
                  >
                    Add Reason
                  </Button>
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
                  If the user questions why this is being asked, tell them this. You can provide multiple reasons.
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {reasons.length === 0 && (
                    <Box 
                      sx={{ 
                        p: 3, 
                        border: '1px dashed', 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        textAlign: 'center',
                        color: 'text.secondary',
                        fontStyle: 'italic',
                      }}
                    >
                      No reasons added yet. Click "Add Reason" to start.
                    </Box>
                  )}
                  {reasons.map((reason, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Typography variant="body2" sx={{ mt: 2, minWidth: 20, color: 'text.secondary' }}>
                        {index + 1}.
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <ContentEditor
                          placeholder="To send you your personalized program, I need your contact info"
                          value={reason}
                          onChange={(value) => handleUpdateReason(index, value)}
                          multiline
                          rows={2}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveReason(index)}
                        sx={{ mt: 1 }}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>

              <ContentEditor
                label="Permission (trailing clause)"
                placeholder="if that works for you"
                value={template.permission || ''}
                onChange={(value) => setTemplate({ ...template, permission: value })}
                helperText="Optional trailing permission/invitation clause"
              />
            </Box>
          </Box>
        </Paper>

        {/* Identity */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LabelIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Identity
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth required>
              <InputLabel>Node Type</InputLabel>
              <Select
                value={template.nodeType || ''}
                onChange={(e) => setTemplate({ ...template, nodeType: e.target.value })}
              >
                {NODE_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {formatNodeType(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Description"
              placeholder="Contact capture for fitness coaching"
              value={template.description || ''}
              onChange={(e) => setTemplate({ ...template, description: e.target.value })}
              fullWidth
              helperText="Human-readable description of what this template does"
            />
          </Box>
        </Paper>

        {/* Behavior */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TuneIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Behavior
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={template.skipLLM || false}
                  onChange={(e) => setTemplate({ ...template, skipLLM: e.target.checked })}
                />
              }
              label="Skip LLM (use template directly - recommended for admin flows)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={template.suppressAck || false}
                  onChange={(e) => setTemplate({ ...template, suppressAck: e.target.checked })}
                />
              }
              label="Suppress acknowledgment on next turn"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={template.isSpecialNode || false}
                  onChange={(e) => setTemplate({ ...template, isSpecialNode: e.target.checked })}
                />
              }
              label="Special node (requires this template)"
            />
          </Box>
        </Paper>

        {/* Context */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <StorageIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Context & Facts
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Required Facts (Produces Facts) */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Produces Facts (Required)
              </Typography>
              <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'text.secondary' }}>
                Facts that must be collected for this conversation item to be fulfilled
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {template.producesFacts?.map((fact) => (
                  <Chip
                    key={fact}
                    label={toTitleCase(fact)}
                    onDelete={() => handleRemoveRequiredFact(fact)}
                    size="small"
                    color="primary"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Enter fact (e.g., Contact Email)"
                  value={newRequiredFact}
                  onChange={(e) => setNewRequiredFact(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRequiredFact()}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddRequiredFact}
                >
                  Add
                </Button>
              </Box>
            </Box>

            {/* Optional Facts (Nice to Have) */}
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Optional Facts (Nice to Have)
              </Typography>
              <Typography variant="caption" sx={{ mb: 2, display: 'block', color: 'text.secondary' }}>
                Facts that are helpful but not required for completion
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {template.optionalFacts?.map((fact) => (
                  <Chip
                    key={fact}
                    label={toTitleCase(fact)}
                    onDelete={() => handleRemoveOptionalFact(fact)}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Enter fact (e.g., Preferred Time)"
                  value={newOptionalFact}
                  onChange={(e) => setNewOptionalFact(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddOptionalFact()}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddOptionalFact}
                >
                  Add
                </Button>
              </Box>
            </Box>

            {/* Target Fact */}
            <FormControl fullWidth>
              <InputLabel>Target Fact (primary)</InputLabel>
              <Select
                value={template.targetFactId || ''}
                onChange={(e) => setTemplate({ ...template, targetFactId: e.target.value })}
              >
                <MenuItem value="">None</MenuItem>
                {template.producesFacts?.map((fact) => (
                  <MenuItem key={fact} value={fact}>
                    {toTitleCase(fact)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Preview */}
        <Paper sx={{ p: 3, bgcolor: 'rgba(34, 211, 238, 0.05)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <VisibilityIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Preview
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Typography
            variant="body1"
            sx={{
              fontStyle: 'italic',
              color: 'text.secondary',
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {getPreviewMessage()}
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            Note: Variables will be substituted at runtime
          </Typography>
        </Paper>
      </Box>

        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Template?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this template? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

