import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography
} from "@mui/material";
import { colors } from "../../../../../styles/colors/Colors";

interface AddProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export const AddProjectModal = ({
  open,
  onClose,
  onCreate,
}: AddProjectModalProps) => {
  const [name, setName] = useState("");
  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    onCreate(name, "");
    onClose();
    setName("");
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="xs"
      PaperProps={{
        sx: {
          backgroundColor: colors.white,
          color: colors.black,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          borderRadius: '16px',
          '& .MuiDialogTitle-root': {
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          },
        },
      }}
    >
      <DialogTitle sx={{ fontSize: '1.2rem', fontWeight: 600 }}>
        Create New Project
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.875rem',
            fontStyle: 'italic',
            color: colors.darkGray,
            mt: 1,
            fontWeight: 400,
          }}
        >
          Projects help you organize your search queries
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <TextField
          autoFocus
          margin="dense"
          placeholder='Project Name'
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              '& fieldset': {
                borderColor: colors.gray,
                transition: 'border-color 0.2s ease-in-out',
              },
              '&:hover fieldset': {
                borderColor: colors.darkGray,
              },
              '&.Mui-focused fieldset': {
                borderColor: colors.mainColor,
              },
            },
            '& .MuiInputLabel-root': {
              color: "orange",
            },
            '& .MuiInputBase-input': {
              color: colors.black,
              padding: '14px 16px',
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px' }}>
        <Button 
          disableRipple
          onClick={onClose}
          sx={{
            color: colors.black, 
            borderRadius: '10px',
            padding: '8px 16px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: colors.lightGray,
            },
          }}
        >
          Cancel
        </Button>
        <Button 
          disableRipple
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid}
          sx={{
            backgroundColor: colors.mainColorHover,
            color: colors.black,
            borderRadius: '10px',
            padding: '8px 16px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: colors.mainColor,
              color: colors.white,
            },
            '&.Mui-disabled': {
              backgroundColor: colors.gray,
              color: colors.lightGray,
            },
          }}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};
