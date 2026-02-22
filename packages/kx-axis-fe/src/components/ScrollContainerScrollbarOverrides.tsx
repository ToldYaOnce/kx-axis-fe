import { GlobalStyles } from '@mui/material';

/**
 * Global scrollbar overrides specifically for the canvas scroll-container.
 * Must be mounted once at app root, after CssBaseline.
 * 
 * This ensures scrollbars are always visible and cannot be overridden by theme.
 */
export function ScrollContainerScrollbarOverrides() {
  return (
    <GlobalStyles
      styles={{
        'div[data-kx="scroll-container"]': {
          scrollbarWidth: 'auto',
          scrollbarColor: 'rgba(255,255,255,0.45) rgba(0,0,0,0.35)',
        },

        'div[data-kx="scroll-container"]::-webkit-scrollbar': {
          height: '16px',
          width: '16px',
          display: 'block',
        },

        'div[data-kx="scroll-container"]::-webkit-scrollbar-track': {
          backgroundColor: 'rgba(0,0,0,0.35)',
        },

        'div[data-kx="scroll-container"]::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(255,255,255,0.55)',
          borderRadius: '8px',
        },

        'div[data-kx="scroll-container"]::-webkit-scrollbar-thumb:hover': {
          backgroundColor: 'rgba(255,255,255,0.75)',
        },
      }}
    />
  );
}

