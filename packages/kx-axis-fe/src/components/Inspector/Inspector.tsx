import React from 'react';
import { Box } from '@mui/material';
import { useFlow } from '../../context/FlowContext';
import { NodeInspector } from './NodeInspector';
import { CaptureInspector } from './CaptureInspector';
import { OverviewInspector } from './OverviewInspector';

export const Inspector: React.FC = () => {
  const { selection } = useFlow();

  return (
    <Box
      sx={{
        width: 360,
        flexShrink: 0,
        minWidth: 360,
        borderLeft: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      <Box sx={{ height: '100%', overflowY: 'auto', minWidth: 0 }}>
        {selection.type === 'node' && selection.id && <NodeInspector nodeId={selection.id} />}
        {selection.type === 'capture' && selection.id && (
          <CaptureInspector captureId={selection.id} />
        )}
        {selection.type === 'overview' && <OverviewInspector />}
      </Box>
    </Box>
  );
};


