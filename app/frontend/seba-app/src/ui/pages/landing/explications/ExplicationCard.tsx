import React from "react";
import { Icon } from "../../../components";
import { ExplicationCardType, cardDetails } from "./ExplicationCardConstants";

type ExplicationCardProps = {
  type?: keyof typeof ExplicationCardType;
};

export const ExplicationCard: React.FC<ExplicationCardProps> = (props) => {
  const explicationCardDetails =
    (props.type && cardDetails[props.type]) ||
    cardDetails[ExplicationCardType.layer];

  return (
    <div
      style={{
        width: "323px",
        height: "350px",
        borderRadius: "20px 120px 20px 80px",
        border: "3px solid #1E58EB",
        marginRight: "60px",
        color: "black",
        textAlign: "justify",
        // If you need dynamic borderWidth from cardDetails, include it:
        borderWidth: "2px",
      }}
    >
      <div
        style={{
          paddingLeft: "50px",
          paddingTop: "47px",
          paddingRight: "49px",
          display: "flex",
          justifyContent: "flex-start",
          flexDirection: "column",
        }}
      >
        <Icon path={explicationCardDetails.icon} size={50} />
        <div
          style={{
            fontFamily: "var(--font-outfit)",
            fontWeight: "var(--font-outfit-weight-bold)",
            fontSize: "var(--font-sizes-large)",
            color: "black",
            display: "flex",
            justifyContent: "flex-start",
            marginTop: "14px",
            marginBottom: "24px",
          }}
        >
          {explicationCardDetails.title}
        </div>
        <div
          style={{
            fontFamily: "var(--font-outfit)",
            fontWeight: "var(--font-outfit-weight-regular)",
            fontSize: "var(--font-sizes-small)",
            color: "black",
            display: "flex",
            justifyContent: "flex-start",
            textAlign: "justify",
          }}
        >
          <p
            style={{
              color: "black",
              textAlign: "left",
              margin: 0, // remove default paragraph margins
            }}
          >
            {explicationCardDetails.description}
          </p>
        </div>
      </div>
    </div>
  );
};
