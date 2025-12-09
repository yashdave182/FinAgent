import React from 'react';
import type { DashboardMetric } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricsCardProps {
  metric: DashboardMetric;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ metric }) => {
  const getTrendIcon = () => {
    if (!metric.trend) return null;

    const iconClass = "w-4 h-4";

    switch (metric.trend.direction) {
      case 'up':
        return <TrendingUp className={`${iconClass} text-green-600`} />;
      case 'down':
        return <TrendingDown className={`${iconClass} text-red-600`} />;
      default:
        return <Minus className={`${iconClass} text-gray-400`} />;
    }
  };

  const getTrendColorClass = () => {
    if (!metric.trend) return 'text-gray-600';

    switch (metric.trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 hover:shadow-elevated transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">
            {metric.title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900">
              {typeof metric.value === 'number'
                ? metric.value.toLocaleString('en-IN')
                : metric.value}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {metric.subtitle}
          </p>
        </div>

        {metric.icon && (
          <div className={`p-3 rounded-lg ${metric.color || 'bg-primary-50'}`}>
            <div className="w-6 h-6 text-primary-600">
              {/* Icon would be rendered here */}
            </div>
          </div>
        )}
      </div>

      {metric.trend && (
        <div className="mt-4 flex items-center gap-1.5">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColorClass()}`}>
            {metric.trend.direction === 'up' ? '+' : metric.trend.direction === 'down' ? '-' : ''}
            {Math.abs(metric.trend.value)}%
          </span>
          <span className="text-xs text-gray-500 ml-1">
            {metric.trend.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricsCard;
