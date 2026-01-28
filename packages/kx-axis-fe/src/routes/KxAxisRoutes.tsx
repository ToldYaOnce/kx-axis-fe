import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { FlowsListRoute } from './FlowsListRoute';
import { FlowDesignerRoute } from './FlowDesignerRoute';
import { FlowSimulatorRoute } from './FlowSimulatorRoute';
import { SimulationsListRoute } from './SimulationsListRoute';

export interface KxAxisRoutesProps {
  /**
   * Base path for all KxAxis routes (e.g., '/flows', '/kxaxis')
   * @default '/flows'
   */
  basePath?: string;
}

/**
 * Complete routing setup for KxAxis
 * 
 * Routes:
 * - / → Flows List
 * - /:flowId → Flow Designer
 * - /:flowId/simulations → Simulations List
 * - /:flowId/simulations/:simulationId → Flow Simulator (Execution Mode)
 * - /:flowId/versions/:versionId → Flow Designer (specific version)
 * 
 * Usage in consuming app:
 * ```tsx
 * import { BrowserRouter } from 'react-router-dom';
 * import { KxAxisRoutes } from '@toldyaonce/kx-axis-fe';
 * 
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <Routes>
 *         <Route path="/flows/*" element={<KxAxisRoutes basePath="/flows" />} />
 *       </Routes>
 *     </BrowserRouter>
 *   );
 * }
 * ```
 */
export const KxAxisRoutes: React.FC<KxAxisRoutesProps> = ({ 
  basePath = '/flows' 
}) => {
  return (
    <Routes>
      {/* Flows List */}
      <Route index element={<FlowsListRoute basePath={basePath} />} />
      
      {/* Flow Designer (current draft) */}
      <Route 
        path=":flowId" 
        element={<FlowDesignerRoute basePath={basePath} />} 
      />
      
      {/* Flow Designer (specific version) */}
      <Route 
        path=":flowId/versions/:versionId" 
        element={<FlowDesignerRoute basePath={basePath} />} 
      />
      
      {/* Simulations List */}
      <Route 
        path=":flowId/simulations" 
        element={<SimulationsListRoute basePath={basePath} />} 
      />
      
      {/* Flow Simulator (Execution Mode) */}
      <Route 
        path=":flowId/simulations/:simulationId" 
        element={<FlowSimulatorRoute basePath={basePath} />} 
      />
      
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to={basePath} replace />} />
    </Routes>
  );
};





