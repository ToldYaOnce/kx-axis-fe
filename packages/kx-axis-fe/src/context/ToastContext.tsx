import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertColor, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button 
} from '@mui/material';

interface ToastContextValue {
  showToast: (message: string, severity?: AlertColor) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  resolve: ((value: boolean) => void) | null;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    title: 'Confirm',
    message: '',
    resolve: null,
  });

  const showToast = useCallback((message: string, severity: AlertColor = 'info') => {
    setToast({
      open: true,
      message,
      severity,
    });
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, 'error');
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast(message, 'warning');
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast(message, 'info');
  }, [showToast]);

  const showConfirm = useCallback((message: string, title: string = 'Confirm'): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirm({
        open: true,
        title,
        message,
        resolve,
      });
    });
  }, []);

  const handleToastClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const handleConfirmClose = useCallback((result: boolean) => {
    if (confirm.resolve) {
      confirm.resolve(result);
    }
    setConfirm({
      open: false,
      title: 'Confirm',
      message: '',
      resolve: null,
    });
  }, [confirm.resolve]);

  const value: ToastContextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleToastClose} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirm.open}
        onClose={() => handleConfirmClose(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">{confirm.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            {confirm.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmClose(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={() => handleConfirmClose(true)} color="primary" variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

