import React from "react";
import {
  FormGroup,
  FormControlLabel,
  Switch,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import "./styles.css";

interface SortTogglesProps {
  sortByYear: boolean;
  sortByCitations: boolean;
  onToggleYear: () => void;
  onToggleCitations: () => void;
  sortOrder: "asc" | "desc";
  disabled?: boolean;
}

const SortToggles: React.FC<SortTogglesProps> = ({
  sortByYear,
  sortByCitations,
  onToggleYear,
  onToggleCitations,
  sortOrder,
  disabled,
}) => {
  return (
    <Card
      sx={{
        width: "90%",
        boxShadow: "none",
        backgroundColor: "transparent",
        "& .MuiCardContent-root": {
          padding: "16px 0",
        },
      }}
    >
      <CardContent>
        <Typography variant="h6" className="sort-title" gutterBottom>
          Sort by
        </Typography>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={sortByYear}
                onChange={onToggleYear}
                color="primary"
                disabled={disabled}
              />
            }
            label={<span className="sort-label">Year</span>}
          />
          <FormControlLabel
            control={
              <Switch
                checked={sortByCitations}
                onChange={onToggleCitations}
                color="primary"
                disabled={disabled}
              />
            }
            label={<span className="sort-label">Citations</span>}
          />
        </FormGroup>
      </CardContent>
    </Card>
  );
};

export default SortToggles;
