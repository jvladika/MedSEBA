import { colors } from "../colors/Colors";
import { fontSizes } from "../sizes/FontSizes";
import { generalSizes } from "../sizes/GeneralSizes";
// Purpose: Consolidates styling-related settings and resources for the application.

// theme: Object for defining theme-specific styling. Currently empty, but can be expanded as needed.
const theme = {};

const font = {
  roboto: {
    family: "Roboto",
    weight: {
      thin: 100,
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
      black: 900,
    },
  },
  outfit: {
    family: "Outfit",
    weight: {
      thin: 100,
      light: 300,
      regular: 400,
      medium: 500,
      bold: 600,
      black: 900,
    },
  },
};

export const style = { theme, colors, fontSizes, generalSizes, font };
