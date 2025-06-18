import React, { useState } from "react";
import { style } from "../../../../styles/theme/GeneralStyles";
import { strings } from "../../../../resources/strings/StringsRepo";
import { fontSizes } from "../../../../styles/sizes/FontSizes";
import { MainButton } from "../../mainButton/MainButton";

// TextEllipsis.tsx
interface TextEllipsisProps {
  text: string;
  maxLength?: number;
}

export const TextEllipsis: React.FC<TextEllipsisProps> = ({
  text = "",
  maxLength = 100,
}) => {
  const processText = (text: string, maxLength: number): string => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return <span>{processText(text, maxLength)}</span>;
};
