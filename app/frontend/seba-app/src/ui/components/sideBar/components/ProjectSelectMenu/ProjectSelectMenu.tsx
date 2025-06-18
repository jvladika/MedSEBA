import React from 'react';
import { Menu, MenuItem, Typography, Box } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import { Project } from '../../types';
import ReplayIcon from '@mui/icons-material/Replay';
import { colors } from '../../../../../styles/colors/Colors';
import SearchIcon from '@mui/icons-material/Search';

interface ProjectSelectMenuProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    onProjectSelect: (projectId: number | null) => void;
    projects: Project[];
    currentProjectId?: number | null;
    showSearchHistoryOption?: boolean;
    onParentMenuClose?: () => void;
}

export const ProjectSelectMenu = ({ 
    anchorEl, 
    open, 
    onClose, 
    onProjectSelect,
    projects,
    currentProjectId,
    showSearchHistoryOption = false,
    onParentMenuClose
}: ProjectSelectMenuProps) => {
    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    backgroundColor: colors.white,
                    color: colors.black,
                    minWidth: 200,
                    borderRadius: 3,
                    '& .MuiList-root': {
                        padding: '8px',
                    }
                }
            }}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right'
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left'
            }}
        >
            <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ color: colors.darkGray, px: 1 }}>
                    Move to
                </Typography>
            </Box>
            {/* Search History Option */}
            {showSearchHistoryOption && (
                <MenuItem 
                    onClick={() => {
                        onProjectSelect(null);
                        onClose();
                    }}
                    sx={{
                        borderRadius: 1.5,
                        mx: 0.5,
                        '&:hover': {
                            backgroundColor: colors.lightGray,
                        }
                    }}
                >
                    <SearchIcon sx={{ mr: 1, fontSize: 20 }} />
                    Search History
                </MenuItem>
            )}


            {/* Projects List - filtered to exclude current project */}
            {projects
                .filter(project => project.id !== currentProjectId)
                .map((project) => (
                    <MenuItem 
                        key={project.id}
                        onClick={() => {
                            onProjectSelect(project.id);
                            onClose();
                            onParentMenuClose?.();
                        }}
                        sx={{
                            borderRadius: 1.5, 
                            mx: 0.5,
                            '&:hover': {
                                backgroundColor: colors.lightGray,
                            }
                        }}
                    >
                        <FolderIcon sx={{ mr: 1, fontSize: 20 }} />
                        {project.name}
                    </MenuItem>
            ))}
        </Menu>
    );
};