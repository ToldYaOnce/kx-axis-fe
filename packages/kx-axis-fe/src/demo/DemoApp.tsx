import React, { useState } from 'react';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { KxAxisComposer } from '../components/KxAxisComposer';
import { ExecutionMode } from '../components/Simulator/ExecutionMode';
import { goalGapDemoFlow } from './goalGapDemoData';
import type { ConversationFlow } from '../types';

type AppMode = 'design' | 'execution';

export const DemoApp: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('design');

  const handleChange = (updatedConfig: ConversationFlow) => {
    console.log('Flow updated:', updatedConfig);
  };

  const handleValidate = () => {
    console.log('Validate clicked');
  };

  const handleSimulate = () => {
    // Switch to execution mode when simulate is clicked
    setMode('execution');
  };

  const handlePublish = (config: ConversationFlow) => {
    console.log('Publishing flow:', config);
    alert(`Flow "${config.name}" published successfully! Check console for details.`);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Mode Toggle */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, newMode) => newMode && setMode(newMode)}
          size="small"
        >
          <ToggleButton value="design">Design Mode</ToggleButton>
          <ToggleButton value="execution">Execution Mode</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {mode === 'design' ? (
          <KxAxisComposer
            initialConfig={goalGapDemoFlow}
            industryCaptureRegistry={undefined}
            onChange={handleChange}
            onValidate={handleValidate}
            onSimulate={handleSimulate}
            onPublish={handlePublish}
          />
        ) : (
          <ExecutionMode />
        )}
      </Box>
    </Box>
  );
};


