import { style } from "../../../styles/theme/GeneralStyles";

export enum MainButtonType {
  blue = "blue",
  white = "white",
}

export type StylesPropertiesMainButton = {
  backgroundColor: string;
  textColor: string;
  fontWeight: number;
  backgroundColorHover: string | undefined;
  textColorHover: string | undefined;
};

type MainButtonStylesType = {
  blue: StylesPropertiesMainButton;
  white: StylesPropertiesMainButton;
};

export const MainButtonTypeStyles: MainButtonStylesType = {
  [MainButtonType.blue]: {
    backgroundColor: style.colors.mainColor,
    textColor: style.colors.white,
    fontWeight: style.font.roboto.weight.regular,
    backgroundColorHover: style.colors.mainColorHover,
    textColorHover: undefined,
  },
  [MainButtonType.white]: {
    backgroundColor: style.colors.transparent,
    textColor: style.colors.gray,
    fontWeight: style.font.roboto.weight.medium,
    backgroundColorHover: undefined,
    textColorHover: style.colors.darkGray,
  },
};
