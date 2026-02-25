import React, { useRef, useState, useEffect } from 'react';
import { Box, TextField, TextFieldProps, Chip, Typography } from '@mui/material';

interface RichTextFieldProps extends Omit<TextFieldProps, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Parse text with {{variables}} into segments
 */
const parseText = (text: string): Array<{ type: 'text' | 'variable'; content: string }> => {
  const regex = /\{\{([^}]+)\}\}/g;
  const segments: Array<{ type: 'text' | 'variable'; content: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the variable
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    // Add the variable
    segments.push({ type: 'variable', content: match[1] });
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
};

/**
 * Convert snake_case to Title Case for display
 */
const toTitleCase = (snakeCase: string): string => {
  return snakeCase
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * A rich text field that displays variables as chips and accepts drag-and-drop
 */
export const RichTextField: React.FC<RichTextFieldProps> = ({
  value,
  onChange,
  placeholder,
  multiline,
  rows,
  label,
  helperText,
  ...textFieldProps
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const factName = e.dataTransfer.getData('text/plain');
    if (!factName) return;

    // Insert the variable at the end or at cursor position if in edit mode
    const variable = `{{${factName}}}`;
    const newValue = value + (value && !value.endsWith(' ') ? ' ' : '') + variable + ' ';
    onChange(newValue);
  };

  const handleRemoveVariable = (variableToRemove: string) => {
    const pattern = new RegExp(`\\{\\{${variableToRemove}\\}\\}\\s?`, 'g');
    const newValue = value.replace(pattern, '');
    onChange(newValue);
  };

  const segments = parseText(value);
  const hasContent = segments.length > 0 && !(segments.length === 1 && segments[0].content === '');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {label && (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
          {label}
        </Typography>
      )}
      
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          position: 'relative',
          minHeight: multiline ? (rows ? rows * 24 + 32 : 80) : 56,
          border: '1px solid',
          borderColor: isDragOver ? 'primary.main' : 'divider',
          borderRadius: 1,
          bgcolor: isDragOver ? 'rgba(34, 211, 238, 0.05)' : 'background.paper',
          p: 1.5,
          transition: 'all 0.2s',
          cursor: 'text',
          '&:hover': {
            borderColor: 'text.primary',
          },
        }}
        onClick={() => {
          if (!isEditing) {
            setIsEditing(true);
          }
        }}
      >
        {isDragOver && (
          <Box
            sx={{
              position: 'absolute',
              inset: 8,
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(34, 211, 238, 0.08)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
              Drop here
            </Typography>
          </Box>
        )}

        {isEditing ? (
          <TextField
            {...textFieldProps}
            inputRef={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => {
              setIsEditing(false);
              onChange(editValue);
            }}
            autoFocus
            fullWidth
            multiline={multiline}
            rows={rows}
            variant="standard"
            placeholder={placeholder}
            InputProps={{
              disableUnderline: true,
            }}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: 'inherit',
              },
            }}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              alignItems: 'center',
              minHeight: multiline ? (rows ? rows * 24 : 48) : 24,
            }}
          >
            {hasContent ? (
              segments.map((segment, index) =>
                segment.type === 'variable' ? (
                  <Chip
                    key={`${segment.content}-${index}`}
                    label={toTitleCase(segment.content)}
                    size="small"
                    onDelete={() => handleRemoveVariable(segment.content)}
                    sx={{
                      height: 24,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      fontWeight: 500,
                      '& .MuiChip-deleteIcon': {
                        color: 'primary.contrastText',
                        '&:hover': {
                          color: 'primary.contrastText',
                          opacity: 0.8,
                        },
                      },
                    }}
                  />
                ) : (
                  <Typography
                    key={`text-${index}`}
                    component="span"
                    sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                  >
                    {segment.content}
                  </Typography>
                )
              )
            ) : (
              <Typography
                component="span"
                sx={{ color: 'text.disabled', fontStyle: 'italic' }}
              >
                {placeholder || 'Click to edit or drag facts here'}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {helperText && (
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};






