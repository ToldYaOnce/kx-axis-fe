import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface DraggableFactChipProps extends Omit<ChipProps, 'draggable'> {
  factName: string;
  label: string;
  tooltip?: string;
}

/**
 * A draggable chip representing a fact or variable that can be dropped into text fields
 */
export const DraggableFactChip: React.FC<DraggableFactChipProps> = ({
  factName,
  label,
  tooltip,
  ...chipProps
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', factName);
  };

  return (
    <Chip
      {...chipProps}
      icon={<DragIndicatorIcon sx={{ fontSize: 16 }} />}
      label={label}
      draggable
      onDragStart={handleDragStart}
      title={tooltip}
      sx={{
        cursor: 'grab',
        '&:active': {
          cursor: 'grabbing',
        },
        ...chipProps.sx,
      }}
    />
  );
};


