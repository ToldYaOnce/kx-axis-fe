import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Box, 
  ToggleButtonGroup, 
  ToggleButton, 
  IconButton, 
  Tooltip, 
  ThemeProvider, 
  CssBaseline,
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import { defaultLightTheme, kxgryndeTheme } from '../theme';
import { KxAxisRoutes } from '../routes';

type ThemeMode = 'default' | 'kxgrynde';

/**
 * Demo App with React Router
 * 
 * This demonstrates how to integrate KxAxis routes into an application
 */
export const DemoAppRouted: React.FC = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('kxgrynde');
  
  const activeTheme = themeMode === 'kxgrynde' ? kxgryndeTheme : defaultLightTheme;

  const handleThemeToggle = (_: React.MouseEvent<HTMLElement>, newTheme: ThemeMode | null) => {
    if (newTheme !== null) {
      setThemeMode(newTheme);
    }
  };

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Global App Bar */}
          <Box
            sx={{
              flexShrink: 0,  // Prevent header from shrinking
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Box>
              <h2 style={{ margin: 0 }}>KxAxis Demo</h2>
            </Box>

            {/* Theme Toggle */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Tooltip title="Toggle Theme">
                <IconButton onClick={() => setThemeMode(themeMode === 'default' ? 'kxgrynde' : 'default')}>
                  <PaletteIcon />
                </IconButton>
              </Tooltip>
              <ToggleButtonGroup
                value={themeMode}
                exclusive
                onChange={handleThemeToggle}
                size="small"
              >
                <ToggleButton value="default">Default</ToggleButton>
                <ToggleButton value="kxgrynde">KxGrynde</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Main Content Area */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'hidden', 
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <Routes>
              {/* KxAxis routes mounted at /flows */}
              <Route path="/flows/*" element={<KxAxisRoutes basePath="/flows" />} />
              
              {/* Default redirect to flows */}
              <Route path="/" element={<Navigate to="/flows" replace />} />
              <Route path="*" element={<Navigate to="/flows" replace />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
};

