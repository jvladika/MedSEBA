import {
  Grid,
  TextField,
  Modal,
  Box,
  Typography,
  Button,
  Stack,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import React from "react";

interface SearchFilters {
  publicationTypes: string[];
  yearRange: [number, number];
  maxResults: number;
  citationRange: [number, number];
}

interface SearchFilterModalProps {
  open: boolean;
  onClose: () => void;
  filters?: Partial<SearchFilters>;
  onApplyFilters: (filters: SearchFilters) => void;
}

export const SearchFilterModal = ({
  open,
  onClose,
  filters = {},
  onApplyFilters,
}: SearchFilterModalProps) => {
  const currentYear = new Date().getFullYear();

  const defaultFilters: SearchFilters = {
    publicationTypes: ["journal article", "review"],
    yearRange: [1900, currentYear],
    maxResults: 20,
    citationRange: [0, Infinity],
  };

  const [localFilters, setLocalFilters] = React.useState<SearchFilters>({
    ...defaultFilters,
    ...filters,
  });

  React.useEffect(() => {
    setLocalFilters((prev) => ({
      ...defaultFilters,
      ...filters,
    }));
  }, [filters]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "#303030",
          boxShadow: 24,
          p: 4,
          width: 400,
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
          Search Filters
        </Typography>

        <Stack spacing={3}>
          <FormGroup>
            <Typography sx={{ color: "white", mb: 1 }}>
              Publication Types
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localFilters.publicationTypes.includes(
                    "journal article"
                  )}
                  onChange={(e) => {
                    const types = e.target.checked
                      ? [...localFilters.publicationTypes, "journal article"]
                      : localFilters.publicationTypes.filter(
                          (t) => t !== "journal article"
                        );
                    setLocalFilters({
                      ...localFilters,
                      publicationTypes: types,
                    });
                  }}
                />
              }
              label="Journal Articles"
              sx={{ color: "white" }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={localFilters.publicationTypes.includes("review")}
                  onChange={(e) => {
                    const types = e.target.checked
                      ? [...localFilters.publicationTypes, "review"]
                      : localFilters.publicationTypes.filter(
                          (t) => t !== "review"
                        );
                    setLocalFilters({
                      ...localFilters,
                      publicationTypes: types,
                    });
                  }}
                />
              }
              label="Reviews"
              sx={{ color: "white" }}
            />
          </FormGroup>

          <Box>
            <Typography sx={{ color: "white", mb: 1 }}>
              Publication Year Range
            </Typography>
            <Slider
              value={localFilters.yearRange}
              onChange={(_, value) =>
                setLocalFilters({
                  ...localFilters,
                  yearRange: value as [number, number],
                })
              }
              valueLabelDisplay="auto"
              min={1900}
              max={currentYear}
              sx={{ color: "white" }}
            />
          </Box>

          <Box>
            <Typography sx={{ color: "white", mb: 1 }}>
              Citation Range
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Min Citations"
                  type="number"
                  value={localFilters.citationRange[0]}
                  onChange={(e) => {
                    const value = Math.max(0, parseInt(e.target.value) || 0);
                    setLocalFilters({
                      ...localFilters,
                      citationRange: [value, localFilters.citationRange[1]],
                    });
                  }}
                  inputProps={{ min: 0 }}
                  fullWidth
                  sx={{
                    input: { color: "white" },
                    label: { color: "white" },
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "white" },
                      "&:hover fieldset": { borderColor: "white" },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Max Citations"
                  type="number"
                  value={
                    localFilters.citationRange[1] === Infinity
                      ? ""
                      : localFilters.citationRange[1]
                  }
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? Infinity
                        : Math.max(0, parseInt(e.target.value) || 0);
                    setLocalFilters({
                      ...localFilters,
                      citationRange: [localFilters.citationRange[0], value],
                    });
                  }}
                  placeholder="Unlimited"
                  inputProps={{ min: 0 }}
                  fullWidth
                  sx={{
                    input: { color: "white" },
                    label: { color: "white" },
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "white" },
                      "&:hover fieldset": { borderColor: "white" },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Typography sx={{ color: "white", mb: 1 }}>Max Results</Typography>
            <Slider
              value={localFilters.maxResults}
              onChange={(_, value) =>
                setLocalFilters({
                  ...localFilters,
                  maxResults: value as number,
                })
              }
              valueLabelDisplay="auto"
              min={5}
              max={20}
              step={1}
              sx={{ color: "white" }}
            />
          </Box>
        </Stack>

        <Box
          sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
        >
          <Button onClick={onClose} sx={{ color: "white" }}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onApplyFilters(localFilters);
              onClose();
            }}
            variant="contained"
          >
            Apply
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
