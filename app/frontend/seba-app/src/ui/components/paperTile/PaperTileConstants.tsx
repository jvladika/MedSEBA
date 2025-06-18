import { strings } from "../../../resources/strings/StringsRepo";
import { style } from "../../../styles";

export enum Consensus {
  agree = "agree",
  disagree = "disagree",
  neutral = "neutral",
}

export type StylePropertiesConsensus = {
  backgroundColor: string;
  textColor: string;
  text: string;
};

type ConsensusStylesType = {
  agree: StylePropertiesConsensus;
  disagree: StylePropertiesConsensus;
  neutral: StylePropertiesConsensus;
};

export const consensusTypeStyle: ConsensusStylesType = {
  [Consensus.agree]: {
    backgroundColor: style.colors.lightGreen,
    textColor: style.colors.darkGreen,
    text: strings.agree,
  },
  [Consensus.disagree]: {
    backgroundColor: style.colors.lightRed,
    textColor: style.colors.darkRed,
    text: strings.disagree,
  },
  [Consensus.neutral]: {
    backgroundColor: style.colors.lightOrange,
    textColor: style.colors.yellow,
    text: strings.neutral,
  },
};
