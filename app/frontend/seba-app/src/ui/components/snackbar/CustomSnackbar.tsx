import { Snackbar } from "@mui/material";
import { styled } from "@mui/material/styles";

interface CustomSnackbarProps {
  open: boolean;
  onClose: () => void;
  message: string;
  autoHideDuration?: number;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

const StyledSnackbar = styled(Snackbar)(({ theme }) => ({
  '& .MuiSnackbarContent-root': {
    backgroundColor: '#1976d2',
    color: 'white',
    borderRadius: '10px',
    padding: '12px 24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    fontSize: '0.95rem',
    fontWeight: 500,
    minWidth: 'auto',
    '&:hover': {
      backgroundColor: '#1565c0',
    },
  }
}));

export const CustomSnackbar = ({
  open,
  onClose,
  message,
  autoHideDuration = 3000,
  position = { vertical: 'bottom', horizontal: 'center' }
}: CustomSnackbarProps) => {
  return (
    <StyledSnackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      message={message}
      anchorOrigin={position}
    />
  );
};