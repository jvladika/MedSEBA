import React from "react";
import { IconAssets } from "../../../../resources/icons/IconAssets";
import { strings } from "../../../../resources/strings/StringsRepo";
import { style } from "../../../../styles";
import { Typography } from "@mui/material";

const thinBorder = 1.5;
const thickBorder = 3;

export enum ExplicationCardType {
  layer = "layer",
  paperClip = "paperClip",
  chartPie = "chartPie",
}

export const cardDetails = {
  [ExplicationCardType.layer]: {
    icon: IconAssets.LayerGroup,
    title: (
      <Typography color={"black"}>{strings.fastCheckSummaries}</Typography>
    ),
    borderWidth: thickBorder,
    borderColor: style.colors.white,
    description: <Typography color={"black"}>{strings.loremIpsum}</Typography>,
  },
  [ExplicationCardType.paperClip]: {
    icon: IconAssets.PaperClip,
    title: <Typography color={"black"}>{strings.curabiturPharetra}</Typography>,
    borderWidth: thickBorder,
    borderColor: style.colors.white,
    description: (
      <Typography color={"black"}>{strings.nullamSuscipit}</Typography>
    ),
  },
  [ExplicationCardType.chartPie]: {
    icon: IconAssets.ChartPie,
    title: <Typography color={"black"}>{strings.etiamMetus}</Typography>,
    borderWidth: thickBorder,
    borderColor: style.colors.white,
    description: (
      <Typography color={"black"}>{strings.etiamMetusMaurisDesc}</Typography>
    ),
  },
};
