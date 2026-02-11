import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { TemplateCard } from '../components/ConversationTemplates/TemplateCard';
import { templatesAPI } from '../api/templatesClient';
import { INDUSTRIES } from '../utils/conversationItems';
import type { ConversationTemplate } from '../types/templates';

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

export const ConversationTemplatesListRoute: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ConversationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templatesAPI.list();
      console.log('📋 Templates loaded:', data);
      
      // Ensure we have an array
      if (!Array.isArray(data)) {
        console.error('Templates API returned non-array:', data);
        setTemplates([]);
      } else {
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    // Navigate to create form (we'll handle this in the edit route)
    navigate('/conversation-item-templates/new');
  };

  const handleEdit = (templateId: string) => {
    navigate(`/conversation-item-templates/${templateId}`);
  };

  // Filter templates (with safety check)
  const filteredTemplates = (Array.isArray(templates) ? templates : []).filter((template) => {
    // Type filter
    if (typeFilter !== 'all' && template.nodeType !== typeFilter) {
      return false;
    }

    // Search query (searches in description, nodeType, explanation)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        template.description,
        template.nodeType,
        template.explanation,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      
      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Conversation Item Templates
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Configure runtime behavior and messaging for conversation transitions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          size="large"
        >
          New Template
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <MenuItem value="all">All Types</MenuItem>
            {NODE_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {formatNodeType(type)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Results Count */}
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
      </Typography>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            No templates found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            {searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first conversation template to get started'}
          </Typography>
          {!searchQuery && typeFilter === 'all' && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateNew}>
              Create Template
            </Button>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 3,
          }}
        >
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => handleEdit(template.id!)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

