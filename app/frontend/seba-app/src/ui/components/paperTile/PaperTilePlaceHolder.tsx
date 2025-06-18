// PaperTile.tsx
import React from "react";
import "./styles.css";
import { TextEllipsis } from "./textEllipsis/TextEllipsis";
import { IconAssets } from "../../../resources/icons/IconAssets";
import { Icon } from "../icon/Icon";
import {
  Card,
  Typography,
  Divider,
  CardContent,
  Chip,
  Button,
  Skeleton,
} from "@mui/material";

interface PaperTilePlaceHolderProps {
  pmid?: string;
  title?: string;
  query: string;
}

export const PaperTilePlaceHolder: React.FC<PaperTilePlaceHolderProps> = ({
  pmid,
  title,
  query,
}) => {
  return (
    <Card sx={{ width: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Divider />
        {/* <Skeleton
          sx={{
            width: "100%",
            height: "auto", // Remove fixed height
            minHeight: "200px", // Add minimum height instead
            margin: "8px 0", // Add consistent margins
            background: `linear-gradient(
              100deg,
              rgba(255, 255, 255, 0) 40%,
              rgba(255, 255, 255, 0.5) 50%,
              rgba(255, 255, 255, 0) 60%
            ) #ededed`,
            animation: "1s loading ease-in-out infinite",
            borderRadius: "20px",
          }}
        /> */}
      </CardContent>
    </Card>
  );
};
