import React, { useState } from 'react';
import { ListItem, ListItemButton, ListItemText, IconButton, TextField, Tooltip } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { SidebarItemMenu } from './SidebarItemMenu';
import { style } from '../../../../styles';
import { SearchHistoryItemType, Project } from '../types';
import { colors } from '../../../../styles/colors/Colors';


interface SidebarItemProps {
  id: number;
  title: string;
  query_text?: string;
  subtitle?: string;
  tooltipText: string;
  sidebarOpen: boolean;
  isEditing?: boolean; 
  editValue?: string;
  type: 'project' | 'search';
  onRerun?: (query: string) => void;
  onRename: (id: number, newTitle: string) => void;
  onDelete: (id: number) => void;
  onShare?: (text: string) => void;
  onClick?: () => void;
  onAddToProject?: (event: React.MouseEvent<HTMLElement>) => void;
}

export const SidebarItem = ({
  id,
  title,
  query_text,
  subtitle,
  tooltipText,
  sidebarOpen,
  type,
  onRerun,
  onRename,
  onDelete,
  onShare,
  onClick,
  onAddToProject
}: SidebarItemProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false); 
  const [editValue, setEditValue] = useState(title);
  const [allowBlur, setAllowBlur] = useState(true);

  const handleMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRenameClick = () => {
    setIsEditing(true);
    setEditValue(title);
    setAllowBlur(false);
    setTimeout(() => setAllowBlur(true), 100);
    handleMenuClose();
  };

  const menuItem = type === 'search' ? {
    id,
    query_text: title,
    display_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    custom_title: title,
  } as SearchHistoryItemType : undefined;


  //const noop: (event?: React.MouseEvent<HTMLElement>) => void = () => {};

  const menuProps = type === 'search' 
    ? {
        item: menuItem,
        anchorEl,
        isOpen: Boolean(anchorEl),
        onClose: handleMenuClose,
        onShare: onShare ? () => onShare(title) : undefined,
        onRerun: query_text !== undefined && onRerun ? () => onRerun(query_text) : undefined,
        onEdit: handleRenameClick,
        onDelete: () => {
          onDelete(id);
          handleMenuClose();
        },
        onAddToProject: onAddToProject || (() => {}),
        type: 'search' as const
      }
    : {
        item: undefined,
        anchorEl,
        isOpen: Boolean(anchorEl),
        onClose: handleMenuClose,
        onEdit: handleRenameClick,
        onDelete: () => {
          onDelete(id);
          handleMenuClose();
        },
        onAddToProject: () => {},
        type: 'project' as const
      };

  return (
    <Tooltip 
      title={tooltipText} 
      arrow 
      placement="right"
      componentsProps={{
        tooltip: {
          sx: {
            fontSize: '14px',
            padding: '10px 14px',
            backgroundColor: colors.lightGray,
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
            maxWidth: '300px',
            color: colors.black,
            fontWeight: 400,
            lineHeight: 1.5, 
            letterSpacing: '0.15px',
          }
        },
        arrow: {
          sx: {
            color: colors.lightGray
          }
        }
      }}
      >
      <ListItem 
        disablePadding 
        sx={{ 
          display: 'block', 
        }}
      >
        <ListItemButton
          disableRipple
          onClick={onClick}
          sx={{
            py: 0.5,
            justifyContent: sidebarOpen ? 'initial' : 'center',
            borderRadius: '10px', 
            margin: '2px 16px', 
            transition: 'all 0.2s ease', 
            '&:hover': {
              backgroundColor: colors.lightGray, 
            },
            '&:hover .MuiListItemText-root': {
              color: colors.black,
              opacity: sidebarOpen ? 1 : 0,
            },
            '&:hover .dots-icon': {
              opacity: 1,
            },
          }}
        >
          {isEditing ? (
            <TextField
              autoFocus
              value={editValue}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onRename(id, editValue);
                  setIsEditing(false);
                } else if (e.key === 'Escape') {
                  setIsEditing(false);
                }
              }}
              onBlur={() => {
                if (allowBlur) {
                  setIsEditing(false);
                }
              }}
              sx={{
                width: '100%',
                '& .MuiInputBase-root': {  // Add styling for the input container
                  padding: 0,
                  height: '100%',
                },
                '& .MuiInputBase-input': {
                  color: colors.black,
                  fontSize: '0.875rem',
                  padding: '2px 4px',
                  height: "30px",
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: colors.mainColor,
                  },
                },
              }}
            />
          ) : (
            <>
              <ListItemText
                primary={title}
                secondary={subtitle}
                sx={{
                  transition: "opacity 0.1s",
                  opacity: sidebarOpen ? 0.5 : 0,
                
                "& .MuiTypography-root": {
                  overflow: "hidden",
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap",
                  maxWidth: "260px"
                }
              }}

              />
              <IconButton
                className="dots-icon"
                disableRipple
                onClick={handleMenuClick}
                sx={{
                  opacity: Boolean(anchorEl) ? 1 : 0,
                  transition: "opacity 0.2s", 
                  color: colors.darkGray,
                  "&:hover": {
                    backgroundColor: "transparent",
                    color: colors.black,
                  }
                }}
              >
                <MoreHorizIcon />
              </IconButton>
            </>
          )}
        </ListItemButton>

        <SidebarItemMenu {...menuProps} />
      </ListItem>
    </Tooltip>
  );
};