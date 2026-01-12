import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Popover,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Button,
  Divider,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';

interface ChipListEditorProps {
  label: string;
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder?: string;
  suggestions?: Array<{ value: string; label: string; description?: string }>;
  allowCustom?: boolean;
  emptyText?: string;
  compact?: boolean;
  helperText?: string;
}

export const ChipListEditor: React.FC<ChipListEditorProps> = ({
  label,
  values,
  onAdd,
  onRemove,
  placeholder = 'Add item',
  suggestions = [],
  allowCustom = false,
  emptyText = '— None —',
  compact = false,
  helperText,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [customValue, setCustomValue] = useState('');

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setCustomValue('');
  };

  const handleAddSuggestion = (value: string) => {
    onAdd(value);
    handleClosePopover();
  };

  const handleAddCustom = () => {
    if (customValue.trim()) {
      onAdd(customValue.trim());
      handleClosePopover();
    }
  };

  const handleRemove = (event: React.MouseEvent, value: string) => {
    event.stopPropagation();
    onRemove(value);
  };

  const popoverOpen = Boolean(anchorEl);
  const availableSuggestions = suggestions.filter((s) => !values.includes(s.value));

  return (
    <Box sx={{ mt: compact ? 1 : 1.5, pt: compact ? 1 : 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
      <Typography
        variant="caption"
        sx={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'text.secondary',
          display: 'block',
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
        {values.length === 0 && (
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.7rem',
              color: 'text.disabled',
              fontStyle: 'italic',
            }}
          >
            {emptyText}
          </Typography>
        )}

        {values.map((value) => (
          <Chip
            key={value}
            label={value}
            size="small"
            onDelete={(e) => handleRemove(e, value)}
            deleteIcon={<CloseIcon sx={{ fontSize: '0.9rem' }} />}
            sx={{
              height: 20,
              fontSize: '0.65rem',
              fontWeight: 500,
              backgroundColor: 'transparent',
              border: '1px solid',
              borderColor: 'divider',
              color: 'text.secondary',
              '& .MuiChip-deleteIcon': {
                color: 'text.disabled',
                '&:hover': {
                  color: 'text.secondary',
                },
              },
            }}
          />
        ))}

        <IconButton
          size="small"
          onClick={handleOpenPopover}
          sx={{
            width: 20,
            height: 20,
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
              backgroundColor: 'action.hover',
            },
          }}
        >
          <AddCircleOutlineIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      </Box>

      {helperText && (
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            color: 'text.disabled',
            fontStyle: 'italic',
            display: 'block',
            mt: 0.5,
          }}
        >
          {helperText}
        </Typography>
      )}

      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Box sx={{ py: 0.5, minWidth: 200, maxWidth: 300 }}>
          {availableSuggestions.length > 0 && (
            <List dense sx={{ py: 0 }}>
              {availableSuggestions.map((suggestion) => (
                <ListItemButton
                  key={suggestion.value}
                  onClick={() => handleAddSuggestion(suggestion.value)}
                  sx={{ py: 1, px: 2 }}
                >
                  <ListItemText
                    primary={suggestion.label}
                    secondary={suggestion.description}
                    primaryTypographyProps={{
                      variant: 'body2',
                      sx: { fontSize: '0.8rem', fontWeight: 500 },
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      sx: { fontSize: '0.7rem' },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}

          {allowCustom && (
            <>
              {availableSuggestions.length > 0 && <Divider sx={{ my: 0.5 }} />}
              <Box sx={{ p: 2 }}>
                <TextField
                  autoFocus
                  fullWidth
                  size="small"
                  placeholder={placeholder}
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCustom();
                    }
                  }}
                  sx={{ mb: 1 }}
                />
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  onClick={handleAddCustom}
                  disabled={!customValue.trim()}
                >
                  Add
                </Button>
              </Box>
            </>
          )}

          {availableSuggestions.length === 0 && !allowCustom && (
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                No items available
              </Typography>
            </Box>
          )}
        </Box>
      </Popover>
    </Box>
  );
};

