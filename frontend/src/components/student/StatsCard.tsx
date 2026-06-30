// src/components/student/StatsCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  link?: string;
  linkText?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
  className?: string;
}

export function StatsCard({ 
  icon, 
  title, 
  value, 
  subtitle,
  trend,
  link,
  linkText = 'View all →',
  color = 'blue',
  className = ''
}: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  const trendColors = {
    up: 'text-green-600 bg-green-100',
    down: 'text-red-600 bg-red-100',
    neutral: 'text-gray-600 bg-gray-100'
  };

  const getTrendColor = () => {
    if (!trend) return trendColors.neutral;
    return trend.positive !== undefined 
      ? (trend.positive ? trendColors.up : trendColors.down)
      : trendColors.neutral;
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.positive === undefined) return <Minus className="w-3 h-3" />;
    return trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  const CardContent = () => (
    <div className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trend.value}%</span>
            <span className="text-gray-500 ml-1">{trend.label}</span>
          </div>
        )}
      </div>
      {link && (
        <Link to={link} className="mt-4 text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
          {linkText}
          <span className="text-xs">→</span>
        </Link>
      )}
    </div>
  );

  return link ? <Link to={link}>{CardContent()}</Link> : CardContent();
}