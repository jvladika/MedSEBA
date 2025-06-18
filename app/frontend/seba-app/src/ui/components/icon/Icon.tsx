import React, { CSSProperties } from "react";
import { colors } from "../../../styles/colors/Colors";
import { style } from "../../../styles/theme/GeneralStyles";
type IconProps = {
  path: any;
  onClick?: () => void;
  size?: number;
  style?: CSSProperties;
  className?: any;
  fill?: any;
};

export const Icon = (props: IconProps) => {
  const IconComponent = props.path.ReactComponent;
  const iconSize: number = props.size ?? 40;

  return (
    <IconComponent
      width={iconSize}
      height={iconSize}
      className={props.className}
      onClick={() => {}}
      fill={props.fill}
    />
  );
};
