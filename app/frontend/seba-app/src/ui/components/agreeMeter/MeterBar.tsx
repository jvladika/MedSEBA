import React from 'react';
import { IconAssets } from "../../../resources/icons/IconAssets";
import { Icon } from "../icon/Icon";

type MeterBarProps = {
  label: string;
  percentage: number;
  colorClass: string;
};

export const MeterBar = ({ label, percentage, colorClass }: MeterBarProps) => {
  const icon = getIconByColorClass(colorClass);

  return (
    <div className="meter-bar-container">
        <div className="icon-bar-divider">
            <span className={`icon ${colorClass}`}>{<Icon path={icon} size={6.5} />}</span>
            <div className="bar-container" >
                <div className="label-container">
                    <div className="label-description">{label}</div>
                    <div className="label-percentage">{percentage.toFixed(0)}%</div>
                </div>
                <div className="bar"> 
                    <div className={`bar-foreground ${colorClass}`} style={{ width: `${percentage}%` }}></div>
                    <div className="bar-background" />
                </div>
            </div>
        </div>
    </div>
  );
};

function getIconByColorClass(colorClass: string): React.Component {
  switch (colorClass) {
    case 'agree-bar':
      return IconAssets.Checkmark;
    case 'disagree-bar':
      return IconAssets.Cross;
    default:
      return IconAssets.Dash;
  }
}