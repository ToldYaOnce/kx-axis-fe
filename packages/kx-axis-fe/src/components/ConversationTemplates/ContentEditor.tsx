import React, { useState, useRef } from 'react';
import { Box, Chip, Typography, InputBase } from '@mui/material';

interface Segment {
  id: string;
  type: 'text' | 'variable';
  content: string;
}

interface ContentEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helperText?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

/**
 * Parse text with {{variables}} into segments
 */
const parseToSegments = (text: string): Segment[] => {
  if (!text) return [];
  
  const regex = /\{\{([^}]+)\}\}/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match;
  let id = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the variable
    if (match.index > lastIndex) {
      segments.push({ 
        id: `text-${id++}`, 
        type: 'text', 
        content: text.slice(lastIndex, match.index) 
      });
    }
    // Add the variable
    segments.push({ 
      id: `var-${id++}`, 
      type: 'variable', 
      content: match[1] 
    });
    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ 
      id: `text-${id++}`, 
      type: 'text', 
      content: text.slice(lastIndex) 
    });
  }

  return segments;
};

/**
 * Convert segments back to string
 */
const segmentsToString = (segments: Segment[]): string => {
  return segments.map(seg => 
    seg.type === 'variable' ? `{{${seg.content}}}` : seg.content
  ).join('');
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
 * Content editor with inline drop zones between segments
 */
export const ContentEditor: React.FC<ContentEditorProps> = ({
  value,
  onChange,
  label,
  helperText,
  placeholder,
  multiline,
  rows,
}) => {
  const [segments, setSegments] = useState<Segment[]>(() => parseToSegments(value));
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [currentText, setCurrentText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const lastValueRef = useRef(value);

  // Sync segments when value changes
  React.useEffect(() => {
    // Always parse the value to show variables as chips
    const parsed = parseToSegments(value);
    const segmentsText = segmentsToString(parsed);
    
    // If the parsed value equals the full value, it means everything has been parsed
    // and we should clear the input (currentText)
    if (segmentsText === value) {
      setSegments(parsed);
      setCurrentText('');
    } else {
      // Value has extra text after the segments - keep it in currentText
      const remainingText = value.substring(segmentsText.length);
      setSegments(parsed);
      setCurrentText(remainingText);
    }
    
    lastValueRef.current = value;
  }, [value]);

  const updateValueFromSegments = (newSegments: Segment[]) => {
    setSegments(newSegments);
    onChange(segmentsToString(newSegments));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(null);

    const factName = e.dataTransfer.getData('text/plain');
    if (!factName) return;

    let newSegments = [...segments];
    
    // If there's current text, add it as a segment at the end first
    if (currentText.trim()) {
      newSegments.push({ id: `text-${Date.now()}`, type: 'text', content: currentText });
      setCurrentText('');
    }

    // Insert variable at the specific index
    const newVariable: Segment = {
      id: `var-${Date.now()}`,
      type: 'variable',
      content: factName,
    };

    newSegments.splice(index, 0, newVariable);
    updateValueFromSegments(newSegments);

    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleRemoveSegment = (id: string) => {
    const newSegments = segments.filter(seg => seg.id !== id);
    updateValueFromSegments(newSegments);
    
    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setCurrentText(newText);
    
    // Combine segments with current text for the full value
    const fullText = segmentsToString(segments) + newText;
    onChange(fullText);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {label && (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
          {label}
        </Typography>
      )}
      
      <Box
        sx={{
          minHeight: multiline ? (rows ? rows * 24 + 32 : 80) : 56,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          p: 1.5,
          transition: 'all 0.2s',
          cursor: 'text',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          alignItems: 'center',
          '&:hover': {
            borderColor: 'text.primary',
          },
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Drop zone at the beginning */}
        <Box
          onDragOver={(e) => handleDragOver(e, 0)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 0)}
          sx={{
            width: dragOverIndex === 0 ? 40 : 4,
            height: 24,
            transition: 'width 0.2s',
            flexShrink: 0,
          }}
        >
          {dragOverIndex === 0 && (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 0.5,
                bgcolor: 'rgba(34, 211, 238, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ width: 2, height: 16, bgcolor: 'primary.main' }} />
            </Box>
          )}
        </Box>

        {/* Render existing segments */}
        {segments.map((segment, index) => (
          <React.Fragment key={segment.id}>
            {segment.type === 'variable' ? (
              <Chip
                label={toTitleCase(segment.content)}
                size="small"
                onDelete={() => handleRemoveSegment(segment.id)}
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
                component="span"
                sx={{
                  whiteSpace: 'pre-wrap',
                }}
              >
                {segment.content}
              </Typography>
            )}

            {/* Drop zone after each segment */}
            <Box
              onDragOver={(e) => handleDragOver(e, index + 1)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index + 1)}
              sx={{
                width: dragOverIndex === index + 1 ? 40 : 4,
                height: 24,
                transition: 'width 0.2s',
                flexShrink: 0,
              }}
            >
              {dragOverIndex === index + 1 && (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 0.5,
                    bgcolor: 'rgba(34, 211, 238, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box sx={{ width: 2, height: 16, bgcolor: 'primary.main' }} />
                </Box>
              )}
            </Box>
          </React.Fragment>
        ))}

        {/* Always-visible text input */}
        <InputBase
          inputRef={inputRef}
          value={currentText}
          onChange={handleTextChange}
          placeholder={segments.length === 0 ? (placeholder || 'Type here or drag facts') : ''}
          multiline={multiline}
          sx={{
            flex: 1,
            minWidth: 100,
            '& input, & textarea': {
              padding: 0,
            },
          }}
        />
      </Box>

      {helperText && (
        <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};
