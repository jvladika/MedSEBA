import React, { useEffect, useState, CSSProperties } from "react";
import "./styles.css";
import Slider from "@mui/material/Slider";
import { Typography, Card, CardContent } from "@mui/material";
import { strings } from "../../../resources/strings/StringsRepo";

type FilterResultsProps = {
  onApplyFilter: (
    yearRange: [number, number],
    citationRange: [number, number]
  ) => void;
  styles?: CSSProperties;
  isLoading: boolean;
};

const FilterResults = ({
  onApplyFilter,
  styles,
  isLoading,
}: FilterResultsProps) => {
  const [publishedSince, setPublishedSince] = useState<[number, number]>([
    1950,
    new Date().getFullYear(),
  ]);

  const [citationRange, setCitationRange] = useState<[number, number]>([
    0, 1000,
  ]);

  const handleYearChange = (
    event: Event,
    newValue: number | number[],
    activeThumb: number
  ) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    const minDistance = 1;
    const [min, max] = newValue;

    if (activeThumb === 0) {
      setPublishedSince([
        Math.min(min, publishedSince[1] - minDistance),
        publishedSince[1],
      ]);
    } else {
      setPublishedSince([
        publishedSince[0],
        Math.max(max, publishedSince[0] + minDistance),
      ]);
    }
  };

  const handleCitationChange = (
    event: Event,
    newValue: number | number[],
    activeThumb: number
  ) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    const minDistance = 1;
    const [min, max] = newValue;

    if (activeThumb === 0) {
      setCitationRange([
        Math.min(min, citationRange[1] - minDistance),
        citationRange[1],
      ]);
    } else {
      setCitationRange([
        citationRange[0],
        Math.max(max, citationRange[0] + minDistance),
      ]);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      onApplyFilter(publishedSince, citationRange);
    }
  }, [publishedSince, citationRange, isLoading]);

  const sliderSx = {
    alignSelf: "center",
    width: "90%",
    marginBottom: "20px",
    marginTop: "35px",
    color: "primary.main",
    "& .MuiSlider-thumb": {
      height: "15px",
      width: "15px",
    },
    "& .MuiSlider-valueLabel": {
      backgroundColor: "transparent",
      color: "var(--color-dark-gray)",
      padding: "0px",
      fontSize: "13px",
    },
  };

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
        <Typography variant="h6" className="filter-title" gutterBottom>
          {strings.filter}
        </Typography>
        <Typography
          variant="body1"
          className="filter-category-title"
          gutterBottom
          sx={{ color: "text.primary" }}
        >
          {strings.publish}
        </Typography>
        <Slider
          value={publishedSince}
          onChange={handleYearChange}
          disableSwap
          min={1950}
          max={new Date().getFullYear()}
          valueLabelDisplay="on"
          getAriaValueText={(value) => value.toString()}
          sx={sliderSx}
        />
        <Typography
          variant="body1"
          className="filter-category-title"
          gutterBottom
          sx={{ color: "text.primary" }}
        >
          {strings.citations}
        </Typography>
        <Slider
          value={citationRange}
          onChange={handleCitationChange}
          disableSwap
          min={0}
          max={1000}
          valueLabelDisplay="on"
          getAriaValueText={(value) => value.toString()}
          sx={sliderSx}
        />
      </CardContent>
    </Card>
  );
};

export default FilterResults;
