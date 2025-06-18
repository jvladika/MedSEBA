import React, { CSSProperties, useState } from "react";
import "./styles.css";
import { IconAssets } from "../../../../resources/icons/IconAssets";
import { Icon } from "../../icon/Icon";
import { style } from "../../../../styles/theme/GeneralStyles";
import { AppRoutes } from "../../../../navigation/constants/Routes";

type PaperTileButtonProps = {
  text: string;
  documentId?: string;
  query?: string;
  title?: string;
  year?: number;
  journal?: string;
  author?: string;
};

export const PaperTileButton = (props: PaperTileButtonProps) => {
  const [isHovered, setHovered] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleFeedbackShare = (): void => {
    navigator.clipboard
      .writeText(
        `${window.location.host}${AppRoutes.results}/${props.documentId}?q=${props.query}`
      )
      .then(() => {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 1000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const handleFeedbackCite = (): void => {
    const bibtexEntry = `
      @article{${props.documentId},
        author = "${props.author || "Unknown Author"}",
        title = "${props.title || "Unknown Title"}",
        journal = "${props.journal || "Unknown Journal"}",
        year = "${props.year || "Unknown Year"}"
      }
    `.trim();

    navigator.clipboard
      .writeText(bibtexEntry)
      .then(() => {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 1000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <div
      className="paper-tile-button-container"
      onMouseEnter={() => {
        setHovered(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
      onClick={() => {
        if (props.text === "Cite") {
          handleFeedbackCite();
        } else {
          handleFeedbackShare();
        }
      }}
    >
      {showTooltip && <div className="tooltip">Copied</div>}
      <Icon
        path={props.text === "Cite" ? IconAssets.Cite : IconAssets.Share}
        fill={isHovered ? style.colors.mainColor : style.colors.gray}
        size={20}
      />
      <div
        className="paper-tile-button-container-text"
        style={{
          color: isHovered ? style.colors.mainColor : style.colors.gray,
        }}
      >
        {props.text}
      </div>
    </div>
  );
};
