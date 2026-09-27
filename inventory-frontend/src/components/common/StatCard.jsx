import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export const StatCard = ({
  title,
  value,
  trend,
  trendPositive = true,
  icon: Icon,
  colorScheme = "indigo",
}) => {
  const bubbleClass = `kpi-icon-bubble bubble-${colorScheme}`;

  return (
    <div className="kpi-card">
      <div>
        <div className="kpi-info-title">{title}</div>
        <div className="kpi-info-value">{value}</div>
        {trend && (
          <div
            className={`kpi-info-trend ${
              trendPositive ? "trend-up" : "trend-down"
            }`}
          >
            {trendPositive ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <span>{trend}</span>
          </div>
        )}
      </div>

      {Icon && (
        <div className={bubbleClass}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
