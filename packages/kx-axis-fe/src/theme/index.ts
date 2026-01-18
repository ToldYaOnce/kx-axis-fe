// Theme configuration for KxAxis Composer
import { createTheme, Theme, ThemeOptions } from '@mui/material/styles';

/**
 * Default light theme for KxAxis Composer
 * Minimal, flat design with calm colors
 */
export const defaultLightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#FAFAFA', // Light canvas
      paper: '#FFFFFF',   // White cards
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
    },
    divider: '#E0E0E0',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // Light theme scrollbars
          '*::-webkit-scrollbar': {
            width: '10px',
            height: '10px',
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            borderRadius: '5px',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
          },
          '*::-webkit-scrollbar-thumb:active': {
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
          },
          // Firefox scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.15) transparent',
        },
      },
    },
  },
});

/**
 * KxGrynde-compatible theme
 * Professional dark-on-light design with strategic accent colors
 */
export const kxgryndeTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5A6B7D', // Blue slate (professional, soothing)
      light: '#718096',
      dark: '#2D3748',
    },
    secondary: {
      main: '#39D0C9', // Cyan (fresh, energetic accent)
      light: '#5FE3DD',
      dark: '#1FA19A',
    },
    background: {
      default: '#121212', // Dark canvas (elegant, consistent)
      paper: '#1B1B1B',   // Jet black cards (slightly lighter than canvas)
    },
    text: {
      primary: '#FFFFFF',    // White text on dark cards
      secondary: '#A0AEC0',  // Light blue-gray for secondary text on dark
      disabled: '#718096',
    },
    divider: '#3A3A3C',
    error: {
      main: '#FF0059', // Magenta for errors/destructive actions
    },
    success: {
      main: '#39D0C9', // Cyan for success
    },
    warning: {
      main: '#A78BFA', // Soft purple for warnings
    },
    info: {
      main: '#5A6B7D', // Blue slate for info
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontFamily: "'Inter', sans-serif", letterSpacing: '-0.5px', fontWeight: 700 },
    h2: { fontFamily: "'Inter', sans-serif", letterSpacing: '-0.5px', fontWeight: 700 },
    h3: { fontFamily: "'Inter', sans-serif", letterSpacing: '-0.25px', fontWeight: 600 },
    h4: { fontFamily: "'Inter', sans-serif", letterSpacing: '-0.25px', fontWeight: 600 },
    h5: { fontFamily: "'Inter', sans-serif", letterSpacing: '0px', fontWeight: 600 },
    h6: { fontFamily: "'Inter', sans-serif", letterSpacing: '0px', fontWeight: 600 },
    button: { fontFamily: "'Inter', sans-serif", fontWeight: 500, letterSpacing: '0.25px' },
    body1: { fontFamily: "'Inter', sans-serif" },
    body2: { fontFamily: "'Inter', sans-serif" },
    caption: { fontFamily: "'Inter', sans-serif", letterSpacing: '0.25px' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          fontWeight: 500,
          '&:focus': {
            outline: 'none',
            boxShadow: 'none',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#1B1B1B', // Force dark cards
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#1B1B1B',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 6,
        },
        filled: {
          backgroundColor: '#2D3748',
          color: '#E2E8F0',
          '&:hover': {
            backgroundColor: '#4A5568',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: '#A0AEC0', // text.secondary
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#39D0C9', // secondary.main (cyan)
          },
          '& .MuiInputBase-input': {
            color: '#FFFFFF', // text.primary
          },
          '& .MuiFormHelperText-root': {
            color: '#718096', // text.disabled
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3A3A3C', // divider
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#5A6B7D', // primary.main
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#39D0C9', // secondary.main (cyan)
          },
        },
        input: {
          color: '#FFFFFF', // text.primary
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          // Default icon color for dark theme
          color: '#A0AEC0', // text.secondary (light blue-gray)
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#A0AEC0', // text.secondary
          '&:hover': {
            color: '#FFFFFF', // text.primary on hover
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          color: '#FFFFFF', // text.primary
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          '& .MuiAccordionSummary-expandIconWrapper': {
            color: '#A0AEC0', // text.secondary
          },
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1B1B1B',
          backgroundImage: 'none',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // Elegant dark scrollbars
          '*::-webkit-scrollbar': {
            width: '10px',
            height: '10px',
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '5px',
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
          },
          '*::-webkit-scrollbar-thumb:active': {
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
          },
          // Firefox scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.15) transparent',
        },
      },
    },
  },
});

/**
 * Create a custom theme by merging with defaults
 */
export function createKxAxisTheme(options?: ThemeOptions): Theme {
  return createTheme(options || defaultLightTheme);
}

// Export default
export default defaultLightTheme;

