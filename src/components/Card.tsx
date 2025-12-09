import React from 'react';
import type { CardProps } from '../types';

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  padding = 'md',
  hover = false,
}) => {
  // Padding styles
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const cardClasses = `
    bg-white rounded-xl border border-gray-100 shadow-card
    ${hover ? 'card-hover cursor-pointer' : ''}
    ${paddingStyles[padding]}
    ${className}
  `.trim();

  return (
    <div className={cardClasses}>
      {(title || subtitle) && (
        <div className={`${padding !== 'none' ? 'mb-4' : ''}`}>
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
