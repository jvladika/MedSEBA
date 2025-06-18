import { IconButton, Box } from "@mui/material";
import { Icon } from "../../../icon/Icon";
import { IconAssets } from "../../../../../resources/icons/IconAssets";
import { colors } from "../../../../../styles/colors/Colors";

interface SidebarHeaderProps {
  onClick: () => void;
  sidebarOpen: boolean;
}
export const SidebarHeader = ({ onClick, sidebarOpen }: SidebarHeaderProps) => {
  return (
    <Box
      onClick={onClick}
      sx={{ 
        height: '64px', 
        minHeight: '64px', 
        display: "flex",
        alignItems: "center", 
        pl: 1,
        backgroundColor: colors.whiteGray,
        width: '100%',
        boxSizing: 'border-box',
        padding: '10px 8px', 
        position: "sticky", 
        top: 0,
        zIndex: 1000, 
      }}
    >
      <IconButton
        disableRipple
        sx={{
          p: 1,
          '&:hover': {
            backgroundColor: colors.lightGray,
          },
          '& svg': {
            fill: colors.black,
            width: '28px',
            height: '28px', 
          }
        }}
      >
        <Icon path={IconAssets.DockToRight} size={28} /> 
      </IconButton>
    </Box>
  );
};
