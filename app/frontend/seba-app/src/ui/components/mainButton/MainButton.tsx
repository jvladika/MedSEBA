import React, { CSSProperties, useState } from "react";
import {
  MainButtonType,
  StylesPropertiesMainButton,
  MainButtonTypeStyles,
} from "./MainButtonConstants";
import "./styles.css";

type MainButtonProps = {
  text: string;
  onClick: () => void;
  type?: keyof typeof MainButtonType;
  style?: CSSProperties;
};

export const MainButton = (props: MainButtonProps) => {
  const [isHovered, setHovered] = useState<boolean>(false);

  const typeStyles: StylesPropertiesMainButton =
    (props.type && MainButtonTypeStyles[props.type]) ||
    MainButtonTypeStyles[MainButtonType.blue];

  const containerStyles: CSSProperties = {
    backgroundColor: isHovered
      ? typeStyles.backgroundColorHover
      : typeStyles.backgroundColor,
    ...props.style,
  };

  const textStyles: CSSProperties = {
    fontWeight: typeStyles.fontWeight,
    color: isHovered ? typeStyles.textColorHover : typeStyles.textColor,
  };

  return (
    <div
      className={`btn-container`}
      onClick={props.onClick}
      style={containerStyles}
      role="button"
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
    >
      <div className="btn-text" style={textStyles}>
        {props.text}
      </div>
    </div>
  );
};
