import React from "react";
import { IconAssets } from "../../../resources/icons/IconAssets";
import { Icon } from "../icon/Icon";
import { strings } from "../../../resources/strings/StringsRepo";
import "./styles.css";
import { MainButton } from "../mainButton/MainButton";
import { fontSizes } from "../../../styles/sizes";

type HeaderProps = {};

export const Header = (props: HeaderProps) => {
  return (
    <div className="header-container">
      <div className="btns-container">
        {/* <MainButton
          style={{
            marginRight: 24,
            fontSize: fontSizes.medium,
            borderRadius: 40,
          }}
          text={strings.signUp}
          type="white"
          onClick={() => {}}
        /> */}
        {/* <MainButton
          style={{ fontSize: fontSizes.medium, borderRadius: 40 }}
          text={strings.signIn}
          type="blue"
          onClick={() => {}}
        /> */}
      </div>
    </div>
  );
};
