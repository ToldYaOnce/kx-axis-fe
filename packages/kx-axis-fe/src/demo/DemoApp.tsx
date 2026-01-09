import React from 'react';
import { KxAxisComposer } from '../components/KxAxisComposer';
import { goalGapDemoFlow } from './goalGapDemoData';
import type { ConversationFlow } from '../types';

export const DemoApp: React.FC = () => {
  const handleChange = (updatedConfig: ConversationFlow) => {
    console.log('Flow updated:', updatedConfig);
  };

  const handleValidate = () => {
    console.log('Validate clicked');
  };

  const handleSimulate = () => {
    console.log('Simulate clicked');
  };

  const handlePublish = (config: ConversationFlow) => {
    console.log('Publishing flow:', config);
    alert(`Flow "${config.name}" published successfully! Check console for details.`);
  };

  return (
    <KxAxisComposer
      initialConfig={goalGapDemoFlow}
      industryCaptureRegistry={undefined}
      onChange={handleChange}
      onValidate={handleValidate}
      onSimulate={handleSimulate}
      onPublish={handlePublish}
    />
  );
};


