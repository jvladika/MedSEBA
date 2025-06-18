import React from "react";
import { Card, CardContent, Grid } from "@mui/material";
import FilterResults from "../filter/FilterResults";
import SortToggles from "../sort/SortToggles";
// import "./styles.css";

interface SideOptionsProps {
  onApplyFilter: (
    yearRange: [number, number],
    citationRange: [number, number]
  ) => void;
  sortByYear: boolean;
  sortByCitations: boolean;
  onToggleYear: () => void;
  onToggleCitations: () => void;
  sortOrder: "asc" | "desc";
  isLoading: boolean;
}

const SideOptions: React.FC<SideOptionsProps> = ({
  onApplyFilter,
  sortByYear,
  sortByCitations,
  onToggleYear,
  onToggleCitations,
  sortOrder,
  isLoading,
}) => {
  return (
    <Card sx={{ width: "100%" }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <SortToggles
              sortByYear={sortByYear}
              sortByCitations={sortByCitations}
              onToggleYear={onToggleYear}
              onToggleCitations={onToggleCitations}
              sortOrder={sortOrder}
              disabled={isLoading}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FilterResults
              onApplyFilter={onApplyFilter}
              isLoading={isLoading}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
export default SideOptions;
