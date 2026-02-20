import React, { useRef, useState } from 'react';
import { TextField, TextFieldProps, Box } from '@mui/material';

interface DroppableTextFieldProps extends Omit<TextFieldProps, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * A text field that accepts drag-and-drop of fact/variable names
 * and automatically wraps them in {{brackets}}
 */
export const DroppableTextField: React.FC<DroppableTextFieldProps> = ({
  value,
  onChange,
  placeholder,
  ...textFieldProps
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

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

    // Get current cursor position or use saved position
    const input = inputRef.current;
    const position = input?.selectionStart ?? cursorPosition ?? value.length;

    // Insert the variable at cursor position
    const variable = `{{${factName}}}`;
    const newValue = 
      value.slice(0, position) + 
      variable + 
      value.slice(position);

    onChange(newValue);

    // Set cursor after the inserted variable
    setTimeout(() => {
      if (input) {
        const newPosition = position + variable.length;
        input.focus();
        input.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    setCursorPosition(input.selectionStart ?? 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart ?? 0);
  };

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        position: 'relative',
        '&::after': isDragOver ? {
          content: '""',
          position: 'absolute',
          inset: 0,
          border: '2px dashed',
          borderColor: 'primary.main',
          borderRadius: 1,
          pointerEvents: 'none',
          bgcolor: 'rgba(34, 211, 238, 0.05)',
        } : undefined,
      }}
    >
      <TextField
        {...textFieldProps}
        inputRef={inputRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        placeholder={placeholder}
        fullWidth
      />
    </Box>
  );
};





