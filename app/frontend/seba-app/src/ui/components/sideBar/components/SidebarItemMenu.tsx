import { Menu } from "@mui/material";
import { MenuItem } from "@mui/material";
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplayIcon from '@mui/icons-material/Replay';
import FolderIcon from '@mui/icons-material/Folder'
import { SearchHistoryItemType, Project } from '../types';
import { CustomSnackbar } from "../../snackbar/CustomSnackbar";
import { useState } from 'react'; 
import { colors } from '../../../../styles/colors/Colors';

interface BaseSidebarItemMenuProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onAddToProject?: (event: React.MouseEvent<HTMLElement>) => void;
}

interface SearchHistoryMenuProps extends BaseSidebarItemMenuProps {
  type: 'search';
  item?: SearchHistoryItemType;
  onRerun?: (query: string) => void;
  onShare?: () => void;
}

interface ProjectMenuProps extends BaseSidebarItemMenuProps {
  type: 'project';
  item?: Project;
  onRerun?: never;
  onShare?: never;
}

type SidebarItemMenuProps = SearchHistoryMenuProps | ProjectMenuProps;

export const SidebarItemMenu = ({
    item,
    anchorEl,
    isOpen,
    onRerun,
    onClose,
    onDelete,
    onEdit,
    onShare,
    onAddToProject,
    type
}: SidebarItemMenuProps) => {
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const handleShare = () => {
        if (onShare) {
            onShare();
            setOpenSnackbar(true); // Show snackbar when sharing
        }
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };


    return (
        <Menu
            anchorEl={anchorEl}
            open={isOpen}
            onClose={onClose}
            PaperProps={{
                sx: {
                    backgroundColor: colors.white,
                    color: colors.black,
                    minWidth: 200,
                    padding: '4px 8px',
                    borderRadius: '10px',
                    '& .MuiMenuItem-root': {
                        gap: 1,
                        borderRadius: '6px',
                        margin: '2px 0',
                        '&:hover': {
                            backgroundColor: colors.lightGray,
                        }
                    }
                }
            }}
        >
            {type === 'search' && onRerun && item && (
                <MenuItem disableRipple onClick={() => onRerun(item.query_text)}>
                <ReplayIcon fontSize="small" />
                Rerun Search
              </MenuItem>
            )}

            {type === 'search' && (
                <MenuItem onClick={onAddToProject} disableRipple>
                    <FolderIcon fontSize="small" />
                    Move to Project
                </MenuItem>
            )}

            <MenuItem onClick={onEdit} disableRipple>
                <EditIcon fontSize="small" />
                Rename
            </MenuItem>

            <CustomSnackbar 
                open={openSnackbar}
                onClose={handleCloseSnackbar}
                message="Link copied to clipboard!"
                autoHideDuration={2000}
                position={{ vertical: "bottom", horizontal: "center" }}
            />

            {type === 'search' && (
                <MenuItem onClick={handleShare} disableRipple>
                    <ShareIcon fontSize="small" />
                    Share
                </MenuItem>
            )}
            <MenuItem
                onClick={onDelete}
                disableRipple
                sx={{
                    color: colors.red,
                    '& .MuiSvgIcon-root': { 
                        color: colors.red,
                    }
                }}
            >
                <DeleteIcon fontSize="small" />
                Delete
            </MenuItem>
        </Menu>
    )
}