import React, { CSSProperties, useEffect, useState } from "react";
import { style } from "../../../styles";
import "./styles.css";
import { IconAssets } from "../../../resources/icons/IconAssets";
import { strings } from "../../../resources/strings/StringsRepo";


type FaqProps = {};

export const Faq = (props: FaqProps) => {

  const renderFaqSection = (): React.ReactNode => {
    return (
      <div>
        <div className="faq-header">{strings.titleFaq}</div>
        <div className="faq-sub-header">{strings.subtitleFaq}s</div>
        <div className="faq-content">
          <div className="faq-question">
                <input id="q1" type="checkbox" className="panel"/>
                <label htmlFor="q1" className="panel-title">
                    <div className="plus">+</div>
                    <span>{strings.loremIpsum}?</span>           
                </label>
                <div className="panel-content">{strings.nullamSuscipit}</div>
          </div>
          <div className="faq-question">
                <input id="q2" type="checkbox" className="panel"/>
                <label htmlFor="q2" className="panel-title">
                    <div className="plus">+</div>
                    <span>{strings.etiamMetusMaurisDesc}?</span>           
                </label>
                <div className="panel-content">{strings.nullamSuscipit}</div>
          </div>
        </div>
    </div>
    );
  };

  return (
    <div style={{ flexDirection: "column" }}>
      {renderFaqSection()}
    </div>
  );
};
